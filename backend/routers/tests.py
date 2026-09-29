"""
routers/tests.py — Mock test endpoints for Impulse UCEK Placement Suite.
Aligned with Impulse_DB_Design.md §11–§18.

Test flow:
  1. GET  /api/tests           — list published tests for the student (filtered by dept/year)
  2. GET  /api/tests/{id}      — test metadata + questions (correct_option hidden)
  3. POST /api/tests/{id}/start — create an in_progress attempt
  4. POST /api/tests/{id}/submit — score the attempt and store mock_test_attempt_answers
  5. GET  /api/tests/history/my — submitted attempt history
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException

from backend.database import db, supabase_client
from backend.auth import get_current_user
from backend.schemas import SubmitTestRequest, UploadCSVTestRequest

router = APIRouter(prefix="/api/tests", tags=["tests"])


# ─── List tests for student ───────────────────────────────────────────────────

@router.get("")
def get_tests(current_user: dict = Depends(get_current_user)):
    """Return published tests relevant to the authenticated student."""
    role = current_user.get("role", "student")

    if role == "admin":
        return {"tests": db.get_all_published_tests()}

    dept_id = current_user.get("department_id")
    if not dept_id:
        dept_code = current_user.get("department_code") or current_user.get("branch")
        if dept_code:
            dept = db.get_department_by_code(dept_code)
            if dept:
                dept_id = dept["id"]

    year = current_user.get("year")

    tests = db.get_published_tests_for_student(department_id=dept_id, year=year)
    return {"tests": tests}


# ─── Test history ─────────────────────────────────────────────────────────────

@router.get("/history/my")
def get_test_history(category: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Return the student's submitted mock test attempt history with optional category filtering."""
    scores = db.get_student_test_history(current_user["id"])
    if category and category.lower() != "all":
        cat_lower = category.lower()
        filtered = []
        for s in scores:
            if cat_lower == "departmental" and s.get("is_departmental"):
                filtered.append(s)
            elif s.get("test_type", "").lower() == cat_lower or s.get("category", "").lower() == cat_lower:
                filtered.append(s)
        return {"scores": filtered}
    return {"scores": scores}


@router.delete("/history/my")
def delete_test_history(current_user: dict = Depends(get_current_user)):
    """Allow a student to clear their own test attempt history."""
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")
    try:
        supabase_client.table("mock_test_attempts").delete().eq("student_id", current_user["id"]).execute()
        return {"message": "Test history cleared."}
    except Exception as e:
        print("[delete_test_history]:", e)
        raise HTTPException(status_code=500, detail="Failed to clear test history.")


# ─── Get test detail + questions (correct_option hidden before submission) ─────

@router.get("/{test_id}")
def get_test_details(test_id: str, current_user: dict = Depends(get_current_user)):
    test = db.get_test_by_id(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    if test.get("status") != "published" and current_user.get("role") != "admin":
        raise HTTPException(status_code=404, detail="Mock test not found.")

    raw_questions = db.get_questions_for_test(test_id)

    # Strip correct_option and explanation for non-admin (security)
    public_questions = []
    for q in raw_questions:
        opt_a = q.get("option_a", "")
        opt_b = q.get("option_b", "")
        opt_c = q.get("option_c", "")
        opt_d = q.get("option_d", "")
        q_text = q.get("question_text", "")
        pub = {
            "id": str(q["id"]),
            "question": q_text,
            "question_text": q_text,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "options": [opt_a, opt_b, opt_c, opt_d],
            "question_order": q["question_order"],
        }
        if current_user.get("role") == "admin":
            pub["correct_option"] = q.get("correct_option")
            pub["explanation"] = q.get("explanation")
        public_questions.append(pub)

    return {"test": test, "questions": public_questions}


# ─── Start attempt ────────────────────────────────────────────────────────────

@router.post("/{test_id}/start")
def start_test(test_id: str, current_user: dict = Depends(get_current_user)):
    """
    Create an in_progress attempt for the student.
    If one already exists, return it.
    """
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can start tests.")

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    test = db.get_test_by_id(test_id)
    if not test or test.get("status") != "published":
        raise HTTPException(status_code=404, detail="Mock test not found or not published.")

    # Check for existing in_progress attempt
    existing = db.get_student_attempt(current_user["id"], test_id, "in_progress")
    if existing:
        # Check not expired
        if existing.get("expires_at") and datetime.utcnow().isoformat() > str(existing["expires_at"]):
            # Mark as expired
            try:
                supabase_client.table("mock_test_attempts").update({
                    "status": "expired"
                }).eq("id", existing["id"]).execute()
            except Exception:
                pass
        else:
            return {"attempt_id": str(existing["id"]), "status": "in_progress", "expires_at": str(existing.get("expires_at", ""))}

    # Count total marks (= number of questions)
    questions = db.get_questions_for_test(test_id)
    total_marks = len(questions)
    if total_marks == 0:
        raise HTTPException(status_code=400, detail="This test has no questions.")

    # Determine attempt_number
    prev_res = supabase_client.table("mock_test_attempts").select("attempt_number").eq("student_id", current_user["id"]).eq("test_id", test_id).execute()
    attempt_number = len(prev_res.data or []) + 1

    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=test["duration_minutes"])

    try:
        ins_res = supabase_client.table("mock_test_attempts").insert({
            "student_id": current_user["id"],
            "test_id": test_id,
            "attempt_number": attempt_number,
            "marks_obtained": 0,
            "total_marks": total_marks,
            "score_percentage": 0,
            "status": "in_progress",
            "started_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "created_at": now.isoformat(),
        }).execute()

        if not ins_res.data:
            raise HTTPException(status_code=500, detail="Failed to start test attempt.")

        attempt_id = ins_res.data[0]["id"]
    except HTTPException:
        raise
    except Exception as e:
        print(f"[start_test {test_id}]:", e)
        raise HTTPException(status_code=500, detail="Failed to start test attempt.")

    return {
        "attempt_id": str(attempt_id),
        "status": "in_progress",
        "expires_at": expires_at.isoformat(),
        "total_questions": total_marks,
    }


# ─── Submit attempt ───────────────────────────────────────────────────────────

@router.post("/{test_id}/submit")
def submit_test(test_id: str, req: SubmitTestRequest, current_user: dict = Depends(get_current_user)):
    """
    Score the test attempt and store answers.
    req.answers = {question_id: "A"|"B"|"C"|"D"}
    """
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can submit tests.")

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    test = db.get_test_by_id(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    # Find the most recent in_progress attempt
    attempt = db.get_student_attempt(current_user["id"], test_id, "in_progress")
    if not attempt:
        # Fallback: allow submission without an explicit start (for compatibility)
        attempt = None

    # Load questions with correct_option
    questions = db.get_questions_for_test(test_id)
    if not questions:
        raise HTTPException(status_code=400, detail="This test has no questions.")

    # ── Normalise answers — accept both integer index (0→A, 1→B, 2→C, 3→D)
    #    and letter format (A/B/C/D)
    _idx_to_letter = {0: "A", 1: "B", 2: "C", 3: "D"}
    submitted_answers = req.resolved_answers()
    normalised_answers: dict = {}
    for q_id_key, val in submitted_answers.items():
        k = str(q_id_key).strip()
        if val is None or val == "":
            normalised_answers[k] = None
        elif isinstance(val, int) or (isinstance(val, str) and str(val).isdigit()):
            normalised_answers[k] = _idx_to_letter.get(int(val), None)
        else:
            letter = str(val).strip().upper()
            normalised_answers[k] = letter if letter in ("A", "B", "C", "D") else None

    # Score
    score = 0
    answers_payload = []
    review_list = []

    for q in questions:
        q_id = str(q["id"]).strip()
        correct = str(q.get("correct_option") or "").strip().upper()
        selected_raw = normalised_answers.get(q_id)
        if selected_raw and selected_raw in ("A", "B", "C", "D"):
            selected = selected_raw
        else:
            selected = None

        is_correct = bool(selected and correct and selected == correct)
        if is_correct:
            score += 1

        answers_payload.append({
            "question_id": q_id,
            "selected_option": selected,
            "is_correct": is_correct,
        })

        opt_a = q.get("option_a", "")
        opt_b = q.get("option_b", "")
        opt_c = q.get("option_c", "")
        opt_d = q.get("option_d", "")
        q_text = q.get("question_text", "")
        review_list.append({
            "id": q_id,
            "question_id": q_id,
            "question": q_text,
            "question_text": q_text,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "options": [opt_a, opt_b, opt_c, opt_d],
            "correct_option": correct,
            "correctOption": correct,
            "selected_option": selected,
            "selectedOption": selected,
            "is_correct": is_correct,
            "isCorrect": is_correct,
            "explanation": q.get("explanation", ""),
        })

    total = len(questions)
    score_pct = round((score / total) * 100, 2) if total > 0 else 0.0
    now = datetime.utcnow().isoformat()

    # Create or update the attempt row
    try:
        if attempt:
            attempt_id = str(attempt["id"])
            supabase_client.table("mock_test_attempts").update({
                "marks_obtained": score,
                "total_marks": total,
                "score_percentage": score_pct,
                "status": "submitted",
                "submitted_at": now,
            }).eq("id", attempt_id).execute()
        else:
            # If no in_progress attempt existed, count previous attempts
            prev_res = supabase_client.table("mock_test_attempts").select("attempt_number").eq("student_id", current_user["id"]).eq("test_id", test_id).execute()
            attempt_number = len(prev_res.data or []) + 1

            ins_res = supabase_client.table("mock_test_attempts").insert({
                "student_id": current_user["id"],
                "test_id": test_id,
                "attempt_number": attempt_number,
                "marks_obtained": score,
                "total_marks": total,
                "score_percentage": score_pct,
                "status": "submitted",
                "started_at": now,
                "expires_at": now,
                "submitted_at": now,
                "created_at": now,
            }).execute()

            if not ins_res.data:
                raise HTTPException(status_code=500, detail="Failed to record attempt.")
            attempt_id = str(ins_res.data[0]["id"])

        # Store per-question answers (upsert per attempt/question)
        for ans in answers_payload:
            try:
                supabase_client.table("mock_test_attempt_answers").upsert({
                    "attempt_id": attempt_id,
                    "question_id": ans["question_id"],
                    "selected_option": ans["selected_option"],
                    "is_correct": ans["is_correct"],
                    "created_at": now,
                }, on_conflict="attempt_id,question_id").execute()
            except Exception as e:
                try:
                    supabase_client.table("mock_test_attempt_answers").insert({
                        "attempt_id": attempt_id,
                        "question_id": ans["question_id"],
                        "selected_option": ans["selected_option"],
                        "is_correct": ans["is_correct"],
                        "created_at": now,
                    }).execute()
                except Exception as ie:
                    print(f"[submit_test answer insert {attempt_id}]:", ie)

    except HTTPException:
        raise
    except Exception as e:
        print(f"[submit_test {test_id}]:", e)
        raise HTTPException(status_code=500, detail="Failed to submit test.")

    # Recalculate and store readiness snapshot
    try:
        db.calculate_and_store_readiness(current_user["id"])
    except Exception as e:
        print(f"[submit_test readiness recalc {current_user['id']}]:", e)

    cleared = score_pct > 65

    return {
        "message": "Test submitted successfully.",
        "score": score,
        "total_questions": total,
        "totalQuestions": total,
        "score_percentage": score_pct,
        "percentage": score_pct,
        "cleared": cleared,
        "passed": cleared,
        "review": review_list,
    }


# ─── Review attempt ───────────────────────────────────────────────────────────

@router.get("/{test_id}/review")
def get_test_review(test_id: str, attempt_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """
    Fetch question and answer review for the student's attempt.
    Matches answers to questions by question_id.
    """
    if current_user.get("role") not in ("student", "admin"):
        raise HTTPException(status_code=403, detail="Only students and admins can view test review.")

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    # Find the attempt
    if attempt_id:
        q = supabase_client.table("mock_test_attempts").select("*").eq("id", attempt_id)
        if current_user.get("role") == "student":
            q = q.eq("student_id", current_user["id"])
        att_res = q.execute()
        if not att_res.data:
            raise HTTPException(status_code=404, detail="Attempt not found.")
        attempt = att_res.data[0]
    else:
        # Latest submitted attempt for this test
        att_res = supabase_client.table("mock_test_attempts").select("*").eq("test_id", test_id).eq("student_id", current_user["id"]).eq("status", "submitted").order("created_at", desc=True).limit(1).execute()
        if not att_res.data:
            raise HTTPException(status_code=404, detail="No submitted attempt found for this test.")
        attempt = att_res.data[0]

    actual_attempt_id = str(attempt["id"])

    # Load questions for test (ordered by question_order)
    questions = db.get_questions_for_test(test_id)
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this test.")

    # Load student attempt answers from mock_test_attempt_answers
    ans_res = supabase_client.table("mock_test_attempt_answers").select(
        "question_id, selected_option, is_correct"
    ).eq("attempt_id", actual_attempt_id).execute()

    answers_map = {str(a["question_id"]): a for a in (ans_res.data or [])}

    review_list = []
    for q in questions:
        q_id = str(q["id"])
        ans_record = answers_map.get(q_id, {})
        selected = ans_record.get("selected_option")
        if selected and str(selected).upper() in ("A", "B", "C", "D"):
            selected = str(selected).upper()
        else:
            selected = None

        correct = str(q.get("correct_option") or "").strip().upper()
        is_correct = bool(ans_record.get("is_correct", False))

        opt_a = q.get("option_a", "")
        opt_b = q.get("option_b", "")
        opt_c = q.get("option_c", "")
        opt_d = q.get("option_d", "")
        q_text = q.get("question_text", "")

        opt_map = {"A": opt_a, "B": opt_b, "C": opt_c, "D": opt_d}
        selected_text = opt_map.get(selected) if selected else None
        correct_text = opt_map.get(correct) if correct else None

        review_list.append({
            "id": q_id,
            "question_id": q_id,
            "question": q_text,
            "question_text": q_text,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "options": [opt_a, opt_b, opt_c, opt_d],
            "correct_option": correct,
            "correctOption": correct,
            "correct_text": correct_text,
            "correctText": correct_text,
            "selected_option": selected,
            "selectedOption": selected,
            "selected_text": selected_text,
            "selectedText": selected_text,
            "is_correct": is_correct,
            "isCorrect": is_correct,
            "explanation": q.get("explanation", ""),
        })

    return {
        "attempt_id": actual_attempt_id,
        "score": attempt.get("marks_obtained", 0),
        "total_questions": attempt.get("total_marks", len(questions)),
        "totalQuestions": attempt.get("total_marks", len(questions)),
        "score_percentage": attempt.get("score_percentage", 0),
        "percentage": attempt.get("score_percentage", 0),
        "passed": float(attempt.get("score_percentage", 0)) > 65,
        "review": review_list,
    }


@router.get("/attempts/{attempt_id}/review")
def get_attempt_review(attempt_id: str, current_user: dict = Depends(get_current_user)):
    """
    Fetch question and answer review directly by attempt_id.
    """
    if current_user.get("role") not in ("student", "admin"):
        raise HTTPException(status_code=403, detail="Only students and admins can view test review.")

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    q = supabase_client.table("mock_test_attempts").select("*").eq("id", attempt_id)
    if current_user.get("role") == "student":
        q = q.eq("student_id", current_user["id"])
    att_res = q.execute()
    if not att_res.data:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    attempt = att_res.data[0]
    test_id = str(attempt["test_id"])

    return get_test_review(test_id=test_id, attempt_id=attempt_id, current_user=current_user)


# ─── Admin: Upload CSV test ───────────────────────────────────────────────────

@router.post("/upload-csv-test")
def upload_csv_test(req: UploadCSVTestRequest, current_user: dict = Depends(get_current_user)):
    """Admin uploads a CSV to create a new published mock test."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privilege required.")

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    # Resolve department
    target_dept_id = None
    dept_code = req.resolved_dept_code()
    if dept_code:
        dept = db.get_department_by_code(dept_code)
        if not dept:
            raise HTTPException(status_code=400, detail=f"Unknown department code: {dept_code}")
        target_dept_id = dept["id"]

    target_year = req.resolved_year()
    duration = req.resolved_duration()
    test_type = (req.test_type or "aptitude").lower()
    if test_type not in ("aptitude", "technical", "general"):
        raise HTTPException(status_code=400, detail="test_type must be aptitude, technical, or general.")

    now = datetime.utcnow().isoformat()

    # Validate questions
    valid_opts = {"A", "B", "C", "D"}
    for i, q in enumerate(req.questions):
        q_text = (q.question or "").strip()
        if not q_text:
            raise HTTPException(status_code=400, detail=f"Question {i+1} is missing question text.")
        opt_a = q.resolved_option_a().strip()
        opt_b = q.resolved_option_b().strip()
        opt_c = q.resolved_option_c().strip()
        opt_d = q.resolved_option_d().strip()
        if not opt_a or not opt_b or not opt_c or not opt_d:
            raise HTTPException(status_code=400, detail=f"Question {i+1} must contain all 4 options (Option A, B, C, and D).")
        correct = q.resolved_correct_option()
        if correct not in valid_opts:
            raise HTTPException(status_code=400, detail=f"Question {i+1}: correct_option must be A, B, C, or D.")

    test_id = None
    try:
        # Insert mock_tests row
        test_res = supabase_client.table("mock_tests").insert({
            "title": req.title.strip(),
            "duration_minutes": duration,
            "test_type": test_type,
            "target_department_id": target_dept_id,
            "target_year": target_year,
            "status": "published",
            "created_by": current_user["id"],
            "published_at": now,
            "created_at": now,
            "updated_at": now,
        }).execute()

        if not test_res.data:
            raise HTTPException(status_code=500, detail="Failed to create test.")

        test_id = test_res.data[0]["id"]

        # Insert questions in batch
        questions_payload = []
        for i, q in enumerate(req.questions):
            questions_payload.append({
                "test_id": test_id,
                "question_text": (q.question or "").strip(),
                "option_a": q.resolved_option_a().strip(),
                "option_b": q.resolved_option_b().strip(),
                "option_c": q.resolved_option_c().strip(),
                "option_d": q.resolved_option_d().strip(),
                "correct_option": q.resolved_correct_option(),
                "explanation": (q.explanation or "").strip() or None,
                "question_order": i + 1,
                "created_at": now,
            })

        q_res = supabase_client.table("mock_test_questions").insert(questions_payload).execute()
        if not q_res.data or len(q_res.data) != len(questions_payload):
            if test_id:
                try:
                    supabase_client.table("mock_tests").delete().eq("id", test_id).execute()
                except Exception:
                    pass
            raise HTTPException(status_code=500, detail="Failed to persist all questions. Test creation rolled back.")

    except HTTPException:
        if test_id:
            try:
                supabase_client.table("mock_tests").delete().eq("id", test_id).execute()
            except Exception:
                pass
        raise
    except Exception as e:
        print("[upload_csv_test error]:", e)
        if test_id:
            try:
                supabase_client.table("mock_tests").delete().eq("id", test_id).execute()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail="Failed to create test. Please try again.")

    return {
        "message": f"Mock test '{req.title}' created with {len(req.questions)} questions.",
        "test_id": str(test_id),
        "title": req.title,
        "test_type": test_type,
        "total_questions": len(req.questions),
    }
