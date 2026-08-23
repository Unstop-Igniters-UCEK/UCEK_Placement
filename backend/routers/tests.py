import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from backend.database import db
from backend.auth import get_current_user
from backend.schemas import SubmitTestRequest, UploadCSVTestRequest

router = APIRouter(prefix="/api/tests", tags=["tests"])

def map_dept_name(dept_raw: str) -> str:
    if not dept_raw:
        return "All"
    d = dept_raw.strip().lower()
    if d in ["cs", "cse", "computer science", "computer science & engg", "computer science (cse)"]:
        return "Computer Science & Engg"
    if d in ["it", "information technology", "information technology (it)"]:
        return "Information Technology"
    if d in ["ece", "electronics", "electronics & comm engg", "electronics & communication (ece)"]:
        return "Electronics & Comm Engg"
    return "All"

def get_dept_code(s: str) -> str:
    if not s:
        return "all"
    st = s.strip().lower()
    if st in ["all", ""]:
        return "all"
    if "cs" in st or "computer" in st:
        return "cs"
    if "it" in st or "information" in st:
        return "it"
    if "ece" in st or "electronics" in st:
        return "ece"
    if "eee" in st or "electrical" in st:
        return "eee"
    if "mech" in st or "me" in st:
        return "mech"
    if "civil" in st or "ce" in st:
        return "civil"
    return st

def is_dept_match(t_dept: str, user_branch: str) -> bool:
    t_code = get_dept_code(t_dept)
    if t_code == "all":
        return True
    if not user_branch or user_branch.strip() == "":
        return False
    u_code = get_dept_code(user_branch)
    return t_code == u_code

def get_year_code(s: str) -> str:
    if not s:
        return "all"
    st = s.strip().lower()
    if st in ["all", ""]:
        return "all"
    if "1st" in st or "1" in st or "2030" in st:
        return "1"
    if "2nd" in st or "2" in st or "2029" in st:
        return "2"
    if "3rd" in st or "3" in st or "2028" in st:
        return "3"
    if "4th" in st or "4" in st or "2027" in st:
        return "4"
    return st

def is_year_match(t_year: str, user_year: str) -> bool:
    t_code = get_year_code(t_year)
    if t_code == "all":
        return True
    if not user_year or user_year.strip() == "":
        return False
    u_code = get_year_code(user_year)
    return t_code == u_code

@router.get("")
def get_tests(current_user: dict = Depends(get_current_user)):
    user_role = current_user.get("role", "mentee")
    if user_role == "admin":
        return {"tests": db.mockTests}

    user_branch = current_user.get("branch", "")
    user_year = current_user.get("year", "")

    filtered = []
    for test in db.mockTests:
        t_dept = test.get("targetDept")
        t_year = test.get("targetYear")

        if is_dept_match(t_dept, user_branch) and is_year_match(t_year, user_year):
            filtered.append(test)

    return {"tests": filtered}

@router.post("/upload-csv-test")
def upload_csv_test(req: UploadCSVTestRequest, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privilege required")

    raw_dept = req.target_dept or req.targetDept or "All"
    raw_year = req.target_year or req.targetYear or "All"
    mapped_dept = map_dept_name(raw_dept)

    question_ids = []
    for q in req.questions:
        q_id = f"q_{uuid.uuid4().hex[:8]}"
        q_obj = {
            "id": q_id,
            "title": q.question or q.title or "Untitled Question",
            "type": "Technical" if mapped_dept != "All" else "Aptitude",
            "difficulty": "Medium",
            "options": q.options,
            "correctOptionIndex": q.correctOptionIndex,
            "explanation": q.explanation or ""
        }
        db.questions.append(q_obj)
        question_ids.append(q_id)

    test_id = f"test_{uuid.uuid4().hex[:8]}"
    new_test = {
        "id": test_id,
        "title": req.title,
        "category": "Departmental",
        "companyTag": mapped_dept if mapped_dept != "All" else "Department Core",
        "durationMins": req.duration,
        "questionIds": question_ids,
        "totalQuestions": len(question_ids),
        "passPercentage": 60,
        "description": f"Departmental assessment for {mapped_dept} ({raw_year}).",
        "targetDept": mapped_dept,
        "targetYear": raw_year
    }

    db.mockTests.append(new_test)
    db.save()

    return {
        "message": "Departmental quiz created successfully via CSV upload",
        "test": new_test
    }


@router.get("/history/my")
def get_test_history(current_user: dict = Depends(get_current_user)):
    user_scores = [s for s in db.testScores if str(s.get("userId")) == str(current_user["id"])]
    return {"scores": user_scores}

@router.get("/{test_id}")
def get_test_details(test_id: str):
    test = next((t for t in db.mockTests if t["id"] == test_id), None)
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    questions = [q for q in db.questions if q["id"] in test.get("questionIds", [])]
    return {"test": test, "questions": questions}

@router.post("/{test_id}/submit")
def submit_test(test_id: str, req: SubmitTestRequest, current_user: dict = Depends(get_current_user)):
    test = next((t for t in db.mockTests if t["id"] == test_id), None)
    
    test_title = req.testTitle or (test["title"] if test else "Mock Assessment Drive")
    category = req.category or (test.get("category") if test else "Company Drive")
    
    questions = [q for q in db.questions if q["id"] in test.get("questionIds", [])] if test else []
    
    if req.score is not None:
        score = req.score
    else:
        score = 0
        for ans in (req.userAnswers or []):
            q = next((item for item in questions if item["id"] == ans.questionId), None)
            if q and q.get("correctOptionIndex") == ans.selectedOption:
                score += 1

    total = req.totalQuestions if req.totalQuestions is not None else (len(questions) if len(questions) > 0 else 10)
    percentage = req.percentage if req.percentage is not None else (round((score / total) * 100) if total > 0 else 0)
    
    if req.passed is not None:
        passed = req.passed
    elif test:
        passed = score >= test.get("passingMarks", round(total * 0.6))
    else:
        passed = percentage >= 60

    user_ans_dict = {}
    if req.userAnswers:
        for ans in req.userAnswers:
            user_ans_dict[ans.questionId] = ans.selectedOption

    new_score = {
        "id": f"score_{uuid.uuid4().hex[:8]}",
        "userId": current_user["id"],
        "testId": test_id,
        "testTitle": test_title,
        "category": category,
        "score": score,
        "total": total,
        "totalQuestions": total,
        "percentage": percentage,
        "passed": passed,
        "timeTakenSec": req.timeTakenSec or 0,
        "userAnswers": user_ans_dict,
        "submittedAt": datetime.now().isoformat(),
        "date": datetime.now().isoformat().split('T')[0]
    }

    db.testScores.append(new_score)
    db.save()

    return {
        "message": "Test submitted successfully",
        "result": new_score,
        "testQuestions": questions
    }
