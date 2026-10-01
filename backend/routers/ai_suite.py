"""
routers/ai_suite.py — AI-powered resume and interview endpoints.
Aligned with Impulse_DB_Design.md §26 (AI Resume Review) and §27–§28 (HR Practice).

Only the AI Reviewer result is stored (in resume_reviews).
JD Matcher results are ephemeral and NOT stored.
HR interview attempt quantitative results are stored in hr_interview_attempts.
"""

import uuid
import base64
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from backend.auth import get_current_user, get_current_user_optional
from backend.database import db, supabase_client
from backend.schemas import (
    ReviewResumeRequest, MatchJDRequest,
    EnhanceBulletRequest, AnalyzeInterviewRequest
)
from backend.ai import (
    review_resume_with_gemini, analyze_resume_with_gemini, match_jd_with_gemini,
    enhance_bullet_with_gemini,
    extract_text_from_pdf_bytes
)
from backend.services.hr_interview_service import hr_interview_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ─── PDF Parsing ──────────────────────────────────────────────────────────────

@router.post("/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    """Extract clean plain text from an uploaded PDF file."""
    try:
        contents = await file.read()
        extracted_text = extract_text_from_pdf_bytes(contents)
        if not extracted_text or len(extracted_text.strip()) < 30:
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF appears to be a scanned image or contains non-selectable text. Please export your resume as a text-selectable PDF from Google Docs, MS Word, or Canva."
            )
        return {"text": extracted_text, "filename": file.filename}
    except HTTPException:
        raise
    except Exception as e:
        print("[Parse PDF error]:", e)
        raise HTTPException(status_code=400, detail=f"Unable to extract text from PDF: {str(e)}")


# ─── AI Resume Review ─────────────────────────────────────────────────────────

@router.post("/review-resume")
def review_resume(req: ReviewResumeRequest, current_user: dict = Depends(get_current_user)):
    """
    Run an AI ATS resume review and persist the result.
    ONE click = ONE Gemini request. Zero mock or fallback data.
    The ATS score feeds into the readiness calculation.
    """
    if not req.resumeText or len(req.resumeText.strip()) < 30:
        raise HTTPException(
            status_code=400,
            detail="The resume text is empty or too short. Please upload a PDF with selectable text."
        )

    # Selected domain is the only target context
    domain = (req.jobRole or "").strip() or current_user.get("domain") or "Software Engineering"

    # Exactly ONE Gemini request — raises 503 on AI failure
    result = review_resume_with_gemini(req.resumeText, domain)

    ats_score: float = float(result.get("ats_score", 0))

    # Resolve domain_id — use student's current domain if not provided
    domain_id = req.domain_id or current_user.get("domain_id")

    # Persist in resume_reviews (one row per student, upsert)
    if supabase_client and domain_id:
        try:
            now = datetime.utcnow().isoformat()

            # Check if a review row already exists
            existing_res = supabase_client.table("resume_reviews").select("id, resume_revision").eq("student_id", current_user["id"]).execute()

            improvement_points = result.get("bullet_recommendations", [])

            if existing_res.data:
                existing = existing_res.data[0]
                revision = int(existing.get("resume_revision", 1)) + 1
                supabase_client.table("resume_reviews").update({
                    "domain_id": domain_id,
                    "ats_score": ats_score,
                    "improvement_points": improvement_points,
                    "resume_revision": revision,
                    "reviewed_at": now,
                    "updated_at": now,
                }).eq("student_id", current_user["id"]).execute()
            else:
                # Need a resume_id — get or create student resume
                resume_id = None
                r_res = supabase_client.table("student_resumes").select("id").eq("student_id", current_user["id"]).execute()
                if r_res.data:
                    resume_id = r_res.data[0]["id"]
                else:
                    # Create a minimal placeholder resume row so the FK is satisfied
                    ins_res = supabase_client.table("student_resumes").insert({
                        "student_id": current_user["id"],
                        "source_type": "uploaded",
                        "template_type": "ats",
                        "created_at": now,
                        "updated_at": now,
                    }).execute()
                    if ins_res.data:
                        resume_id = ins_res.data[0]["id"]

                if resume_id:
                    supabase_client.table("resume_reviews").insert({
                        "student_id": current_user["id"],
                        "resume_id": resume_id,
                        "domain_id": domain_id,
                        "ats_score": ats_score,
                        "improvement_points": improvement_points,
                        "resume_revision": 1,
                        "reviewed_at": now,
                        "updated_at": now,
                    }).execute()

            # Recalculate readiness snapshot
            db.calculate_and_store_readiness(current_user["id"])

        except Exception as e:
            print(f"[review-resume persist {current_user['id']}]:", e)

    return {"review": result, "ats_score": ats_score}


# ─── JD Matcher (ephemeral — not stored) ─────────────────────────────────────

@router.post("/match-jd")
def match_jd(req: MatchJDRequest, current_user: dict = Depends(get_current_user)):
    """Match resume against a job description using Gemini AI. Results are not stored."""
    result = match_jd_with_gemini(req.jobTitle, req.company, req.jdText, req.resumeText)
    return {"match": result}


# ─── Bullet Enhancer ─────────────────────────────────────────────────────────

@router.post("/enhance-bullet")
def enhance_bullet(req: EnhanceBulletRequest, current_user: dict = Depends(get_current_user)):
    result = enhance_bullet_with_gemini(req.bulletText, req.targetRole or "Software Engineer")
    return result


# ─── HR Practice Questions ────────────────────────────────────────────────────

@router.get("/hr-questions")
def get_hr_practice_questions(
    companyTag: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Fetch active HR practice questions from hr_practice_questions table.
    See Impulse_DB_Design.md §27.
    """
    questions = db.get_hr_questions()
    return {
        "questions": [
            {
                "id": str(q["id"]),
                "question": str(q.get("question", "")),
                "questionText": str(q.get("question", "")),
                "companyTag": companyTag or "all",
                "category": "HR",
                "is_active": bool(q.get("is_active", True)),
            }
            for q in questions
        ]
    }


# ─── HR Interview Analysis ────────────────────────────────────────────────────

@router.post("/analyze-interview")
def analyze_interview(req: AnalyzeInterviewRequest, current_user: dict = Depends(get_current_user)):
    """
    AI evaluation of a recorded HR interview answer using HRInterviewService.
    - Transcription: gemini-3.5-transcribe
    - Backend speech metric calculation (authoritative WPM = words / minutes)
    - Evaluation: gemini-3.8-flash (structured Pydantic schema)
    - Persists score, pace_wpm, confidence_score in hr_interview_attempts.
    """
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can submit HR interview practice attempts.")

    if not req.audioBase64:
        raise HTTPException(status_code=400, detail="Audio recording is required.")

    # Decode base64 audio
    try:
        raw_b64 = req.audioBase64.split(",")[-1] if "," in req.audioBase64 else req.audioBase64
        audio_bytes = base64.b64decode(raw_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid audio base64 payload.")

    analysis = hr_interview_service.process_interview_attempt(
        student_id=current_user["id"],
        question_id=req.question_id or "",
        question_text=req.questionText,
        audio_bytes=audio_bytes,
        mime_type=req.mimeType or "audio/webm",
        client_duration=req.durationSeconds
    )

    return {
        "evaluation": {
            "overallScore": analysis.score,
            "confidenceScore": analysis.confidence_score,
            "wpm": analysis.pace_wpm,
            "pace_wpm": analysis.pace_wpm,
            "durationSeconds": analysis.duration_seconds,
            "wordCount": analysis.word_count,
            "fillerWords": analysis.filler_words,
            "fillerCount": analysis.filler_count,
            "transcript": analysis.transcript,
            "technicalAccuracy": analysis.score,
            "tone": "Confident & Articulate" if analysis.confidence_score >= 80 else ("Developing Confidence" if analysis.confidence_score >= 60 else "Hesitant"),
            "aiFeedback": {
                "strengths": analysis.strengths,
                "areasForImprovement": analysis.improvements,
                "idealAnswerSnippet": analysis.better_answer.example,
                "structure": analysis.better_answer.structure,
            },
            "betterAnswer": {
                "structure": analysis.better_answer.structure,
                "example": analysis.better_answer.example,
            }
        }
    }


# ─── Speech / HR Analytics ────────────────────────────────────────────────────

@router.get("/speech-analytics")
def get_speech_analytics(current_user: dict = Depends(get_current_user)):
    """
    Return HR interview analytics for the authenticated student.
    Uses hr_interview_attempts table as source of truth.
    Featured questions come dynamically from hr_practice_questions table.
    """
    hr_questions = db.get_hr_questions()
    featured_prompts = [q.get("question", "") for q in hr_questions[:2] if q.get("question")]

    base_response = {
        "featuredPrompts": featured_prompts,
    }

    if current_user.get("role") != "student":
        return {
            **base_response,
            "hasEvaluations": False,
            "wpm": None,
            "confidenceScore": None,
            "score": None,
            "totalEvaluations": 0,
        }

    latest = db.get_student_latest_hr_attempt(current_user["id"])
    attempts = db.get_student_hr_attempts(current_user["id"])

    if not latest or not attempts:
        return {
            **base_response,
            "hasEvaluations": False,
            "wpm": None,
            "confidenceScore": None,
            "score": None,
            "totalEvaluations": 0,
        }

    return {
        **base_response,
        "hasEvaluations": True,
        "wpm": float(latest.get("pace_wpm", 0)),
        "confidenceScore": float(latest.get("confidence_score", 0)),
        "score": float(latest.get("score", 0)),
        "totalEvaluations": len(attempts),
        "latest": {
            "score": float(latest.get("score", 0)),
            "pace_wpm": float(latest.get("pace_wpm", 0)),
            "confidence_score": float(latest.get("confidence_score", 0)),
            "completed_at": str(latest.get("completed_at", "")),
        },
    }


# ─── Resume Builder persistence ───────────────────────────────────────────────

@router.get("/resume")
def get_resume(current_user: dict = Depends(get_current_user)):
    """Return the student's persisted resume."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only.")
    resume = db.get_student_resume(current_user["id"])
    return {"resume": resume}


@router.put("/resume")
def save_resume(req: dict, current_user: dict = Depends(get_current_user)):
    """Save (upsert) the student's resume data."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Students only.")

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    resume_id = db.upsert_student_resume(current_user["id"], req)
    if not resume_id:
        raise HTTPException(status_code=500, detail="Failed to save resume.")

    # Handle section sub-tables
    now = datetime.utcnow().isoformat()

    def _replace_section(table: str, items: list, build_row):
        try:
            supabase_client.table(table).delete().eq("resume_id", resume_id).execute()
            for i, item in enumerate(items):
                row = build_row(item, i)
                row["resume_id"] = resume_id
                supabase_client.table(table).insert(row).execute()
        except Exception as e:
            print(f"[save_resume section {table}]:", e)

    if "skills" in req and req["skills"] is not None:
        _replace_section("resume_skills", req["skills"], lambda s, i: {
            "skill": str(s.get("skill", "")),
            "category": s.get("category"),
            "sort_order": i,
        })

    if "projects" in req and req["projects"] is not None:
        _replace_section("resume_projects", req["projects"], lambda p, i: {
            "title": str(p.get("title", "")),
            "description": p.get("description"),
            "technologies": p.get("technologies"),
            "project_url": p.get("project_url"),
            "sort_order": i,
        })

    if "experience" in req and req["experience"] is not None:
        _replace_section("resume_experience", req["experience"], lambda e, i: {
            "entry_type": str(e.get("entry_type", "experience")),
            "organization": str(e.get("organization", "")),
            "role": str(e.get("role", "")),
            "description": e.get("description"),
            "start_date": e.get("start_date"),
            "end_date": e.get("end_date"),
            "is_current": bool(e.get("is_current", False)),
            "sort_order": i,
        })

    if "education" in req and req["education"] is not None:
        _replace_section("resume_education", req["education"], lambda ed, i: {
            "institution": str(ed.get("institution", "")),
            "degree": str(ed.get("degree", "")),
            "field_of_study": ed.get("field_of_study"),
            "start_year": ed.get("start_year"),
            "end_year": ed.get("end_year"),
            "grade": ed.get("grade"),
            "sort_order": i,
        })

    if "certifications" in req and req["certifications"] is not None:
        _replace_section("resume_certifications", req["certifications"], lambda c, i: {
            "name": str(c.get("name", "")),
            "issuer": c.get("issuer"),
            "issue_date": c.get("issue_date"),
            "credential_url": c.get("credential_url"),
            "sort_order": i,
        })

    if "achievements" in req and req["achievements"] is not None:
        _replace_section("resume_achievements", req["achievements"], lambda a, i: {
            "title": str(a.get("title", "")),
            "description": a.get("description"),
            "sort_order": i,
        })

    return {"message": "Resume saved successfully.", "resume_id": str(resume_id)}
