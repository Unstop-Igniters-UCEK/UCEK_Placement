"""
routers/user.py — Student profile & dashboard endpoints.
Aligned with Impulse_DB_Design.md §32 (Profile Updates) and §8 (Readiness).
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from backend.database import db, supabase_client, get_user_readiness_metrics, hash_password, verify_password
from backend.auth import get_current_user
from backend.schemas import ProfileUpdateRequest, SelectDomainRequest, SaveResumeRequest, ChangePasswordRequest

router = APIRouter(prefix="/api/user", tags=["user"])


def _build_profile_payload(user: dict, readiness: dict | None = None) -> dict:
    dept_code = user.get("department_code")
    year_int = user.get("year")
    year_str = "4th Year"
    if year_int == 1:
        year_str = "1st Year"
    elif year_int == 2:
        year_str = "2nd Year"
    elif year_int == 3:
        year_str = "3rd Year"
    elif year_int == 4:
        year_str = "4th Year"
    elif year_int:
        year_str = f"{year_int}th Year"

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "department_id": user.get("department_id"),
        "department_code": dept_code,
        "department_name": user.get("department_name"),
        "branch": dept_code,                      # Frontend compatibility
        "year": year_str,                          # Frontend compatibility (string)
        "year_int": year_int,                      # Integer
        "domain_id": user.get("domain_id"),
        "domain_name": user.get("domain_name"),
        "domain": user.get("domain_name"),        # Frontend compatibility
        "domainInterest": user.get("domain_name"),# Frontend compatibility
        "hasSelectedDomain": bool(user.get("domain_id")),
        "readiness_score": (readiness or {}).get("score") if readiness else user.get("readiness_score"),
        "readiness": readiness,
        "is_active": user.get("is_active", True),
        "must_change_password": user.get("must_change_password", False),
    }


@router.get("/readiness")
def get_readiness(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        return {"readiness": {"score": None, "aptitude": None, "technical": None, "ats": None}}
    metrics = get_user_readiness_metrics(current_user["id"])
    return {"readiness": metrics}


@router.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's full profile."""
    readiness = None
    if current_user.get("role") == "student":
        readiness = get_user_readiness_metrics(current_user["id"])
    return {"user": _build_profile_payload(current_user, readiness)}


@router.put("/profile")
def update_profile(req: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    """
    Students can update: name, department_code/branch, year, domain.
    Email and role are read-only.
    Backend identifies the student from the auth token — user_id NOT trusted from frontend.
    """
    uid = current_user["id"]
    role = current_user.get("role", "student")

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    now = datetime.utcnow().isoformat()

    # ── Update users.name ──────────────────────────────────────────────────────
    if req.name is not None:
        try:
            supabase_client.table("users").update({
                "name": req.name.strip(),
                "updated_at": now,
            }).eq("id", uid).execute()
        except Exception as e:
            print(f"[Profile update name {uid}]:", e)
            raise HTTPException(status_code=500, detail="Failed to update name.")

    # ── Update student_profiles (students only) ────────────────────────────────
    if role == "student":
        profile_updates: dict = {"updated_at": now}

        dept_code = req.resolved_dept_code()
        if dept_code:
            dept = db.get_department_by_code(dept_code)
            if not dept:
                raise HTTPException(status_code=400, detail=f"Unknown department code: {dept_code}")
            profile_updates["department_id"] = dept["id"]

        year_val = req.resolved_year()
        if year_val:
            profile_updates["year"] = year_val

        dom_ident = req.resolved_domain_identifier()
        if dom_ident:
            domain = db.get_domain_by_name_or_slug(dom_ident)
            if not domain:
                raise HTTPException(status_code=400, detail=f"Unknown domain: {dom_ident}")
            new_domain_id = domain["id"]

            # If switching domain, delete old roadmap progress per Impulse_DB_Design.md §10
            old_domain_id = current_user.get("domain_id")
            if old_domain_id and str(old_domain_id) != str(new_domain_id):
                try:
                    supabase_client.table("student_roadmap_progress").delete().eq("student_id", uid).execute()
                except Exception as e:
                    print(f"[Domain switch delete roadmap {uid}]:", e)

            profile_updates["domain_id"] = new_domain_id

        if len(profile_updates) > 1:   # more than just updated_at
            try:
                supabase_client.table("student_profiles").update(profile_updates).eq("user_id", uid).execute()
            except Exception as e:
                print(f"[Profile update student_profiles {uid}]:", e)
                raise HTTPException(status_code=500, detail="Failed to update profile.")

    # Re-fetch updated user
    updated_user = db.get_user_by_id(uid)
    if not updated_user:
        raise HTTPException(status_code=500, detail="Could not retrieve updated profile.")

    readiness = get_user_readiness_metrics(uid) if role == "student" else None
    return {
        "message": "Profile updated successfully.",
        "user": _build_profile_payload(updated_user, readiness),
    }


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """
    Authenticated student/user password change.
    Validates current password against stored hash, validates new password match and policy,
    hashes the new password, and updates users.password_hash.
    """
    uid = current_user["id"]
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    # 1. Server-side validation
    if not req.currentPassword:
        raise HTTPException(status_code=400, detail="Current password is required.")
    if not req.newPassword:
        raise HTTPException(status_code=400, detail="New password is required.")
    if len(req.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")
    if req.newPassword != req.confirmPassword:
        raise HTTPException(status_code=400, detail="New passwords do not match.")
    if req.currentPassword == req.newPassword:
        raise HTTPException(status_code=400, detail="New password must be different from current password.")

    # 2. Verify current password against stored password hash
    stored_hash = current_user.get("password_hash")
    if not stored_hash:
        user_record = db.get_user_by_id(uid)
        stored_hash = user_record.get("password_hash") if user_record else None

    if not stored_hash or not verify_password(req.currentPassword, stored_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    # 3. Securely hash the new password using existing password hashing
    new_hash = hash_password(req.newPassword)

    # 4. Update ONLY this authenticated user's password in the database
    success = db.update_user_password(uid, new_hash)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update password. Please try again.")

    return {"message": "Password changed successfully."}


@router.post("/select-domain")
@router.post("/domain")
def select_domain(req: SelectDomainRequest, current_user: dict = Depends(get_current_user)):
    """
    Student selects or changes their active domain.
    On domain switch: old roadmap progress is deleted and fresh progress starts.
    See Impulse_DB_Design.md §10 Domain switch behavior.
    """
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can select a domain.")

    uid = current_user["id"]

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    # Validate domain exists
    dom_ident = req.resolved_identifier()
    domain = db.get_domain_by_name_or_slug(dom_ident)
    if not domain:
        raise HTTPException(status_code=400, detail=f"Unknown domain: {dom_ident}")

    now = datetime.utcnow().isoformat()
    new_domain_id = domain["id"]

    # Get old domain_id
    old_domain_id = current_user.get("domain_id")

    if old_domain_id and str(old_domain_id) != str(new_domain_id):
        # Delete old roadmap progress
        try:
            supabase_client.table("student_roadmap_progress").delete().eq("student_id", uid).execute()
        except Exception as e:
            print(f"[select_domain delete old progress {uid}]:", e)

    # Update domain
    try:
        supabase_client.table("student_profiles").update({
            "domain_id": new_domain_id,
            "updated_at": now,
        }).eq("user_id", uid).execute()
    except Exception as e:
        print(f"[select_domain update {uid}]:", e)
        raise HTTPException(status_code=500, detail="Failed to update domain selection.")

    updated_user = db.get_user_by_id(uid)
    readiness = get_user_readiness_metrics(uid)
    return {
        "message": "Domain selected successfully.",
        "user": _build_profile_payload(updated_user, readiness),
    }


# ─── Student Resume ───────────────────────────────────────────────────────────

@router.get("/resume")
def get_resume(current_user: dict = Depends(get_current_user)):
    """Return the student's persistent resume from PostgreSQL."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students have resumes.")
    resume = db.get_student_resume(current_user["id"])
    return {"resume": resume}


@router.put("/resume")
@router.post("/resume")
def save_resume(req: SaveResumeRequest, current_user: dict = Depends(get_current_user)):
    """
    Persist or update student's resume and sections in PostgreSQL with transactional consistency.
    Backend obtains identity strictly from authenticated token (current_user['id']).
    """
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can save resumes.")

    uid = current_user["id"]

    # If the user edited their full name in the builder header, persist it via users.name
    data = req.dict(exclude_unset=False)
    if data.get("fullName") or data.get("name"):
        new_name = str(data.get("fullName") or data.get("name") or "").strip()
        if new_name and new_name != current_user.get("name"):
            try:
                now_str = datetime.utcnow().isoformat()
                supabase_client.table("users").update({"name": new_name, "updated_at": now_str}).eq("id", uid).execute()
            except Exception as name_err:
                print(f"[save_resume update name {uid}]:", name_err)

    resume_id = db.upsert_student_resume(uid, data)
    if not resume_id:
        raise HTTPException(status_code=500, detail="Unable to save resume. Please try again.")

    updated_resume = db.get_student_resume(uid)
    return {"message": "Resume saved successfully.", "resume": updated_resume}


@router.get("/dashboard")
def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Student dashboard — returns user profile, readiness, recent test history."""
    uid = current_user["id"]

    readiness = get_user_readiness_metrics(uid) if current_user.get("role") == "student" else None
    recent_scores = db.get_student_test_history(uid)[:5] if current_user.get("role") == "student" else []
    latest_hr = db.get_student_latest_hr_attempt(uid) if current_user.get("role") == "student" else None
    mock_drive = db.get_student_mock_drive_summary(uid) if current_user.get("role") == "student" else {"total_available": 0, "cleared": 0}

    return {
        "user": _build_profile_payload(current_user, readiness),
        "readiness": readiness,
        "recent_test_scores": recent_scores,
        "latest_hr_attempt": latest_hr,
        "mock_drive_summary": mock_drive,
    }


@router.get("/departments")
def get_departments():
    """Return the list of active departments (catalog data)."""
    return {"departments": db.get_all_departments()}


@router.get("/domains")
def get_domains():
    """Return the list of active domains (catalog data)."""
    return {"domains": db.get_all_domains()}
