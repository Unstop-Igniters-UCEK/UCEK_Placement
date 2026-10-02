"""
routers/admin.py — Admin dashboard and management endpoints.
Aligned with Impulse_DB_Design.md §29 (Admin Dashboard Metrics), §30 (Student List).
"""

import uuid
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.database import db, supabase_client, hash_password
from backend.auth import get_current_user
from backend.schemas import CreateStudentRequest, BatchCSVCreateRequest, UpdateRegistrationSettingRequest

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _require_admin(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required.")


# ─── Dashboard KPIs ───────────────────────────────────────────────────────────

@router.get("/dashboard-stats")
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    kpis = db.get_admin_kpis()
    return {
        "kpis": {
            "totalStudents": kpis["total_students"],
            "totalMockTestsTaken": kpis["total_mock_tests_taken"],
            "totalResumeReviews": kpis["total_resumes_reviewed"],
            # Expose both keys so frontend can use either
            "totalInterviewsCompleted": kpis["total_interview_practices"],
            "totalInterviewSimulationsCompleted": kpis["total_interview_practices"],
        }
    }


# ─── Student List (paginated, filterable) ─────────────────────────────────────

YEAR_LABEL_TO_INT = {
    "1st year": 1, "1st": 1, "1": 1,
    "2nd year": 2, "2nd": 2, "2": 2,
    "3rd year": 3, "3rd": 3, "3": 3,
    "4th year": 4, "4th": 4, "4": 4,
}

DEPT_LABEL_TO_CODE = {
    "computer science & engg": "CSE",
    "computer science & engineering": "CSE",
    "cse": "CSE",
    "electronics & comm engg": "ECE",
    "electronics & communication engineering": "ECE",
    "ece": "ECE",
    "information technology": "IT",
    "it": "IT",
}


def _parse_filter_params(year: Optional[str], branch: Optional[str]):
    year_int: Optional[int] = None
    if year and year.lower() not in ("", "all years", "all"):
        year_int = YEAR_LABEL_TO_INT.get(year.lower().strip())
        if year_int is None:
            try:
                year_int = int(year)
            except (ValueError, TypeError):
                year_int = None

    dept_code: Optional[str] = None
    if branch and branch.lower() not in ("", "all departments", "all"):
        dept_code = DEPT_LABEL_TO_CODE.get(branch.lower().strip()) or branch.strip().upper()

    return year_int, dept_code


@router.get("/students")
def get_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    year: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    _require_admin(current_user)
    year_int, dept_code = _parse_filter_params(year, branch)
    result = db.get_admin_student_list(
        page=page, page_size=page_size,
        year=year_int, department_code=dept_code,
        include_admins=False,
    )
    return {
        "users": result["students"],
        "students": result["students"],
        "total": result["total"],
        "page": page,
        "page_size": page_size,
    }


@router.get("/users")
def get_all_users_for_roles(
    page: int = Query(1, ge=1),
    page_size: int = Query(200, ge=1, le=500),
    year: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    _require_admin(current_user)
    year_int, dept_code = _parse_filter_params(year, branch)
    result = db.get_admin_student_list(
        page=page, page_size=page_size,
        year=year_int, department_code=dept_code,
        include_admins=True,
    )
    return {
        "users": result["students"],
        "students": result["students"],
        "total": result["total"],
        "page": page,
        "page_size": page_size,
    }


# ─── Create single student (admin onboarding) ─────────────────────────────────

@router.post("/students")
def create_student(req: CreateStudentRequest, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    email = req.email.strip().lower()
    existing = db.get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="A student with this email already exists.")

    from backend.services.onboarding_service import normalize_department_code, get_initial_student_password
    dept_code = normalize_department_code(req.department_code)
    dept = db.get_department_by_code(dept_code) if dept_code else None
    if not dept:
        raise HTTPException(status_code=400, detail=f"Unknown department code: {req.department_code}")

    raw_pw = (req.password or "").strip() or get_initial_student_password()
    pw_hash = hash_password(raw_pw)
    now = datetime.utcnow().isoformat()

    try:
        u_res = supabase_client.table("users").insert({
            "name": req.name.strip(),
            "email": email,
            "password_hash": pw_hash,
            "role": "student",
            "is_active": True,
            "must_change_password": True,
            "created_at": now,
            "updated_at": now,
        }).execute()

        if not u_res.data:
            raise HTTPException(status_code=500, detail="Failed to create user.")

        new_user_id = u_res.data[0]["id"]

        supabase_client.table("student_profiles").insert({
            "user_id": new_user_id,
            "department_id": dept["id"],
            "year": req.year,
            "domain_id": None,
            "readiness_score": 0,
            "onboarding_source": "admin",
            "onboarded_by": current_user["id"],
            "created_at": now,
            "updated_at": now,
        }).execute()

    except HTTPException:
        raise
    except Exception as e:
        print("[Admin create_student error]:", e)
        raise HTTPException(status_code=500, detail="Failed to create student account.")

    return {
        "message": "Student account created successfully.",
        "student": {
            "id": str(new_user_id),
            "name": req.name.strip(),
            "email": email,
            "department_code": dept["code"],
            "year": req.year,
        }
    }


# ─── Batch CSV create students ─────────────────────────────────────────────────

@router.post("/students/batch-csv")
def batch_csv_create(req: BatchCSVCreateRequest, current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    from backend.services.onboarding_service import provision_student_batch
    return provision_student_batch(req.users, admin_id=current_user["id"])


# ─── Fetch all published tests (admin view) ───────────────────────────────────

@router.get("/tests")
def get_all_tests(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    return {"tests": db.get_all_published_tests()}


# ─── Platform Settings (Student Self-Registration) ───────────────────────────

@router.get("/settings/registration")
def get_registration_setting(current_user: dict = Depends(get_current_user)):
    _require_admin(current_user)
    try:
        settings = db.get_platform_settings()
        return {
            "student_self_registration_enabled": bool(settings.get("student_self_registration_enabled", False))
        }
    except Exception as e:
        print(f"[Admin get_registration_setting error]: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve platform settings: {str(e)}"
        )


@router.patch("/settings/registration")
@router.put("/settings/registration")
def update_registration_setting(
    req: UpdateRegistrationSettingRequest,
    current_user: dict = Depends(get_current_user)
):
    _require_admin(current_user)
    try:
        db.set_student_self_registration_enabled(req.enabled)
        return {
            "message": f"Student self-registration is now {'enabled' if req.enabled else 'disabled'}.",
            "student_self_registration_enabled": bool(req.enabled)
        }
    except Exception as e:
        print(f"[Admin update_registration_setting error]: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update platform settings: {str(e)}"
        )


# ─── Password Reset Requests (Admin-Assisted) ─────────────────────────────────

@router.get("/password-reset-requests")
def get_password_reset_requests(current_user: dict = Depends(get_current_user)):
    """
    List all pending password reset requests for administrators.
    """
    _require_admin(current_user)
    requests = db.get_pending_password_reset_requests()
    return {
        "requests": requests,
        "total": len(requests)
    }


@router.post("/password-reset-requests/{request_id}/reset")
def reset_student_password(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Admin resets student password:
    1. Verifies admin authorization.
    2. Atomically validates request is pending and target is active student.
    3. Generates 5-character temporary password (no visually ambiguous chars).
    4. Hashes and updates users.password_hash with must_change_password=True.
    5. Returns temporary password once for copying.
    """
    _require_admin(current_user)
    temp_pw, student, err = db.reset_student_password_from_request(request_id)
    if err:
        raise HTTPException(status_code=400, detail=err)

    return {
        "temporaryPassword": temp_pw,
        "studentName": student["name"],
        "studentEmail": student["email"],
        "studentId": student["id"],
        "requestId": request_id,
        "message": "Temporary password generated successfully."
    }


@router.post("/password-reset-requests/{target_id}/regenerate")
def regenerate_student_password(
    target_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Admin generates a new temporary password if previous one was uncopied or lost:
    - Generates another secure 5-character password.
    - Overwrites previous hash, immediately invalidating previous temporary password.
    - Keeps must_change_password = True.
    """
    _require_admin(current_user)
    # Check if target_id is student_id or request_id
    temp_pw, student, err = db.regenerate_student_temporary_password(target_id)
    if err:
        # Fallback to reset_student_password_from_request in case request_id was passed
        temp_pw, student, err = db.reset_student_password_from_request(target_id)
    if err:
        raise HTTPException(status_code=400, detail=err)

    return {
        "temporaryPassword": temp_pw,
        "studentName": student["name"],
        "studentEmail": student["email"],
        "studentId": student["id"],
        "requestId": target_id,
        "message": "New temporary password generated successfully. Previous temporary password is now invalid."
    }


@router.post("/password-reset-requests/{request_id}/resolve")
@router.delete("/password-reset-requests/{request_id}")
def resolve_password_reset_request(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark/delete password reset request as resolved.
    Removes the request so it disappears from the pending queue for all admins.
    """
    _require_admin(current_user)
    db.resolve_password_reset_request(request_id)
    return {
        "message": "Password reset request resolved successfully.",
        "requestId": request_id
    }


# ─── Permanent Student Deletion (Admin-only) ──────────────────────────────────

@router.delete("/students/{student_id}")
def delete_student(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Permanently delete a student account and ALL student-owned placement records.
    Only authenticated admins can delete student accounts.
    Admin accounts cannot be deleted.
    """
    _require_admin(current_user)

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    uid = str(student_id).strip()
    if not uid:
        raise HTTPException(status_code=400, detail="Student ID is required.")

    # 1. Fetch target user to verify existence and role
    target_user = db.get_user_by_id(uid)
    if not target_user:
        raise HTTPException(status_code=404, detail="Student account not found.")

    if target_user.get("role") != "student":
        raise HTTPException(status_code=400, detail="Only student accounts can be permanently deleted.")

    student_name = target_user.get("name") or "Student"
    student_email = target_user.get("email") or ""

    # 2. Execute transactional deletion
    success, error_msg = db.delete_student_permanently(uid)
    if not success:
        print(f"[Admin delete_student error for {uid}]: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail="Unable to delete this student. No changes were made."
        )

    return {
        "success": True,
        "message": f"{student_name} and all associated data have been permanently removed.",
        "studentId": uid,
        "studentName": student_name,
        "studentEmail": student_email
    }


