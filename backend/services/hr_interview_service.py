"""
backend/services/hr_interview_service.py

HR Interview Service & Provider Abstraction for Impulse UCEK Placement Suite.
Architectural flow:
React -> FastAPI -> HRInterviewService -> Gemini Transcription (gemini-3.5-transcribe)
      -> Backend Speech Metric Calculation (authoritative WPM = words / minutes)
      -> Gemini Evaluation (gemini-3.8-flash, structured output)
      -> Pydantic Validation -> Supabase (hr_interview_attempts) -> Response
"""

import os
import io
import re
import time
import wave
import struct
import logging
import threading
from collections import defaultdict, deque
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

from pydantic import BaseModel, Field, ValidationError
from fastapi import HTTPException

from google import genai
from google.genai import types

from dotenv import load_dotenv

from backend.ai import get_gemini_client
from backend.database import db

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))
load_dotenv()

logger = logging.getLogger("hr_interview_service")

# ─── Configuration Constants ──────────────────────────────────────────────────

HR_MAX_RECORDING_SECONDS = int(os.getenv("HR_MAX_RECORDING_SECONDS", "180"))
HR_MAX_AUDIO_SIZE_BYTES = int(os.getenv("HR_MAX_AUDIO_SIZE_BYTES", str(15 * 1024 * 1024))) # 15MB

HR_TRANSCRIPTION_PROVIDER = os.getenv("HR_TRANSCRIPTION_PROVIDER", "gemini")
HR_TRANSCRIPTION_MODEL = (
    os.getenv("GEMINI_HR_TRANSCRIPTION_MODEL")
    or os.getenv("HR_TRANSCRIPTION_MODEL")
    or "gemini-3.5-transcribe"
)

HR_EVALUATION_PROVIDER = os.getenv("HR_EVALUATION_PROVIDER", "gemini")
HR_EVALUATION_MODEL = (
    os.getenv("GEMINI_HR_EVALUATION_MODEL")
    or os.getenv("HR_EVALUATION_MODEL")
    or "gemini-3.8-flash"
)
_raw_fallback_models = (
    os.getenv("GEMINI_HR_EVALUATION_FALLBACK_MODEL")
    or os.getenv("HR_EVALUATION_FALLBACK_MODEL")
    or os.getenv("HR_EVALUATION_FALLBACK_MODELS")
    or ""
)
HR_EVALUATION_FALLBACK_MODELS = [
    m.strip()
    for m in _raw_fallback_models.split(",")
    if m.strip() and m.strip() not in ("gemini-2.5-flash", "gemini-3.5-flash")
]

# ─── Application-Level AI Rate Limiter ────────────────────────────────────────

def get_ai_requests_per_minute() -> int:
    """
    Read and validate AI_REQUESTS_PER_MINUTE from environment.
    Must be a positive integer; preserves sensible default of 10.
    """
    raw = os.getenv("AI_REQUESTS_PER_MINUTE", "10")
    try:
        val = int(raw.strip()) if isinstance(raw, str) else int(raw)
        if val > 0:
            return val
        logger.warning(f"AI_REQUESTS_PER_MINUTE must be a positive integer, got '{raw}'. Defaulting to 10.")
    except (ValueError, TypeError, AttributeError) as e:
        logger.warning(f"Invalid AI_REQUESTS_PER_MINUTE value '{raw}': {e}. Defaulting to 10.")
    return 10


class UserAIRateLimiter:
    """
    In-memory rolling-window rate limiter for external HR Interview AI requests.
    Enforces a per-authenticated-user limit within a rolling 60-second window.
    """
    def __init__(self, window_seconds: float = 60.0):
        self.window_seconds = window_seconds
        self._user_requests: Dict[str, deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def check_and_record(self, user_id: str) -> None:
        """
        Check if user is within the rate limit.
        If allowed, records the request timestamp.
        If exceeded, raises HTTPException(429) with Retry-After header.
        Blocked requests are NOT recorded and consume zero external AI provider quota.
        """
        limit = get_ai_requests_per_minute()
        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            timestamps = self._user_requests[user_id]

            # Prune timestamps older than the rolling window
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()

            if len(timestamps) >= limit:
                oldest = timestamps[0]
                retry_after = max(1, int(oldest + self.window_seconds - now + 0.999))
                logger.warning(
                    f"[AIRateLimiter] User {user_id} exceeded HR AI rate limit ({len(timestamps)}/{limit} req in {int(self.window_seconds)}s). "
                    f"Retry-After: {retry_after}s"
                )
                raise HTTPException(
                    status_code=429,
                    detail="AI request limit reached. Please wait a moment before trying again.",
                    headers={"Retry-After": str(retry_after)}
                )

            # Record this successful request within the active window
            timestamps.append(now)

            # Evict completely inactive user records periodically
            if len(self._user_requests) > 1000:
                inactive = [
                    uid for uid, dq in self._user_requests.items()
                    if not dq or dq[-1] <= cutoff
                ]
                for uid in inactive:
                    del self._user_requests[uid]


hr_ai_rate_limiter = UserAIRateLimiter(window_seconds=60.0)

SUPPORTED_MIME_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mp3",
    "audio/mpeg",
    "audio/ogg",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
}

COMMON_FILLER_WORDS = [
    "um", "uh", "er", "ah", "like", "you know", "basically", "actually",
    "literally", "sort of", "kind of", "i mean", "right"
]


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class BetterAnswer(BaseModel):
    structure: List[str] = Field(
        ...,
        description="2-4 structural steps explaining how to formulate a high-impact response to this specific question"
    )
    example: str = Field(
        ...,
        description="Exemplar professional model answer tailored specifically to this question"
    )


class HREvaluationSchema(BaseModel):
    score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="0-100 answer quality score evaluating candidate specific answer relevance, completeness, clarity and structure"
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="0-100 AI-estimated vocal delivery confidence score based strictly on observable delivery characteristics"
    )
    strengths: List[str] = Field(
        ...,
        min_length=1,
        description="2-3 specific strengths grounded strictly in the candidate's actual answer"
    )
    improvements: List[str] = Field(
        ...,
        min_length=1,
        description="2-3 concrete areas for improvement grounded strictly in the candidate's actual answer"
    )
    better_answer: BetterAnswer = Field(
        ...,
        description="Structural guidance and exemplar model answer for this specific question"
    )


class HRAnalysisResult(BaseModel):
    question_id: str
    question_text: str
    transcript: str
    duration_seconds: float
    word_count: int
    pace_wpm: float
    filler_words: List[str]
    filler_count: int
    score: float
    confidence_score: float
    strengths: List[str]
    improvements: List[str]
    better_answer: BetterAnswer
    persisted: bool
    attempt_id: Optional[str] = None


# ─── Audio Utility Functions ──────────────────────────────────────────────────

def extract_audio_duration(
    audio_bytes: bytes,
    mime_type: str,
    client_duration: Optional[float] = None
) -> float:
    """
    Extract the actual audio duration in seconds from validated client duration or raw audio bytes.
    1. Validated client duration (wall-clock measured by browser MediaRecorder session).
    2. Try standard RIFF/WAV header.
    3. Try mutagen metadata.
    4. Try WebM EBML duration / Cluster timestamps.
    """
    # 1. Validated client duration (measured directly during recording)
    if client_duration is not None:
        try:
            cd = float(client_duration)
            if cd > 0:
                return round(cd, 2)
        except (ValueError, TypeError):
            pass

    # 2. WAV header parsing
    if mime_type.lower() in ("audio/wav", "audio/x-wav", "audio/wave") or audio_bytes.startswith(b"RIFF"):
        try:
            with wave.open(io.BytesIO(audio_bytes), "rb") as wf:
                frames = wf.getnframes()
                rate = wf.getframerate()
                if rate > 0 and frames > 0:
                    dur = frames / float(rate)
                    return round(dur, 2)
        except Exception as e:
            logger.debug(f"WAV duration parse failed: {e}")

    # 3. Mutagen generic container parsing
    try:
        import mutagen
        audio_file = mutagen.File(io.BytesIO(audio_bytes))
        if audio_file is not None and hasattr(audio_file, "info") and hasattr(audio_file.info, "length"):
            length = audio_file.info.length
            if length and length > 0:
                return round(float(length), 2)
    except Exception as e:
        logger.debug(f"Mutagen duration parse failed: {e}")

    # 4. WebM / Matroska EBML parser
    try:
        # Check Info Duration (0x44, 0x89)
        idx = audio_bytes.find(b"\x44\x89")
        if idx != -1 and idx + 7 <= len(audio_bytes):
            size = audio_bytes[idx + 2]
            if size in (4, 0x84):
                val = struct.unpack(">f", audio_bytes[idx + 3:idx + 7])[0]
                if val > 0:
                    return round(val / 1000.0, 2)
            elif size in (8, 0x88) and idx + 11 <= len(audio_bytes):
                val = struct.unpack(">d", audio_bytes[idx + 3:idx + 11])[0]
                if val > 0:
                    return round(val / 1000.0, 2)

        # Fallback: scan WebM clusters (0x1F, 0x43, 0xB6, 0x75) for max timestamp (0xE7)
        cluster_pattern = b"\x1f\x43\xb6\x75"
        pos = 0
        last_tc = 0
        while True:
            pos = audio_bytes.find(cluster_pattern, pos)
            if pos == -1 or pos >= len(audio_bytes):
                break
            chunk = audio_bytes[pos:pos + 128]
            t_idx = chunk.find(b"\xe7")
            if t_idx != -1 and t_idx + 2 < len(chunk):
                raw_vlen = chunk[t_idx + 1]
                vlen = raw_vlen & 0x0F if (raw_vlen & 0x80) else raw_vlen
                data_start = t_idx + 2
                if vlen == 1 and data_start + 1 <= len(chunk):
                    tc = chunk[data_start]
                    last_tc = max(last_tc, tc)
                elif vlen == 2 and data_start + 2 <= len(chunk):
                    tc = struct.unpack(">H", chunk[data_start:data_start + 2])[0]
                    last_tc = max(last_tc, tc)
                elif vlen == 4 and data_start + 4 <= len(chunk):
                    tc = struct.unpack(">I", chunk[data_start:data_start + 4])[0]
                    last_tc = max(last_tc, tc)
            pos += 4

        if last_tc > 0:
            return round(last_tc / 1000.0, 2)
    except Exception as e:
        logger.debug(f"WebM EBML cluster scan failed: {e}")

    return 0.0


def calculate_speech_metrics(transcript: str, duration_seconds: float) -> Tuple[int, float, List[str], int]:
    """
    Deterministic backend calculation of speech metrics:
    - Word count
    - WPM = transcript word count / total recording duration in minutes
    - Exact filler words detected from verbatim transcript
    """
    words = [w for w in re.findall(r"\b[\w'-]+\b", transcript) if w]
    word_count = len(words)

    if duration_seconds > 0 and word_count > 0:
        effective_duration = max(1.0, duration_seconds)
        duration_minutes = effective_duration / 60.0
        wpm = round(word_count / duration_minutes, 1)
    else:
        wpm = 0.0

    # Deterministically detect filler words
    detected_fillers = []
    lower_transcript = transcript.lower()
    for filler in COMMON_FILLER_WORDS:
        matches = re.findall(rf"\b{re.escape(filler)}\b", lower_transcript)
        if matches:
            detected_fillers.extend([filler] * len(matches))

    unique_fillers = sorted(list(set(detected_fillers)))
    total_filler_count = len(detected_fillers)

    return word_count, wpm, unique_fillers, total_filler_count



# ─── Provider Interfaces ──────────────────────────────────────────────────────

class TranscriptionProvider(ABC):
    @abstractmethod
    def transcribe(self, audio_bytes: bytes, mime_type: str, audio_duration: float) -> str:
        """Transcribe audio verbatim. Returns transcript string."""
        pass


class EvaluationProvider(ABC):
    @abstractmethod
    def evaluate(
        self,
        question_text: str,
        transcript: str,
        word_count: int,
        pace_wpm: float,
        duration_seconds: float,
        audio_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None
    ) -> HREvaluationSchema:
        """Evaluate candidate response with structured Pydantic output."""
        pass


# ─── Gemini Transcription Provider ───────────────────────────────────────────

class GeminiTranscriptionProvider(TranscriptionProvider):
    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or HR_TRANSCRIPTION_MODEL
        self.client = get_gemini_client()

    def transcribe(self, audio_bytes: bytes, mime_type: str, audio_duration: float) -> str:
        clean_mime = mime_type.split(";")[0].strip().lower()
        if not clean_mime:
            clean_mime = "audio/webm"

        part = types.Part.from_bytes(data=audio_bytes, mime_type=clean_mime)
        prompt = (
            "Transcribe this audio verbatim. Capture all spoken words, false starts, repetitions, "
            "and verbal disfluencies (such as um, uh, like, you know) exactly as spoken. "
            "Do not normalize, omit, edit, or summarize any words."
        )

        try:
            resp = self.client.models.generate_content(
                model=self.model_name,
                contents=[part, prompt],
            )
        except Exception as e:
            logger.error(f"[GeminiTranscriptionProvider] Transcription failed with model '{self.model_name}': {e}")
            raise HTTPException(
                status_code=502,
                detail="Unable to transcribe your audio recording. Please ensure your microphone is working and speak clearly, then try again."
            )

        transcript = ""
        if resp and resp.candidates and resp.candidates[0].content and resp.candidates[0].content.parts:
            for p in resp.candidates[0].content.parts:
                if hasattr(p, "audio_transcription") and p.audio_transcription and getattr(p.audio_transcription, "text", None):
                    transcript += p.audio_transcription.text + " "
                elif hasattr(p, "text") and getattr(p, "text", None):
                    transcript += p.text + " "

        return transcript.strip()


# ─── Gemini Evaluation Provider ───────────────────────────────────────────────

EVALUATION_RESPONSE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "score": {
            "type": "number",
            "description": "0-100 answer quality score evaluating relevance, completeness, clarity and structure"
        },
        "confidence_score": {
            "type": "number",
            "description": "0-100 vocal delivery confidence score (strictly 0 to 100, e.g. 75, 82, not a decimal fraction)"
        },
        "strengths": {
            "type": "array",
            "items": {"type": "string"},
            "description": "2-3 specific strengths grounded strictly in the candidate's actual answer"
        },
        "improvements": {
            "type": "array",
            "items": {"type": "string"},
            "description": "2-3 concrete areas for improvement grounded strictly in the candidate's actual answer"
        },
        "better_answer": {
            "type": "object",
            "properties": {
                "structure": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "2-4 structural steps explaining how to formulate a high-impact response"
                },
                "example": {
                    "type": "string",
                    "description": "Exemplar professional model answer tailored specifically to this question"
                }
            },
            "required": ["structure", "example"]
        }
    },
    "required": ["score", "confidence_score", "strengths", "improvements", "better_answer"]
}


class GeminiEvaluationProvider(EvaluationProvider):
    def __init__(self, model_name: Optional[str] = None, fallback_models: Optional[List[str]] = None):
        self.primary_model = model_name or HR_EVALUATION_MODEL
        self.fallback_models = fallback_models or HR_EVALUATION_FALLBACK_MODELS
        self.client = get_gemini_client()

    def _evaluate_with_model(self, model: str, prompt: str) -> HREvaluationSchema:
        max_retries = 1
        for attempt in range(max_retries + 1):
            try:
                res = self.client.interactions.create(
                    model=model,
                    input=prompt,
                    response_format={
                        "type": "text",
                        "mime_type": "application/json",
                        "schema": EVALUATION_RESPONSE_SCHEMA
                    }
                )
                raw_text = getattr(res, "output_text", None)
                if not raw_text and hasattr(res, "steps"):
                    for s in (res.steps or []):
                        if getattr(s, "type", None) == "model_output" and hasattr(s, "content"):
                            for c in (s.content or []):
                                if hasattr(c, "text") and c.text:
                                    raw_text = c.text
                                    break
                if not raw_text:
                    raise ValueError("Interactions API returned empty evaluation text")

                cleaned_json = raw_text.strip()
                if cleaned_json.startswith("```"):
                    cleaned_json = re.sub(r"^```(?:json)?\s*", "", cleaned_json)
                    cleaned_json = re.sub(r"\s*```$", "", cleaned_json)

                parsed = HREvaluationSchema.model_validate_json(cleaned_json)

                # Normalize confidence_score if model returned a 0.0-1.0 fraction
                if 0.0 < parsed.confidence_score <= 1.0:
                    parsed.confidence_score = round(parsed.confidence_score * 100, 1)

                # Enforce bounds 0-100
                parsed.score = max(0.0, min(100.0, float(parsed.score)))
                parsed.confidence_score = max(0.0, min(100.0, float(parsed.confidence_score)))

                return parsed
            except Exception as e:
                err_str = str(e).lower()
                is_transient_503 = any(k in err_str for k in ("503", "unavailable", "high demand"))
                if is_transient_503 and attempt < max_retries:
                    backoff = 2.0
                    logger.warning(
                        f"[GeminiEvaluationProvider] Model '{model}' temporary 503/high demand spike (attempt {attempt + 1}/{max_retries + 1}): {e}. "
                        f"Retrying in {backoff:.1f}s..."
                    )
                    time.sleep(backoff)
                    continue
                raise e

    def evaluate(
        self,
        question_text: str,
        transcript: str,
        word_count: int,
        pace_wpm: float,
        duration_seconds: float,
        audio_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None
    ) -> HREvaluationSchema:
        # Handle silence or blank speech deterministically without hallucinatory scoring
        if not transcript.strip() or word_count == 0:
            return HREvaluationSchema(
                score=0.0,
                confidence_score=0.0,
                strengths=[
                    "Successfully initiated and submitted the practice session recording."
                ],
                improvements=[
                    "No audible speech detected in the recording. Please check microphone permissions and speak clearly.",
                    "Ensure your environment has minimal background noise so the microphone captures your response."
                ],
                better_answer=BetterAnswer(
                    structure=[
                        "1. Directly address the core question with a clear opening statement.",
                        "2. Provide 1-2 concrete engineering or academic examples using the STAR method.",
                        "3. Conclude with a strong takeaway connecting back to the role."
                    ],
                    example=(
                        f"A strong answer to '{question_text}' should open with a concise summary of your engineering background, "
                        "highlight relevant project milestones, and articulate why this opportunity aligns with your placement aspirations."
                    )
                )
            )

        prompt = f"""
You are an expert HR Interview Evaluator evaluating a student candidate's spoken response for campus placement recruitment at University College of Engineering, Kariavattom (UCEK).

Question Asked:
"{question_text}"

Candidate Verbatim Transcript:
"{transcript}"

Backend Deterministic Speech Facts:
- Recording Duration: {duration_seconds:.1f} seconds
- Total Spoken Word Count: {word_count} words
- Speaking Pace: {pace_wpm:.1f} WPM

EVALUATION INSTRUCTIONS:
1. ANSWER SCORE (0-100):
   Evaluate the substantive quality of the answer SPECIFICALLY for the question asked:
   - Relevance to "{question_text}"
   - Clarity, completeness, and depth
   - Structural coherence (e.g. STAR method for behavioral questions, concise point-evidence-conclusion)
   - Professionalism and maturity
   If the answer is completely disconnected from "{question_text}", the score must be below 25.

2. VOCAL DELIVERY CONFIDENCE SCORE (0-100):
   Estimate observable vocal delivery confidence (0-100 scale, e.g. 75, 85, strictly a number between 0 and 100, not a decimal fraction):
   - Presence of hesitation, long unnatural pauses, or repeated false starts
   - Vocal consistency, rhythm, and delivery stability
   - Note: This is an AI-estimated vocal-delivery confidence score, NOT a psychological diagnosis.

3. STRENGTHS & IMPROVEMENTS:
   - Provide 2-3 genuine strengths grounded strictly in the candidate's actual answer and delivery.
   - Provide 2-3 actionable, concrete improvement points grounded strictly in the candidate's actual answer.
   - GROUNDING RULE: Do NOT invent candidate experiences, projects, or achievements not present in the transcript.

4. BETTER ANSWER:
   - Provide a structural roadmap (2-4 key steps) explaining how to answer "{question_text}" effectively.
   - Provide an exemplar model answer demonstrating an outstanding response to this exact question. If referencing the candidate's college or institution in the exemplar answer, strictly use the canonical name 'University College of Engineering, Kariavattom' (UCEK) and do not invent alternate institution names.
"""

        models_to_try = [self.primary_model]
        for m in self.fallback_models:
            if m and m != self.primary_model and m not in models_to_try:
                models_to_try.append(m)

        last_error = None
        for model in models_to_try:
            try:
                return self._evaluate_with_model(model, prompt)
            except Exception as e:
                logger.warning(f"[GeminiEvaluationProvider] Model '{model}' evaluation failed: {e}")
                last_error = e

        logger.error(f"[GeminiEvaluationProvider] All evaluation models failed: {last_error}")
        err_msg = str(last_error)
        status_code = 429 if ("429" in err_msg or "rate limit" in err_msg.lower() or "too_many_requests" in err_msg.lower()) else 503
        if status_code == 429:
            detail = "The AI interview evaluation service has reached its daily request limit. Please try again later or tomorrow."
        else:
            detail = "The AI interview evaluation service is temporarily experiencing high traffic. Please try again in a few moments."
        raise HTTPException(
            status_code=status_code,
            detail=detail
        )


# ─── HR Interview Service Orchestrator ────────────────────────────────────────

class HRInterviewService:
    def __init__(
        self,
        transcription_provider: Optional[TranscriptionProvider] = None,
        evaluation_provider: Optional[EvaluationProvider] = None,
    ):
        self.transcription_provider = transcription_provider or GeminiTranscriptionProvider()
        self.evaluation_provider = evaluation_provider or GeminiEvaluationProvider()

    def process_interview_attempt(
        self,
        student_id: str,
        question_id: str,
        question_text: str,
        audio_bytes: bytes,
        mime_type: str,
        client_duration: Optional[float] = None
    ) -> HRAnalysisResult:
        """
        Orchestrates end-to-end HR interview practice processing:
        1. Validate inputs and database question record.
        2. Validate audio size and extract duration.
        3. Execute verbatim transcription with Gemini.
        4. Calculate authoritative WPM and speech metrics in backend.
        5. Execute structured evaluation with Gemini.
        6. Validate structured output with Pydantic.
        7. Persist quantitative score, pace_wpm, confidence_score to hr_interview_attempts in PostgreSQL.
        8. Return comprehensive ephemeral response to student.
        """
        # 1. Validate audio existence and size
        if not audio_bytes or len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Audio recording is empty.")

        if len(audio_bytes) > HR_MAX_AUDIO_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"Audio file size exceeds the maximum limit of {HR_MAX_AUDIO_SIZE_BYTES // (1024 * 1024)}MB."
            )

        # 2. Validate MIME type
        clean_mime = mime_type.split(";")[0].strip().lower()
        if clean_mime not in SUPPORTED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported audio format '{mime_type}'. Supported formats: {', '.join(sorted(SUPPORTED_MIME_TYPES))}"
            )

        # 3. Validate question in DB
        db_question = db.get_hr_question_by_id(question_id)
        if not db_question:
            # Fallback check by text
            all_questions = db.get_hr_questions()
            for q in all_questions:
                if q.get("question", "").strip() == question_text.strip():
                    db_question = q
                    question_id = str(q["id"])
                    break

        if not db_question:
            raise HTTPException(status_code=400, detail="Invalid question: question not found in database.")

        resolved_question_text = db_question.get("question") or question_text

        # 4. Extract audio duration server-side
        duration_seconds = extract_audio_duration(audio_bytes, mime_type, client_duration)
        if duration_seconds > HR_MAX_RECORDING_SECONDS:
            raise HTTPException(
                status_code=400,
                detail=f"Recording duration ({duration_seconds:.1f}s) exceeds maximum allowed duration ({HR_MAX_RECORDING_SECONDS}s)."
            )

        # Rate-limit check immediately before external AI request (per authenticated student)
        hr_ai_rate_limiter.check_and_record(user_id=student_id)

        # 5. Execute verbatim transcription via Gemini
        transcript = self.transcription_provider.transcribe(
            audio_bytes=audio_bytes,
            mime_type=mime_type,
            audio_duration=duration_seconds
        )

        # 6. Calculate backend authoritative speech metrics (WPM)
        word_count, pace_wpm, filler_words, filler_count = calculate_speech_metrics(
            transcript=transcript,
            duration_seconds=duration_seconds
        )

        # 7. Execute structured evaluation via Gemini
        evaluation = self.evaluation_provider.evaluate(
            question_text=resolved_question_text,
            transcript=transcript,
            word_count=word_count,
            pace_wpm=pace_wpm,
            duration_seconds=duration_seconds,
            audio_bytes=audio_bytes,
            mime_type=mime_type
        )

        # 8. Persist quantitative results to PostgreSQL (hr_interview_attempts)
        saved = db.save_hr_interview_attempt(
            student_id=student_id,
            question_id=question_id,
            score=evaluation.score,
            pace_wpm=pace_wpm,
            confidence_score=evaluation.confidence_score
        )

        if not saved:
            logger.error(f"[HRInterviewService] Failed to persist attempt for student {student_id}")
            raise HTTPException(
                status_code=500,
                detail="Analysis succeeded but failed to persist interview attempt to database."
            )

        return HRAnalysisResult(
            question_id=question_id,
            question_text=resolved_question_text,
            transcript=transcript,
            duration_seconds=duration_seconds,
            word_count=word_count,
            pace_wpm=pace_wpm,
            filler_words=filler_words,
            filler_count=filler_count,
            score=evaluation.score,
            confidence_score=evaluation.confidence_score,
            strengths=evaluation.strengths,
            improvements=evaluation.improvements,
            better_answer=evaluation.better_answer,
            persisted=True
        )


# Singleton instance
hr_interview_service = HRInterviewService()
