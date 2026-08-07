from fastapi import APIRouter, Depends
from backend.auth import get_current_user
from backend.schemas import (
    ReviewResumeRequest, MatchJDRequest,
    EnhanceBulletRequest, AnalyzeInterviewRequest
)
from backend.ai import (
    analyze_resume_with_gemini, match_jd_with_gemini,
    enhance_bullet_with_gemini, analyze_interview_with_gemini
)

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/review-resume")
def review_resume(req: ReviewResumeRequest, current_user: dict = Depends(get_current_user)):
    result = analyze_resume_with_gemini(req.resumeText, req.jobRole or "Software Engineer")
    return {"review": result}

@router.post("/match-jd")
def match_jd(req: MatchJDRequest, current_user: dict = Depends(get_current_user)):
    result = match_jd_with_gemini(req.jobTitle, req.company, req.jdText, req.resumeText)
    return {"match": result}

@router.post("/enhance-bullet")
def enhance_bullet(req: EnhanceBulletRequest, current_user: dict = Depends(get_current_user)):
    result = enhance_bullet_with_gemini(req.bulletText, req.targetRole or "Software Engineer")
    return result

@router.post("/analyze-interview")
def analyze_interview(req: AnalyzeInterviewRequest, current_user: dict = Depends(get_current_user)):
    result = analyze_interview_with_gemini(
        question_text=req.questionText,
        transcript_text=req.transcriptText or req.transcript or "",
        audio_b64=req.audioBase64,
        mime_type=req.mimeType or "audio/webm"
    )
    return {"evaluation": result}
