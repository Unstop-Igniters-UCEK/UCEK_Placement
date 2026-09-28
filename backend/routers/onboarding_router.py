"""
routers/onboarding_router.py — Admin bulk student onboarding endpoints.
Preserves the existing URL structure (/api/admin/users/) for frontend compatibility.
Uses the new users + student_profiles schema (Impulse_DB_Design.md §31).
"""

import re
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.database import db, supabase_client, hash_password
from backend.auth import get_current_user

onboarding_router = APIRouter(prefix="/api/admin/users", tags=["onboarding"])


class BatchCreateUsersRequest(BaseModel):
    emails: List[str]
    names: Optional[Dict[str, str]] = None
    department_code: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[Any] = 4

    def resolved_year(self) -> int:
        from backend.schemas import parse_year_int
        y = parse_year_int(self.year)
        return y if y else 4

    def resolved_dept_code(self) -> str:
        code = self.department_code or self.branch or "CSE"
        code_str = str(code).strip().upper()
        if code_str in ("CS", "COMPUTER SCIENCE"):
            return "CSE"
        return code_str


class BatchCSVCreateRequest(BaseModel):
    users: List[dict]


def _derive_name(email: str) -> str:
    prefix = email.split('@')[0]
    parts = re.split(r'[._\-]+', prefix)
    cleaned = [p.capitalize() for p in parts if p and not p.isdigit()]
    return " ".join(cleaned) if cleaned else "Student"


@onboarding_router.post("/batch-create")
def batch_create_users(
    req: BatchCreateUsersRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authorization required.")

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    dept_code = req.resolved_dept_code()
    dept = db.get_department_by_code(dept_code)
    if not dept:
        raise HTTPException(status_code=400, detail=f"Unknown department code: {dept_code}")

    year = req.resolved_year()

    valid_emails = []
    for raw in req.emails:
        cleaned = raw.strip().lower()
        if cleaned and "@" in cleaned and "." in cleaned.split("@")[-1]:
            valid_emails.append(cleaned)

    unique_emails = list(dict.fromkeys(valid_emails))
    names_map = req.names or {}

    created = []
    skipped = []
    now = datetime.utcnow().isoformat()
    default_pw = f"{dept['code']}@2026"
    pw_hash = hash_password(default_pw)

    for email in unique_emails:
        existing = db.get_user_by_email(email)
        if existing:
            skipped.append({"email": email, "reason": "Email already exists."})
            continue

        provided_name = (names_map.get(email) or names_map.get(email.lower()) or "").strip()
        student_name = provided_name if provided_name else _derive_name(email)

        try:
            u_res = supabase_client.table("users").insert({
                "name": student_name,
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

            year_str = "4th Year"
            if year == 1:
                year_str = "1st Year"
            elif year == 2:
                year_str = "2nd Year"
            elif year == 3:
                year_str = "3rd Year"

            created.append({
                "id": str(new_user_id),
                "name": student_name,
                "email": email,
                "role": "student",
                "department_code": dept["code"],
                "branch": dept["code"],
                "year": year_str,
                "year_int": year,
            })
        except Exception as e:
            print(f"[batch_create_users {email}]:", e)
            skipped.append({"email": email, "reason": str(e)})

    return {
        "message": f"Batch provisioning complete. {len(created)} created, {len(skipped)} skipped.",
        "created_count": len(created),
        "createdCount": len(created),
        "skipped_count": len(skipped),
        "skippedCount": len(skipped),
        "default_password": default_pw,
        "defaultPassword": default_pw,
        "created_users": created,
        "createdUsers": created,
        "skipped": skipped,
    }


@onboarding_router.post("/batch-csv-create")
def batch_csv_create_users(
    req: BatchCSVCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authorization required.")

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    created = []
    skipped = []
    now = datetime.utcnow().isoformat()
    fallback_pw = "College@2026"

    for row in req.users:
        email = str(row.get("email") or row.get("email_id") or "").strip().lower()
        if not email or "@" not in email:
            skipped.append({"row": row, "reason": "Invalid or missing email."})
            continue

        existing = db.get_user_by_email(email)
        if existing:
            skipped.append({"email": email, "reason": "Email already exists."})
            continue

        name = str(row.get("name") or row.get("Name") or "").strip() or _derive_name(email)

        dept_code = str(row.get("department_code") or row.get("dept") or "CSE").strip().upper()
        dept = db.get_department_by_code(dept_code)
        if not dept:
            skipped.append({"email": email, "reason": f"Unknown department code: {dept_code}"})
            continue

        try:
            year = int(row.get("year", 4))
            if year not in (1, 2, 3, 4):
                year = 4
        except (ValueError, TypeError):
            year = 4

        raw_pw = str(row.get("password") or "").strip()
        pw_hash = hash_password(raw_pw if raw_pw else fallback_pw)

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

            year_str = "4th Year"
            if year == 1:
                year_str = "1st Year"
            elif year == 2:
                year_str = "2nd Year"
            elif year == 3:
                year_str = "3rd Year"

            created.append({
                "id": str(new_user_id),
                "name": name,
                "email": email,
                "role": "student",
                "department_code": dept["code"],
                "branch": dept["code"],
                "year": year_str,
                "year_int": year,
            })
        except Exception as e:
            print(f"[batch_csv_create {email}]:", e)
            skipped.append({"email": email, "reason": str(e)})

    return {
        "message": f"Successfully provisioned {len(created)} student(s). {len(skipped)} skipped.",
        "created_count": len(created),
        "createdCount": len(created),
        "skipped_count": len(skipped),
        "skippedCount": len(skipped),
        "created_users": created,
        "createdUsers": created,
        "skipped": skipped,
    }
