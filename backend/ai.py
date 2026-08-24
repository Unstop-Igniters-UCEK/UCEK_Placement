import os
import json
import time
from dotenv import load_dotenv
from fastapi import HTTPException

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv()

try:
    # pyrefly: ignore [missing-import]
    from google import genai
    # pyrefly: ignore [missing-import]
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    genai = None
    types = None

SUPPORTED_MODELS = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

def get_gemini_client():
    if not HAS_GENAI:
        raise HTTPException(
            status_code=500,
            detail="Google GenAI library is not installed on the backend server. Run 'pip install google-genai'."
        )
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured in environment variables on the backend server (Render.com). Please add GEMINI_API_KEY under Render Environment settings."
        )
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize Gemini Client: {str(e)}"
        )

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract clean plain text from PDF bytes using PyPDF/PyPDF2 or Gemini inline PDF parser."""
    # Try pypdf / PyPDF2
    try:
        import io
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted = [page.extract_text() for page in reader.pages if page.extract_text()]
        if extracted:
            return "\n".join(extracted).strip()
    except Exception:
        pass

    try:
        import io
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        extracted = [page.extract_text() for page in reader.pages if page.extract_text()]
        if extracted:
            return "\n".join(extracted).strip()
    except Exception:
        pass

    # Gemini inline PDF parsing fallback
    try:
        client = get_gemini_client()
        contents = [
            types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
            "Extract and clean all readable plain text from this resume PDF. Return ONLY the plain text of the resume."
        ]
        for model_name in SUPPORTED_MODELS:
            try:
                res = client.models.generate_content(model=model_name, contents=contents)
                if res and res.text:
                    return res.text.strip()
            except Exception:
                continue
    except Exception as e:
        print("Gemini PDF extraction warning:", e)

    # Basic regex text cleanup fallback
    try:
        import re
        raw = pdf_bytes.decode("latin1", errors="ignore")
        found = re.findall(r"\((.*?)\)", raw)
        if found and len(found) > 10:
            return " ".join([f for f in found if len(f) > 2])
    except Exception:
        pass

    return ""

def generate_gemini_json(client, contents, config=None):
    if not client:
        return None
    last_err = None
    for model_name in SUPPORTED_MODELS:
        for attempt in range(2):
            try:
                res_config = config or types.GenerateContentConfig(response_mime_type="application/json")
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=res_config
                )
                if response and response.text:
                    raw_text = response.text.strip()
                    if raw_text.startswith("```json"):
                        raw_text = raw_text[7:]
                    if raw_text.startswith("```"):
                        raw_text = raw_text[3:]
                    if raw_text.endswith("```"):
                        raw_text = raw_text[:-3]
                    return json.loads(raw_text.strip())
            except Exception as e:
                last_err = e
                err_str = str(e).lower()
                print(f"Gemini API error with model {model_name} (attempt {attempt+1}):", e)
                # Fallback retry without json mime-type enforcement if failed
                try:
                    res_raw = client.models.generate_content(model=model_name, contents=contents)
                    if res_raw and res_raw.text:
                        import re
                        match = re.search(r'\{.*\}', res_raw.text.strip(), re.DOTALL)
                        if match:
                            return json.loads(match.group(0))
                except Exception as e2:
                    print(f"Gemini raw fallback retry error with model {model_name}:", e2)

                if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "rate" in err_str:
                    time.sleep(1.5)
                    continue
                break

    if last_err:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini AI API Error ({type(last_err).__name__}): {str(last_err)}. Please verify GEMINI_API_KEY in Render.com settings."
        )
    return None

def analyze_resume_with_gemini(resume_text: str, job_role: str = "Software Engineer") -> dict:
    client = get_gemini_client()
    
    prompt = f"""You are a Senior Technical Recruiter at top IT firms. Review the following resume text for a candidate applying for the role '{job_role}'.

Resume Text:
\"\"\"
{resume_text}
\"\"\"

Return ONLY a valid JSON object matching this exact structure:
{{
  "overallScore": 84,
  "atsScore": 88,
  "impactScore": 79,
  "formattingScore": 90,
  "summary": "Candidate demonstrates solid technical foundations with well-structured project experiences.",
  "missingKeywords": ["Docker", "Kubernetes", "Redis", "CI/CD Pipelines", "Unit Testing"],
  "strengths": ["Clear technical stack listed", "Structured educational background", "Relevant project experience"],
  "improvements": [
    {{
      "category": "Impact & Metrics",
      "issue": "Lacks quantified outcomes",
      "original": "Worked on frontend features and APIs.",
      "originalBullet": "Worked on frontend features and APIs.",
      "suggested": "Engineered 4+ high-throughput REST APIs and responsive UI, accelerating page load speeds by 35%.",
      "revisedBullet": "Engineered 4+ high-throughput REST APIs and responsive UI, accelerating page load speeds by 35%.",
      "suggestion": "Quantify achievements using the STAR method with percentages and metric numbers."
    }}
  ]
}}"""

    result = generate_gemini_json(client, prompt)
    if result and isinstance(result, dict):
        improvements = result.get("improvements") or result.get("bulletImprovements") or []
        if isinstance(improvements, list):
            for imp in improvements:
                if isinstance(imp, dict):
                    orig = imp.get("original") or imp.get("originalBullet") or ""
                    rev = imp.get("suggested") or imp.get("revised") or imp.get("revisedBullet") or ""
                    imp["original"] = orig
                    imp["originalBullet"] = orig
                    imp["revised"] = rev
                    imp["suggested"] = rev
                    imp["revisedBullet"] = rev
        result["improvements"] = improvements
        result["bulletImprovements"] = improvements
        if "missingKeywords" not in result:
            result["missingKeywords"] = result.get("missing_keywords") or []
        if "strengths" not in result:
            result["strengths"] = []
        return result

    raise HTTPException(
        status_code=500,
        detail="Gemini AI failed to return structured resume analysis JSON."
    )

def match_jd_with_gemini(job_title: str, company: str, jd_text: str, resume_text: str) -> dict:
    client = get_gemini_client()

    prompt = f"""Compare the candidate's resume against the Job Description for '{job_title}' at '{company}'.

Job Description:
\"\"\"
{jd_text}
\"\"\"

Resume Text:
\"\"\"
{resume_text}
\"\"\"

Return ONLY a valid JSON object matching this structure:
{{
  "matchPercentage": 82,
  "interviewChance": 75,
  "matchingSkills": ["React", "TypeScript", "SQL", "Git", "REST APIs"],
  "missingSkills": ["Docker", "AWS", "Microservices", "CI/CD"],
  "tailoredBullets": [
    "Engineered robust REST API microservices handling 500+ requests/sec using Node.js and SQL.",
    "Integrated modern responsive UI with React and TypeScript, optimizing client-side rendering."
  ],
  "summary": "Candidate matches core frontend and database requirements but lacks cloud deployment keywords."
}}"""

    result = generate_gemini_json(client, prompt)
    if result and isinstance(result, dict):
        return result

    raise HTTPException(
        status_code=500,
        detail="Gemini AI failed to process Job Description matching."
    )

def enhance_bullet_with_gemini(bullet_text: str, target_role: str = "Software Engineer") -> dict:
    client = get_gemini_client()

    prompt = f"""Rewrite the following resume bullet point using the STAR (Situation, Task, Action, Result) method with strong action verbs for the role '{target_role}':

Original Bullet:
\"{bullet_text}\"

Return ONLY a valid JSON object matching this exact structure:
{{
  "original": "{bullet_text}",
  "enhanced": "Engineered high-performance module for {target_role}, accelerating throughput by 35% and cutting API latency by 120ms.",
  "explanation": "Applied STAR format with strong action verb and quantified outcome metrics.",
  "enhancedBullets": [
    "Spearheaded optimization of {bullet_text}, increasing overall processing speed by 40% and cutting latency by 120ms.",
    "Architected modular microservices for {bullet_text}, enabling seamless horizontal scaling across cloud deployments.",
    "Implemented robust state management for {bullet_text}, increasing overall test coverage to 92% across deployment builds."
  ]
}}"""

    result = generate_gemini_json(client, prompt)
    if result and isinstance(result, dict):
        if "enhanced" not in result and "enhancedBullets" in result and len(result["enhancedBullets"]) > 0:
            result["enhanced"] = result["enhancedBullets"][0]
        if "original" not in result:
            result["original"] = bullet_text
        if "explanation" not in result:
            result["explanation"] = "Applied STAR format with strong action verbs and quantified impact metrics."
        return result

    raise HTTPException(
        status_code=500,
        detail="Gemini AI failed to enhance bullet point."
    )

def analyze_interview_with_gemini(question_text: str, transcript_text: str = None, audio_b64: str = None, mime_type: str = "audio/webm") -> dict:
    client = get_gemini_client()

    contents = []
    
    if audio_b64:
        try:
            import base64
            audio_bytes = base64.b64decode(audio_b64.split(",")[-1] if "," in audio_b64 else audio_b64)
            contents.append(types.Part.from_bytes(data=audio_bytes, mime_type=mime_type))
        except Exception as err:
            print("Error decoding audio bytes for Gemini:", err)

    text_prompt = f"""
You are a Senior Technical Interviewer evaluating a candidate's spoken audio response for campus recruitment.
Question Asked: "{question_text}"
Candidate Transcript / Context: "{transcript_text or 'Audio recording provided.'}"

CRITICAL EVALUATION INSTRUCTIONS:
1. Listen carefully to the candidate's audio recording.
2. If the audio is silent, blank, contains no words, or only background noise, evaluate it as silence/no response (overallScore <= 15, confidenceScore <= 15, strengths: ["Recorded audio payload delivered."], areasForImprovement: ["No spoken response detected in recording. Speak your answer clearly into the microphone."]).
3. If the candidate spoke, evaluate technical accuracy, clarity, confidence, tone, and STAR structuring.

Return ONLY a valid JSON object matching this structure:
{{
  "overallScore": <number 0-100>,
  "confidenceScore": <number 0-100>,
  "technicalAccuracy": <number 0-100>,
  "aiFeedback": {{
    "strengths": [<string array of 2-3 key strengths>],
    "areasForImprovement": [<string array of 2-3 areas to polish>],
    "idealAnswerSnippet": "<string expert exemplar answer snippet for this question>"
  }}
}}
"""
    contents.append(text_prompt)

    result = generate_gemini_json(client, contents)
    if result:
        return result

    raise HTTPException(
        status_code=500,
        detail="Gemini AI failed to evaluate interview recording."
    )

