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

    student_ids = set(str(u.get("id")) for u in students)

    test_scores = getattr(db, "testScores", []) or []
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

        def get_test_percentage(s):
            if not s:
                return 0
            if isinstance(s.get("accuracy"), (int, float)) and s["accuracy"] > 0:
                return float(s["accuracy"])
            tot = max(1, int(s.get("total") or s.get("totalQuestions") or 10))
            if "percentage" in s and s["percentage"] is not None:
                return float(s["percentage"])
            return (float(s.get("score", 0)) / tot) * 100

        apt_tests = [s for s in u_tests_list if "aptitude" in str(s.get("category", "")).lower() or "company" in str(s.get("category", "")).lower()]
        tech_tests = [s for s in u_tests_list if "technical" in str(s.get("category", "")).lower() or "coding" in str(s.get("category", "")).lower()]

        if apt_tests:
            apt_score = round(sum(get_test_percentage(s) for s in apt_tests) / len(apt_tests))
        elif u_tests_list:
            apt_score = round(sum(get_test_percentage(s) for s in u_tests_list) / len(u_tests_list))
        else:
            apt_score = 0

        if tech_tests:
            tech_score = round(sum(get_test_percentage(s) for s in tech_tests) / len(tech_tests))
        elif u_tests_list:
            tech_score = round(sum(get_test_percentage(s) for s in u_tests_list) / len(u_tests_list))
        else:
            tech_score = 0

        ats_score = 82

        user_rm = next((r for r in getattr(db, "userRoadmaps", []) if str(r.get("userId")) == u_id), None)
        domain_pct = 0
        if user_rm and isinstance(user_rm.get("modules"), list):
            tot_t = 0
            done_t = 0
            for m in user_rm["modules"]:
                if isinstance(m, dict) and isinstance(m.get("milestones"), list):
                    for ms in m["milestones"]:
                        tot_t += 1
                        if isinstance(ms, dict) and ms.get("completed"):
                            done_t += 1
            domain_pct = round((done_t / tot_t) * 100) if tot_t > 0 else 0

        if u_tests_list:
            calc_readiness = round((0.35 * apt_score) + (0.35 * tech_score) + (0.20 * ats_score) + (0.10 * domain_pct))
        else:
            calc_readiness = round((0.20 * ats_score) + (0.10 * domain_pct))

        dynamic_readiness = min(100, max(0, calc_readiness))
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
