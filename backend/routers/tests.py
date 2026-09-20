import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from backend.database import db
from backend.auth import get_current_user
from backend.schemas import SubmitTestRequest, UploadCSVTestRequest

router = APIRouter(prefix="/api/tests", tags=["tests"])

import re

def map_target_dept(dept_str: str) -> str:
    """Normalize input department strings to canonical labels."""
    d = str(dept_str or '').strip().lower()
    if d in ['all', 'all departments', '']:
        return 'All'
    if 'comp' in d or re.search(r'\bcs\b|\bcse\b', d):
        return 'Computer Science & Engg'
    if ('electr' in d and 'comm' in d) or re.search(r'\bec\b|\bece\b', d):
        return 'Electronics & Comm Engg'
    if 'info' in d or re.search(r'\bit\b', d):
        return 'Information Technology'
    if 'electr' in d or re.search(r'\beee\b', d):
        return 'Electrical & Electronics Engg'
    if 'mech' in d or re.search(r'\bme\b', d):
        return 'Mechanical Engg'
    if 'civil' in d or re.search(r'\bce\b', d):
        return 'Civil Engg'
    return dept_str.strip()

def map_target_year(year_str: str) -> str:
    """Normalize input year strings to canonical labels."""
    y = str(year_str or '').strip().lower()
    if y in ['all', 'all years', '']:
        return 'All'
    if '1' in y or 'first' in y:
        return '1st Year'
    if '2' in y or 'second' in y:
        return '2nd Year'
    if '3' in y or 'third' in y:
        return '3rd Year'
    if '4' in y or 'fourth' in y:
        return '4th Year'
    return year_str.strip()

def is_dept_match(t_dept: str, user_branch: str) -> bool:
    norm_target = map_target_dept(t_dept)
    if norm_target == 'All':
        return True
    if not user_branch or not str(user_branch).strip():
        return False
    norm_user = map_target_dept(user_branch)
    return norm_target == norm_user

def is_year_match(t_year: str, user_year: str) -> bool:
    norm_target = map_target_year(t_year)
    if norm_target == 'All':
        return True
    if not user_year or not str(user_year).strip():
        return False
    norm_user = map_target_year(user_year)
    return norm_target == norm_user

@router.get("")
def get_tests(current_user: dict = Depends(get_current_user)):
    # Filter out empty 0-question dummy tests
    valid_tests = []
    for test in db.mockTests:
        q_ids = test.get("questionIds") or test.get("questions") or test.get("question_ids") or []
        tot = test.get("totalQuestions") or len(q_ids)
        if tot > 0 and len(q_ids) > 0:
            valid_tests.append(test)

    # Sync cleaned array back to db
    db.mockTests = valid_tests

    user_role = current_user.get("role", "mentee")
    if user_role == "admin":
        return {"tests": valid_tests}

    user_branch = current_user.get("branch", "")
    user_year = current_user.get("year", "")

    filtered = []
    for test in valid_tests:
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
    mapped_dept = map_target_dept(raw_dept)
    mapped_year = map_target_year(raw_year)

    question_ids = []
    created_questions = []
    for q in req.questions:
        q_id = f"q_{uuid.uuid4().hex[:8]}"
        q_obj = {
            "id": q_id,
            "title": q.question or q.title or "Untitled Question",
            "question": q.question or q.title or "Untitled Question",
            "type": "Technical" if mapped_dept != "All" else "Aptitude",
            "difficulty": "Medium",
            "options": q.options,
            "correctOptionIndex": q.correctOptionIndex,
            "explanation": q.explanation or ""
        }
        db.questions.append(q_obj)
        question_ids.append(q_id)
        created_questions.append(q_obj)

    test_id = f"test_{uuid.uuid4().hex[:8]}"
    new_test = {
        "id": test_id,
        "title": req.title,
        "category": "Departmental",
        "companyTag": mapped_dept if mapped_dept != "All" else "Department Core",
        "company_tag": mapped_dept if mapped_dept != "All" else "Department Core",
        "durationMins": req.duration,
        "durationMinutes": req.duration,
        "duration_mins": req.duration,
        "questionIds": question_ids,
        "questions": question_ids,
        "question_ids": question_ids,
        "totalQuestions": len(question_ids),
        "passPercentage": 60,
        "pass_percentage": 60,
        "description": f"Departmental assessment for {mapped_dept} ({raw_year}).",
        "targetDept": mapped_dept,
        "target_dept": mapped_dept,
        "targetYear": raw_year,
        "target_year": raw_year
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

@router.delete("/history/my")
def clear_test_history(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["id"])
    
    # 1. Remove from in-memory / app_state JSON
    db.testScores = [s for s in db.testScores if str(s.get("userId")) != user_id]
    
    # 2. Remove from Supabase relational table explicitly
    try:
        from backend.database import supabase_client
        if supabase_client:
            supabase_client.table('test_scores').delete().eq('user_id', user_id).execute()
    except Exception as e:
        print("[Supabase test_scores clear notice]:", e)
        
    db.save()
    return {"message": "Test history cleared successfully"}

@router.get("/{test_id}")
def get_test_details(test_id: str):
    test = next((t for t in db.mockTests if str(t.get("id")) == str(test_id)), None)
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    q_ids = test.get("questionIds") or test.get("questions") or test.get("question_ids") or []
    raw_questions = []

    # Extract question objects from db.questions or embedded list
    if isinstance(q_ids, list):
        for item in q_ids:
            if isinstance(item, dict):
                raw_questions.append(item)
            elif isinstance(item, str):
                found_q = next((q for q in db.questions if str(q.get("id")) == item), None)
                if found_q:
                    raw_questions.append(found_q)

    # Fallback if no questions matched by ID
    if not raw_questions:
        raw_questions = [q for q in db.questions if str(q.get("id")) in [str(x) for x in q_ids if isinstance(x, str)]]

    # Hide correctOptionIndex and explanation for security before test submission
    public_questions = []
    for q in raw_questions:
        q_text = q.get("title") or q.get("question") or "Question"
        public_questions.append({
            "id": str(q.get("id")),
            "title": q_text,
            "question": q_text,
            "options": q.get("options", []),
            "type": q.get("type", "Technical"),
            "difficulty": q.get("difficulty", "Medium"),
            "companyTag": q.get("companyTag", "General")
        })

    return {"test": test, "questions": public_questions}

@router.post("/{test_id}/submit")
def submit_test(test_id: str, req: SubmitTestRequest, current_user: dict = Depends(get_current_user)):
    test = next((t for t in db.mockTests if str(t.get("id")) == str(test_id)), None)
    
    test_title = req.testTitle or (test["title"] if test else "Mock Assessment Drive")
    category = req.category or (test.get("category") if test else "Company Drive")
    
    q_ids = test.get("questionIds") or test.get("questions") or test.get("question_ids") or [] if test else []
    questions = []
    if isinstance(q_ids, list):
        for item in q_ids:
            if isinstance(item, dict):
                questions.append(item)
            elif isinstance(item, str):
                found_q = next((q for q in db.questions if str(q.get("id")) == item), None)
                if found_q:
                    questions.append(found_q)
    
    # Normalize user answers input (accepts answers dict {qId: optIdx} or userAnswers list)
    user_ans_dict: Dict[str, int] = {}
    if req.answers is not None:
        user_ans_dict = req.answers
    elif req.userAnswers:
        for ans in req.userAnswers:
            user_ans_dict[ans.questionId] = ans.selectedOption

    score = 0
    review_list = []

    for q in questions:
        q_id = str(q.get("id"))
        correct_idx = q.get("correctOptionIndex", 0)
        selected_idx = user_ans_dict.get(q_id, -1)
        is_correct = (selected_idx == correct_idx)
        if is_correct:
            score += 1
            
        review_list.append({
            "id": q_id,
            "title": q.get("title") or q.get("question", ""),
            "question": q.get("title") or q.get("question", ""),
            "options": q.get("options", []),
            "selectedOption": selected_idx,
            "userAnswer": selected_idx,
            "correctOptionIndex": correct_idx,
            "isCorrect": is_correct,
            "explanation": q.get("explanation", "")
        })

    total = len(questions) if len(questions) > 0 else (req.totalQuestions or 10)
    percentage = round((score / total) * 100) if total > 0 else 0
    pass_mark = test.get("passPercentage", 60) if test else 60
    passed = percentage >= pass_mark

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
        "score": score,
        "totalQuestions": total,
        "percentage": percentage,
        "passed": passed,
        "review": review_list,
        "result": new_score
    }
