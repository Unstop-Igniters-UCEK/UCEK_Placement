import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.database import db
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

    all_users = getattr(db, "users", [])
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

    student_ids = set(u.get("id") for u in students)

    test_scores = getattr(db, "testScores", [])
    resume_reviews = getattr(db, "resumeReviews", []) + getattr(db, "resumes", [])
    interview_responses = getattr(db, "interviewResponses", [])

    if (year and year != "All") or (branch and branch != "All"):
        filtered_tests = [s for s in test_scores if s.get("userId") in student_ids]
        filtered_resumes = [r for r in resume_reviews if r.get("userId") in student_ids]
        filtered_interviews = [i for i in interview_responses if i.get("userId") in student_ids]
        
        total_mock_tests = len(filtered_tests)
        total_resume_reviews = len(filtered_resumes)
        total_interviews = len(filtered_interviews)
    else:
        total_mock_tests = len(test_scores)
        total_resume_reviews = len(resume_reviews)
        total_interviews = len(interview_responses)

    student_performance = []
    for u in students:
        u_id = u.get("id")
        u_tests = len([s for s in test_scores if s.get("userId") == u_id])
        u_interviews = len([i for i in interview_responses if i.get("userId") == u_id])
        
        student_performance.append({
            "id": u_id,
            "name": u.get("name", "Unknown"),
            "email": u.get("email", ""),
            "branch": u.get("branch", "N/A"),
            "year": u.get("year", "N/A"),
            "readinessScore": u.get("readinessScore", 75),
            "testsCompleted": u_tests,
            "interviewsCompleted": u_interviews
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
    total_students = len([u for u in db.users if u["role"] == "mentee" or u["role"] == "student"])
    scores = [s["percentage"] for s in db.testScores]
    avg_score = round(sum(scores) / len(scores)) if len(scores) > 0 else 72

    return {
        "totalStudents": total_students or len(db.users),
        "averageScore": avg_score,
        "activeRoadmaps": len(db.userRoadmaps),
        "totalMockTestsTaken": len(db.testScores),
        "recentRegistrations": db.users[-5:]
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
    db.save()

    return {"message": "Question added to UCEK Question Bank", "question": new_q}

@router.put("/users/role")
def update_user_role(req: UpdateRoleRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")

    user = next((u for u in db.users if u["id"] == req.userId), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["role"] = req.role
    db.save()

    return {"message": f"User role updated to {req.role}"}

@router.get("/users")
def get_all_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")
    
    all_users = getattr(db, "users", [])
    
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
            "readinessScore": u.get("readinessScore", 75),
        })

    return {"users": users_data}
