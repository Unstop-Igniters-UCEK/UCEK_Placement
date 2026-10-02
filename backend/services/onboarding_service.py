"""
services/onboarding_service.py — Shared student provisioning and validation service
Unified backend service for Direct Email Batch Provisioning and CSV Spreadsheet Provisioning.
"""

import os
import re
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

from backend.database import db, supabase_client, hash_password

CANONICAL_DEPTS = {"CSE", "ECE", "IT"}

DEPARTMENT_ALIASES: Dict[str, str] = {
    # CSE aliases
    "CSE": "CSE",
    "CS": "CSE",
    "COMPUTER SCIENCE": "CSE",
    "COMPUTER SCIENCE & ENGG": "CSE",
    "COMPUTER SCIENCE & ENGINEERING": "CSE",
    "COMPUTER SCIENCE AND ENGINEERING": "CSE",
    "COMPUTER SCIENCE (CSE)": "CSE",

    # ECE aliases
    "ECE": "ECE",
    "EC": "ECE",
    "ELECTRONICS": "ECE",
    "ELECTRONICS & COMM": "ECE",
    "ELECTRONICS & COMM (ECE)": "ECE",
    "ELECTRONICS & COMMUNICATION": "ECE",
    "ELECTRONICS & COMMUNICATION (ECE)": "ECE",
    "ELECTRONICS AND COMMUNICATION": "ECE",
    "ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",

    # IT aliases
    "IT": "IT",
    "INFORMATION TECHNOLOGY": "IT",
    "INFORMATION TECHNOLOGY (IT)": "IT",
}

YEAR_ALIASES: Dict[str, int] = {
    "1": 1, "1ST": 1, "1ST YEAR": 1, "FIRST YEAR": 1,
    "2": 2, "2ND": 2, "2ND YEAR": 2, "SECOND YEAR": 2,
    "3": 3, "3RD": 3, "3RD YEAR": 3, "THIRD YEAR": 3,
    "4": 4, "4TH": 4, "4TH YEAR": 4, "FOURTH YEAR": 4,
}


def normalize_department_code(raw: Optional[str]) -> Optional[str]:
    """
    Resolve raw department strings (including display labels like 'Computer Science (CSE)')
    to one of the three canonical codes: CSE, ECE, IT.
    Returns None if unsupported.
    """
    if not raw:
        return None
    cleaned = str(raw).strip().upper()
    # Direct match or alias lookup
    if cleaned in DEPARTMENT_ALIASES:
        return DEPARTMENT_ALIASES[cleaned]

    # Partial / substring fallback
    if "COMPUTER" in cleaned or "CSE" in cleaned or "CS" in cleaned:
        return "CSE"
    if "ELECTRONIC" in cleaned or "ECE" in cleaned or "EC" in cleaned:
        return "ECE"
    if "INFORMATION" in cleaned or "IT" in cleaned:
        return "IT"

    return None


def normalize_year_int(raw: Any) -> int:
    """Resolve raw year values to integer 1, 2, 3, or 4. Defaults to 4."""
    if isinstance(raw, int) and raw in (1, 2, 3, 4):
        return raw
    cleaned = str(raw or "").strip().upper()
    return YEAR_ALIASES.get(cleaned, 4)


def get_initial_student_password() -> str:
    """Retrieve the generic initial password from configuration."""
    return os.getenv("INITIAL_STUDENT_PASSWORD", "impulse@login").strip() or "impulse@login"


def check_existing_accounts(emails: List[str]) -> Dict[str, Dict[str, Any]]:
    """
    Batch check emails against PostgreSQL / Supabase users table.
    Returns a dictionary mapping existing lowercase emails to account summary dicts:
    { "email": { "id", "name", "email", "department", "year" } }
    """
    if not supabase_client or not emails:
        return {}

    normalized_emails = list(dict.fromkeys(e.strip().lower() for e in emails if e and "@" in e))
    if not normalized_emails:
        return {}

    existing_map: Dict[str, Dict[str, Any]] = {}
    try:
        # Query users in chunks to avoid URL length constraints
        chunk_size = 50
        for i in range(0, len(normalized_emails), chunk_size):
            chunk = normalized_emails[i:i + chunk_size]
            res = supabase_client.table("users").select("id, name, email, role").in_("email", chunk).execute()
            if res.data:
                for row in res.data:
                    u_email = str(row.get("email", "")).strip().lower()
                    u_id = str(row.get("id"))
                    full_user = db.get_user_by_id(u_id)
                    dept_code = "CSE"
                    year_val = "4th Year"
                    if full_user:
                        dept_code = full_user.get("department_code") or full_user.get("branch") or "CSE"
                        year_val = f"{full_user.get('year')}th Year" if full_user.get("year") else "4th Year"

                    existing_map[u_email] = {
                        "id": u_id,
                        "name": row.get("name") or "Student",
                        "email": u_email,
                        "department": dept_code,
                        "year": year_val,
                    }
    except Exception as e:
        print("[OnboardingService check_existing_accounts error]:", e)

    return existing_map


def provision_single_student(
    name: str,
    email: str,
    dept_code: str,
    year: int,
    admin_id: str,
    pw_hash: str
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Atomically provision a single student account.
    Returns (success: bool, user_dict, error_reason).
    """
    if not supabase_client:
        return False, None, "Database client unavailable."

    clean_email = email.strip().lower()
    clean_name = name.strip()

    # Verify department
    dept = db.get_department_by_code(dept_code)
    if not dept:
        return False, None, f"Unknown department code: {dept_code}"

    now = datetime.utcnow().isoformat()

    try:
        # Check if already exists in DB
        existing = db.get_user_by_email(clean_email)
        if existing:
            return False, None, "Account already exists."

        # Insert into users table: must_change_password = True
        u_res = supabase_client.table("users").insert({
            "name": clean_name,
            "email": clean_email,
            "password_hash": pw_hash,
            "role": "student",
            "is_active": True,
            "must_change_password": True,
            "created_at": now,
            "updated_at": now,
        }).execute()

        if not u_res.data:
            return False, None, "Failed to create user record."

        new_user_id = u_res.data[0]["id"]

        # Insert student profile
        supabase_client.table("student_profiles").insert({
            "user_id": new_user_id,
            "department_id": dept["id"],
            "year": year,
            "domain_id": None,
            "readiness_score": 0,
            "onboarding_source": "admin",
            "onboarded_by": admin_id,
            "created_at": now,
            "updated_at": now,
        }).execute()

        year_str = f"{year}st Year" if year == 1 else f"{year}nd Year" if year == 2 else f"{year}rd Year" if year == 3 else "4th Year"

        return True, {
            "id": str(new_user_id),
            "name": clean_name,
            "email": clean_email,
            "role": "student",
            "department_code": dept["code"],
            "branch": dept["code"],
            "year": year_str,
            "year_int": year,
        }, None

    except Exception as e:
        err_msg = str(e)
        if "duplicate" in err_msg.lower() or "unique" in err_msg.lower():
            return False, None, "Account already exists."
        print(f"[OnboardingService provision error {clean_email}]:", e)
        return False, None, "Internal server provisioning failure."


def provision_student_batch(
    students: List[Dict[str, Any]],
    admin_id: str
) -> Dict[str, Any]:
    """
    Common provisioning service used by both Direct Email and CSV onboarding.
    Implements Option B: partial success (valid accounts created even if another fails).
    Does NOT modify existing accounts.
    """
    initial_password = get_initial_student_password()
    pw_hash = hash_password(initial_password)

    created: List[Dict[str, Any]] = []
    skipped: List[Dict[str, Any]] = []
    failed: List[Dict[str, Any]] = []

    seen_in_batch = set()

    for item in students:
        raw_email = str(item.get("email") or item.get("email_id") or "").strip().lower()
        raw_name = str(item.get("name") or item.get("Name") or "").strip()
        raw_dept = str(item.get("department_code") or item.get("dept") or item.get("branch") or "").strip()
        raw_year = item.get("year", 4)

        if not raw_email or "@" not in raw_email:
            failed.append({"email": raw_email or "unknown", "name": raw_name, "reason": "Invalid or missing email address."})
            continue

        if not raw_name:
            failed.append({"email": raw_email, "name": "Missing", "reason": "Missing student full name."})
            continue

        dept_code = normalize_department_code(raw_dept)
        if not dept_code:
            failed.append({"email": raw_email, "name": raw_name, "reason": f"Invalid department '{raw_dept}'. Must be CSE, ECE, or IT."})
            continue

        year_int = normalize_year_int(raw_year)

        # Intra-batch duplicate guard
        if raw_email in seen_in_batch:
            skipped.append({"email": raw_email, "name": raw_name, "reason": "Duplicate email within batch."})
            continue
        seen_in_batch.add(raw_email)

        success, user_data, err_reason = provision_single_student(
            name=raw_name,
            email=raw_email,
            dept_code=dept_code,
            year=year_int,
            admin_id=admin_id,
            pw_hash=pw_hash
        )

        if success and user_data:
            created.append(user_data)
        elif err_reason and ("already exists" in err_reason.lower() or "duplicate" in err_reason.lower()):
            skipped.append({"email": raw_email, "name": raw_name, "reason": "Account already exists."})
        else:
            failed.append({"email": raw_email, "name": raw_name, "reason": err_reason or "Provisioning failed."})

    status_msg = (
        f"Provisioning Complete. {len(created)} student account(s) created."
        if not failed
        else f"Provisioning Completed with Issues. {len(created)} created, {len(failed)} failed."
    )

    return {
        "message": status_msg,
        "createdCount": len(created),
        "skippedCount": len(skipped),
        "failedCount": len(failed),
        "created_count": len(created),
        "skipped_count": len(skipped),
        "failed_count": len(failed),
        "createdUsers": created,
        "created_users": created,
        "skipped": skipped,
        "failed": failed,
        "initialPassword": initial_password,
    }
