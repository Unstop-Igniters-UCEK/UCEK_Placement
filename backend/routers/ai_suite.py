import uuid
from datetime import datetime
from fastapi import APIRouter, Depends
from backend.auth import get_current_user
from backend.database import db
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

    # Persist interview simulation record for student and admin analytics tracking
    confidence = result.get("confidenceScore", 80)
    overall = result.get("overallScore", 80)
    wpm = int(120 + (confidence / 100) * 30)
    filler_count = int(max(0, round((100 - confidence) / 25)))
    star_aligned = bool(overall >= 75)

    record = {
        "id": f"int_{uuid.uuid4().hex[:8]}",
        "userId": current_user["id"],
        "userName": current_user.get("name", "Student"),
        "questionText": req.questionText,
        "overallScore": overall,
        "confidenceScore": confidence,
        "technicalAccuracy": result.get("technicalAccuracy", 80),
        "wpm": wpm,
        "fillerCount": filler_count,
        "starAligned": star_aligned,
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "timestamp": datetime.utcnow().isoformat()
    }
    db.interviewResponses.append(record)
    db.save()

    # Direct Supabase relational table persistence if table exists
    from backend.database import supabase_client
    if supabase_client:
        try:
            supabase_client.table("speech_evaluations").upsert({
                "id": record["id"],
                "user_id": current_user["id"],
                "question_text": req.questionText,
                "wpm": wpm,
                "confidence_score": confidence,
                "star_aligned": star_aligned,
                "filler_count": filler_count,
                "overall_rating": float(round(overall / 10.0, 1)),
                "feedback_json": result.get("aiFeedback", {}),
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            print("[Supabase speech_evaluations insert notice]:", e)

    return {"evaluation": result}


@router.get("/speech-analytics")
def get_speech_analytics(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Try fetching directly from Supabase speech_evaluations relational table first
    from backend.database import supabase_client
    evaluations = []
    if supabase_client:
        try:
            res = supabase_client.table("speech_evaluations").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            if res.data:
                evaluations = res.data
        except Exception as e:
            print("[Supabase fetch speech_evaluations notice]:", e)

    # Fallback to db.interviewResponses
    if not evaluations:
        user_responses = [r for r in getattr(db, "interviewResponses", []) if r.get("userId") == user_id]
        if user_responses:
            user_responses.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            evaluations = [{
                "wpm": r.get("wpm", int(120 + (r.get("confidenceScore", 80) / 100) * 30)),
                "confidence_score": r.get("confidenceScore", 80),
                "star_aligned": r.get("starAligned", r.get("overallScore", 80) >= 75),
                "filler_count": r.get("fillerCount", 0),
                "created_at": r.get("timestamp")
            } for r in user_responses]

    if evaluations:
        latest = evaluations[0]
        avg_wpm = int(sum(e.get("wpm", 130) for e in evaluations) / len(evaluations))
        avg_confidence = int(sum(e.get("confidence_score", 80) for e in evaluations) / len(evaluations))
        latest_star = "Aligned" if latest.get("star_aligned", True) else "Needs Work"
        total_fillers = sum(e.get("filler_count", 0) for e in evaluations)
    else:
        # Default baseline if user has not yet recorded any sessions
        avg_wpm = 135
        avg_confidence = 92
        latest_star = "Aligned"
        total_fillers = 0

    featured_prompts = [
        "Tell me about a technical project challenge at UCEK and how you solved it.",
        "Why do you want to join our core engineering team?"
    ]

    return {
        "wpm": avg_wpm,
        "confidenceScore": avg_confidence,
        "starFramework": latest_star,
        "fillerCount": f"{total_fillers} Detects" if total_fillers > 0 else "0 Detects",
        "totalEvaluations": len(evaluations),
        "featuredPrompts": featured_prompts
    }


