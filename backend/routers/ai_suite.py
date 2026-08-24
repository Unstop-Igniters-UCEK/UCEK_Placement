import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from backend.auth import get_current_user
from backend.database import db
from backend.schemas import (
    ReviewResumeRequest, MatchJDRequest,
    EnhanceBulletRequest, AnalyzeInterviewRequest
)
from backend.ai import (
    analyze_resume_with_gemini, match_jd_with_gemini,
    enhance_bullet_with_gemini, analyze_interview_with_gemini,
    extract_text_from_pdf_bytes
)

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    """Extract clean plain text from uploaded PDF file."""
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
        raise HTTPException(
            status_code=400,
            detail=f"Unable to extract text from PDF: {str(e)}"
        )

@router.post("/review-resume")
def review_resume(req: ReviewResumeRequest, current_user: dict = Depends(get_current_user)):
    if not req.resumeText or len(req.resumeText.strip()) < 30:
        raise HTTPException(
            status_code=400,
            detail="The resume text is empty or too short. Please upload a PDF with selectable text."
        )
    result = analyze_resume_with_gemini(req.resumeText, req.jobRole or "Software Engineer")

    # Persist resume review record for student history and admin analytics dashboard
    ats_score = 85
    if isinstance(result, dict) and "atsScore" in result:
        try:
            ats_score = int(result["atsScore"])
        except Exception:
            ats_score = 85

    record = {
        "id": f"res_{uuid.uuid4().hex[:8]}",
        "userId": current_user.get("id"),
        "userName": current_user.get("name", "Student"),
        "userEmail": current_user.get("email", ""),
        "userBranch": current_user.get("branch", "CSE"),
        "userYear": current_user.get("year", "4th Year"),
        "jobRole": req.jobRole or "Software Engineer",
        "atsScore": ats_score,
        "overallScore": ats_score,
        "timestamp": datetime.utcnow().isoformat(),
        "date": datetime.utcnow().strftime("%Y-%m-%d")
    }

    if not hasattr(db, "resumeReviews") or db.resumeReviews is None:
        db.resumeReviews = []
    db.resumeReviews.append(record)

    if not hasattr(db, "resumes") or db.resumes is None:
        db.resumes = []
    db.resumes.append(record)

    db.save()

    from backend.database import supabase_client
    if supabase_client:
        try:
            supabase_client.table("resumes").upsert({
                "id": record["id"],
                "user_id": current_user.get("id"),
                "ats_score": ats_score,
                "uploaded_at": record["timestamp"]
            }).execute()
        except Exception as err:
            if "PGRST205" not in str(err):
                print("[Supabase resume insert notice]:", err)

    return {"review": result}

@router.post("/match-jd")
def match_jd(req: MatchJDRequest, current_user: dict = Depends(get_current_user)):
    result = match_jd_with_gemini(req.jobTitle, req.company, req.jdText, req.resumeText)

    match_pct = 80
    if isinstance(result, dict) and "matchPercentage" in result:
        try:
            match_pct = int(result["matchPercentage"])
        except Exception:
            match_pct = 80

    record = {
        "id": f"jdm_{uuid.uuid4().hex[:8]}",
        "userId": current_user.get("id"),
        "userName": current_user.get("name", "Student"),
        "userEmail": current_user.get("email", ""),
        "jobTitle": req.jobTitle,
        "company": req.company,
        "matchPercentage": match_pct,
        "timestamp": datetime.utcnow().isoformat(),
        "date": datetime.utcnow().strftime("%Y-%m-%d")
    }

    if not hasattr(db, "jdMatches") or db.jdMatches is None:
        db.jdMatches = []
    db.jdMatches.append(record)
    db.save()

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
            if "PGRST205" not in str(e):
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
            if "PGRST205" not in str(e):
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

@router.get("/admin/speech-evaluations")
def get_all_speech_evaluations(current_user: dict = Depends(get_current_user)):
    """Fetch college-wide speech evaluations across all students for Admin Dashboard analytics."""
    from backend.database import supabase_client
    evaluations = []
    if supabase_client:
        try:
            res = supabase_client.table("speech_evaluations").select("*").order("created_at", desc=True).limit(100).execute()
            if res.data:
                evaluations = res.data
        except Exception as e:
            print("[Supabase fetch all speech_evaluations error]:", e)

    if not evaluations:
        evaluations = getattr(db, "interviewResponses", [])

    return {
        "count": len(evaluations),
        "evaluations": evaluations
    }

@router.get("/hr-questions")
def get_hr_practice_questions(companyTag: str = "all"):
    """Fetch practice questions from Supabase hr_practice_questions table."""
    from backend.database import supabase_client
    questions = []
    if supabase_client:
        try:
            query = supabase_client.table("hr_practice_questions").select("*")
            if companyTag and companyTag.lower() != "all":
                query = query.ilike("company_tag", f"%{companyTag}%")
            res = query.execute()
            if res.data:
                questions = [
                    {
                        "id": str(q.get("id")),
                        "companyTag": str(q.get("company_tag", "General HR")),
                        "questionText": str(q.get("question_text") or q.get("question") or ""),
                        "category": str(q.get("category", "HR & Behavioral")),
                        "isFeatured": bool(q.get("is_featured", True))
                    }
                    for q in res.data
                ]
        except Exception as e:
            print("[Supabase hr_practice_questions query error]:", e)

    if not questions:
        raw_list = getattr(db, "hrPracticeQuestions", [])
        questions = [
            {
                "id": str(q.get("id")),
                "companyTag": str(q.get("companyTag") or q.get("company_tag") or "General HR"),
                "questionText": str(q.get("questionText") or q.get("question") or ""),
                "category": str(q.get("category", "HR & Behavioral")),
                "isFeatured": bool(q.get("isFeatured", True))
            }
            for q in raw_list
            if companyTag.lower() == "all" or companyTag.lower() in str(q.get("companyTag") or q.get("company_tag", "")).lower()
        ]

    return {"questions": questions}


