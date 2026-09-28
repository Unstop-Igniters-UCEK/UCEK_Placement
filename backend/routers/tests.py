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
from typing import Dict

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
    year = current_user.get("year")

    tests = db.get_published_tests_for_student(department_id=dept_id, year=year)
    return {"tests": tests}


# ─── Test history ─────────────────────────────────────────────────────────────

@router.get("/history/my")
def get_test_history(current_user: dict = Depends(get_current_user)):
    """Return the student's submitted mock test attempt history."""
    scores = db.get_student_test_history(current_user["id"])
    return {"scores": scores}


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
        if isinstance(val, int) or (isinstance(val, str) and str(val).isdigit()):
            normalised_answers[str(q_id_key)] = _idx_to_letter.get(int(val), "")
        else:
            normalised_answers[str(q_id_key)] = str(val).strip().upper()

    # Score
    score = 0
    answers_payload = []
    review_list = []

    for q in questions:
        q_id = str(q["id"])
        correct = str(q.get("correct_option", "")).upper()
        selected = normalised_answers.get(q_id, "").upper()
        is_correct = selected == correct and bool(correct)
        if is_correct:
            score += 1

        answers_payload.append({
            "question_id": q_id,
            "selected_option": selected if selected in ("A", "B", "C", "D") else None,
            "is_correct": is_correct,
        })

        opt_a = q.get("option_a", "")
        opt_b = q.get("option_b", "")
        opt_c = q.get("option_c", "")
        opt_d = q.get("option_d", "")
        q_text = q.get("question_text", "")
        review_list.append({
            "id": q_id,
            "question": q_text,
            "question_text": q_text,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "options": [opt_a, opt_b, opt_c, opt_d],
            "correct_option": correct,
            "selected_option": selected if selected in ("A", "B", "C", "D") else None,
            "is_correct": is_correct,
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

        # Store per-question answers
        for ans in answers_payload:
            try:
                supabase_client.table("mock_test_attempt_answers").insert({
                    "attempt_id": attempt_id,
                    "question_id": ans["question_id"],
                    "selected_option": ans["selected_option"],
                    "is_correct": ans["is_correct"],
                    "created_at": now,
                }).execute()
            except Exception as e:
                print(f"[submit_test answer insert {attempt_id}]:", e)

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
        q_text = q.question or ""
        if not q_text.strip():
            raise HTTPException(status_code=400, detail=f"Question {i+1} is missing question text.")
        correct = q.resolved_correct_option()
        if correct not in valid_opts:
            raise HTTPException(status_code=400, detail=f"Question {i+1}: correct_option must be A, B, C, or D.")

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

        # Insert questions
        for i, q in enumerate(req.questions):
            supabase_client.table("mock_test_questions").insert({
                "test_id": test_id,
                "question_text": (q.question or "").strip(),
                "option_a": q.resolved_option_a().strip(),
                "option_b": q.resolved_option_b().strip(),
                "option_c": q.resolved_option_c().strip(),
                "option_d": q.resolved_option_d().strip(),
                "correct_option": q.resolved_correct_option(),
                "explanation": (q.explanation or "").strip(),
                "question_order": i + 1,
                "created_at": now,
            }).execute()

    except HTTPException:
        raise
    except Exception as e:
        print("[upload_csv_test error]:", e)
        raise HTTPException(status_code=500, detail="Failed to create test. Please try again.")

    return {
        "message": f"Mock test '{req.title}' created with {len(req.questions)} questions.",
        "test_id": str(test_id),
        "title": req.title,
        "test_type": test_type,
        "total_questions": len(req.questions),
    }
