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


@router.get("/students")
@router.get("/users")
def get_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    year: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    _require_admin(current_user)

    # Normalise year
    year_int: Optional[int] = None
    if year and year.lower() not in ("", "all years", "all"):
        year_int = YEAR_LABEL_TO_INT.get(year.lower().strip())
        if year_int is None:
            try:
                year_int = int(year)
            except (ValueError, TypeError):
                year_int = None

    # Normalise department/branch to dept code
    dept_code: Optional[str] = None
    if branch and branch.lower() not in ("", "all departments", "all"):
        dept_code = DEPT_LABEL_TO_CODE.get(branch.lower().strip()) or branch.strip().upper()

    result = db.get_admin_student_list(
        page=page, page_size=page_size,
        year=year_int, department_code=dept_code,
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

    dept = db.get_department_by_code(req.department_code.strip().upper())
    if not dept:
        raise HTTPException(status_code=400, detail=f"Unknown department code: {req.department_code}")

    pw_hash = hash_password(req.password)
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

    created = []
    skipped = []
    now = datetime.utcnow().isoformat()
    default_pw = os.getenv("STUDENT_DEFAULT_PASSWORD", "College@2026")

    for row in req.users:
        email = str(row.get("email") or row.get("email_id") or "").strip().lower()
        if not email or "@" not in email:
            skipped.append({"row": row, "reason": "Invalid or missing email."})
            continue

        existing = db.get_user_by_email(email)
        if existing:
            skipped.append({"email": email, "reason": "Email already exists."})
            continue

        name = str(row.get("name") or row.get("Name") or "").strip()
        if not name:
            prefix = email.split("@")[0]
            name = " ".join(p.capitalize() for p in prefix.replace(".", " ").replace("_", " ").split() if not p.isdigit()) or "Student"

        dept_code = str(row.get("department_code") or row.get("dept") or "CSE").strip().upper()
        dept = db.get_department_by_code(dept_code)
        if not dept:
            skipped.append({"email": email, "reason": f"Unknown department code: {dept_code}"})
            continue

        try:
            year_raw = row.get("year", 4)
            year = int(year_raw)
            if year not in (1, 2, 3, 4):
                year = 4
        except (ValueError, TypeError):
            year = 4

        raw_pw = str(row.get("password") or "").strip()
        pw_hash = hash_password(raw_pw if raw_pw else default_pw)

        try:
            u_res = supabase_client.table("users").insert({
                "name": name,
                "email": email,
                "password_hash": pw_hash,
                "role": "student",
                "is_active": True,
                "must_change_password": True,
                "created_at": now,
                "updated_at": now,
            }).execute()

            if not u_res.data:
                skipped.append({"email": email, "reason": "DB insert failed."})
                continue

            new_user_id = u_res.data[0]["id"]

            supabase_client.table("student_profiles").insert({
                "user_id": new_user_id,
                "department_id": dept["id"],
                "year": year,
                "domain_id": None,
                "readiness_score": 0,
                "onboarding_source": "admin",
                "onboarded_by": current_user["id"],
                "created_at": now,
                "updated_at": now,
            }).execute()

            created.append({
                "id": str(new_user_id),
                "name": name,
                "email": email,
                "department_code": dept["code"],
                "year": year,
            })
        except Exception as e:
            print(f"[batch_csv_create {email}]:", e)
            skipped.append({"email": email, "reason": str(e)})

    return {
        "message": f"Batch complete. {len(created)} created, {len(skipped)} skipped.",
        "created_count": len(created),
        "skipped_count": len(skipped),
        "created_students": created,
        "skipped": skipped,
    }


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

