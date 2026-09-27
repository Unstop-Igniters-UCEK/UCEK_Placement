import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.database import db, calculate_user_readiness
from backend.auth import get_current_user
from backend.schemas import CreateQuestionRequest, UpdateRoleRequest

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/dashboard-stats")
def get_dashboard_stats(
    year: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")

    all_users = db.get_all_users_admin()
    students = [u for u in all_users if u.get("role") != "admin"]

    if year and year != "All" and year != "All Years":
        clean_y = year.strip().lower()
        students = [
            u for u in students 
            if clean_y in u.get("year", "").lower() or u.get("year", "").lower() in clean_y
        ]

    if branch and branch != "All" and branch != "All Departments":
        clean_b = branch.strip().lower()
        students = [
            u for u in students
            if clean_b in u.get("branch", "").lower() or u.get("branch", "").lower() in clean_b or
            (clean_b == "cse" and "computer" in u.get("branch", "").lower()) or
            (clean_b == "ece" and "electronics" in u.get("branch", "").lower()) or
            (clean_b == "it" and "information" in u.get("branch", "").lower()) or
            (clean_b == "eee" and "electrical" in u.get("branch", "").lower()) or
            (clean_b == "me" and "mechanical" in u.get("branch", "").lower()) or
            (clean_b == "ce" and "civil" in u.get("branch", "").lower()) or
            (clean_b in ["bio", "bt"] and "bio" in u.get("branch", "").lower())
        ]

    student_ids = set(str(u.get("id")) for u in students)

    test_scores = db.get_all_test_scores_admin()
    raw_resumes = (getattr(db, "resumeReviews", []) or []) + (getattr(db, "resumes", []) or [])

    # Deduplicate resume reviews by ID
    all_res_map = {}
    for r in raw_resumes:
        r_id = str(r.get("id") or id(r))
        all_res_map[r_id] = r
    resume_reviews = list(all_res_map.values())

    interview_responses = getattr(db, "interviewResponses", []) or []

    if (year and year != "All" and year != "All Years") or (branch and branch != "All" and branch != "All Departments"):
        filtered_tests = [s for s in test_scores if str(s.get("userId")) in student_ids]
        filtered_resumes = [r for r in resume_reviews if str(r.get("userId")) in student_ids]
        filtered_interviews = [i for i in interview_responses if str(i.get("userId")) in student_ids]
        
        total_mock_tests = len(filtered_tests)
        total_resume_reviews = len(filtered_resumes)
        total_interviews = len(filtered_interviews)
    else:
        total_mock_tests = len(test_scores)
        total_resume_reviews = len(resume_reviews)
        total_interviews = len(interview_responses)

    student_performance = []
    for u in students:
        u_id = str(u.get("id"))
        u_tests_list = [s for s in test_scores if str(s.get("userId")) == u_id]
        u_resumes_list = [r for r in resume_reviews if str(r.get("userId")) == u_id]
        u_interviews_list = [i for i in interview_responses if str(i.get("userId")) == u_id]

        dynamic_readiness = calculate_user_readiness(u_id)
        u["readinessScore"] = dynamic_readiness

        student_performance.append({
            "id": u_id,
            "name": u.get("name", "Unknown"),
            "email": u.get("email", ""),
            "branch": u.get("branch", "N/A"),
            "year": u.get("year", "N/A"),
            "readinessScore": dynamic_readiness,
            "testsCompleted": len(u_tests_list),
            "resumesReviewed": len(u_resumes_list),
            "interviewsCompleted": len(u_interviews_list)
        })

    return {
        "kpis": {
            "totalStudents": len(students),
            "totalMockTestsTaken": total_mock_tests,
            "mockTestsTaken": total_mock_tests,
            "totalResumeReviews": total_resume_reviews,
            "resumesReviewed": total_resume_reviews,
            "totalAIResumeReviewsDone": total_resume_reviews,
            "totalInterviewSimulationsCompleted": total_interviews,
            "interviewsCompleted": total_interviews,
            "totalInterviewsCompleted": total_interviews
        },
        "studentPerformance": student_performance
    }

@router.get("/analytics")
def get_admin_analytics(current_user: dict = Depends(get_current_user)):
    all_users = db.get_all_users_admin()
    test_scores = db.get_all_test_scores_admin()
    total_students = len([u for u in all_users if u.get("role") == "mentee" or u.get("role") == "student"])
    scores = [s["percentage"] for s in test_scores if "percentage" in s and s["percentage"] is not None]
    avg_score = round(sum(scores) / len(scores)) if len(scores) > 0 else None

    return {
        "totalStudents": total_students or len(all_users),
        "averageScore": avg_score,
        "activeRoadmaps": len(getattr(db, "userRoadmaps", [])),
        "totalMockTestsTaken": len(test_scores),
        "recentRegistrations": all_users[-5:] if all_users else []
    }

@router.post("/questions")
def create_question(req: CreateQuestionRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")

    q_id = f"q_{uuid.uuid4().hex[:6]}"
    new_q = {
        "id": q_id,
        "title": req.title,
        "type": req.type,
        "difficulty": req.difficulty,
        "options": req.options,
        "correctOptionIndex": req.correctOptionIndex,
        "explanation": req.explanation,
        "companyTag": req.companyTag
    }

    db.questions.append(new_q)
    # Sync just this new question to Supabase
    from backend.database import supabase_client
    if supabase_client:
        try:
            supabase_client.table("questions").upsert({
                "id": str(new_q["id"]),
                "title": str(new_q.get("title", "")),
                "type": str(new_q.get("type", "MCQ")),
                "difficulty": str(new_q.get("difficulty", "Medium")),
                "options": new_q.get("options", []),
                "correct_option_index": int(new_q.get("correctOptionIndex", 0)),
                "explanation": str(new_q.get("explanation", "")),
                "company_tag": str(new_q.get("companyTag", "General"))
            }, on_conflict="id").execute()
        except Exception as e:
            print("[Supabase question save notice]:", e)

    return {"message": "Question added to UCEK Question Bank", "question": new_q}

@router.put("/users/role")
def update_user_role(req: UpdateRoleRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")

    user = db.get_user_by_id(req.userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["role"] = req.role
    db.save_user(user)

    return {"message": f"User role updated to {req.role}"}

@router.get("/users")
def get_all_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
    
    all_users = db.get_all_users_admin()
    
    # Return user details including role
    users_data = []
    for u in all_users:
        users_data.append({
            "id": u.get("id"),
            "name": u.get("name", "Unknown"),
            "email": u.get("email", ""),
            "role": u.get("role", "mentee"),
            "branch": u.get("branch", "N/A"),
            "year": u.get("year", "N/A"),
            "readinessScore": calculate_user_readiness(u.get("id")),
        })

    return {"users": users_data}

