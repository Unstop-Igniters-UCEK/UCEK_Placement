import uuid
import re
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from backend.database import db, hash_password, supabase_client
from backend.auth import get_current_user
from backend.mock_data import DEFAULT_ROADMAPS

onboarding_router = APIRouter(prefix="/api/admin/users", tags=["onboarding"])

class BatchCreateUsersRequest(BaseModel):
    emails: List[str]
    names: Optional[Dict[str, str]] = None
    year: str = "4th Year"
    branch: str = "Computer Science (CSE)"

class BatchCSVCreateRequest(BaseModel):
    users: List[dict]

def derive_name_from_email(email: str) -> str:
    prefix = email.split('@')[0]
    parts = re.split(r'[._\-]+', prefix)
    cleaned_parts = [p.capitalize() for p in parts if p and not p.isdigit()]
    if not cleaned_parts:
        return "Student User"
    return " ".join(cleaned_parts)

def generate_default_password(branch: str, year: str) -> str:
    b_upper = branch.upper()
    code = "CSE"
    if "ELECTRONIC" in b_upper or "ECE" in b_upper or "EC" in b_upper:
        code = "ECE"
    elif "INFO" in b_upper or "IT" in b_upper:
        code = "IT"
    elif "EEE" in b_upper or "ELECTRI" in b_upper:
        code = "EEE"
    elif "MECH" in b_upper or "ME" in b_upper:
        code = "ME"
    elif "CIVIL" in b_upper or "CE" in b_upper:
        code = "CE"
    elif "BIO" in b_upper or "BT" in b_upper:
        code = "BT"
    
    if "4" in year:
        yr = "2026"
    elif "3" in year:
        yr = "2027"
    elif "2" in year:
        yr = "2028"
    elif "1" in year:
        yr = "2029"
    else:
        yr = "2026"

    return f"{code}@{yr}"

def map_dept_code(dept_val: str) -> str:
    d = dept_val.strip().lower()
    if d == "cs":
        return "Computer Science & Engg"
    elif d == "ec":
        return "Electronics & Comm Engg"
    elif d == "it":
        return "Information Technology"
    return "Computer Science & Engg"

def normalize_year_str(year_val: str) -> str:
    y = str(year_val).strip().lower()
    if "1" in y:
        return "1st Year"
    elif "2" in y:
        return "2nd Year"
    elif "3" in y:
        return "3rd Year"
    elif "4" in y:
        return "4th Year"
    return "4th Year"


@onboarding_router.post("/batch-create")
def batch_create_users(
    req: BatchCreateUsersRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin authorization required"
        )

    valid_emails = []
    for raw in req.emails:
        cleaned = raw.strip().lower()
        if cleaned and "@" in cleaned and "." in cleaned.split("@")[-1]:
            valid_emails.append(cleaned)

    unique_emails = list(dict.fromkeys(valid_emails))

    default_pw = generate_default_password(req.branch, req.year)
    hashed_pw = hash_password(default_pw)

    created_users = []
    skipped_count = 0

    existing_emails = set(u.get("email", "").strip().lower() for u in getattr(db, "users", []))
    names_map = req.names or {}

    for email in unique_emails:
        if email in existing_emails:
            skipped_count += 1
            continue

        existing_emails.add(email)
        user_id = f"u_{uuid.uuid4().hex[:8]}"
        
        # Use explicitly provided name if available, else fallback to derived name
        provided_name = (names_map.get(email) or names_map.get(email.lower()) or "").strip()
        student_name = provided_name if provided_name else derive_name_from_email(email)

        new_user = {
            "id": user_id,
            "name": student_name,
            "email": email,
            "passwordHash": hashed_pw,
            "password_hash": hashed_pw,
            "role": "mentee",
            "year": req.year,
            "branch": req.branch,
            "domainInterest": "Software Engineering",
            "domain": "Software Engineering",
            "hasSelectedDomain": False,
            "is_verified": True,
            "readinessScore": 0,
            "readiness_score": 0,
        }

        db.users.append(new_user)
        if hasattr(db, "user_map"):
            db.user_map[user_id] = new_user

        modules = DEFAULT_ROADMAPS.get("Software Engineering", [])
        if hasattr(db, "userRoadmaps"):
            db.userRoadmaps.append({
                "id": f"rm_{user_id}",
                "userId": user_id,
                "domain": "Software Engineering",
                "overallProgress": 0,
                "modules": modules
            })

        if supabase_client:
            try:
                supabase_client.table("users").insert({
                    "id": user_id,
                    "email": email,
                    "name": student_name,
                    "password_hash": hashed_pw,
                    "role": "mentee",
                    "year": req.year,
                    "branch": req.branch,
                    "domain_interest": "Software Engineering",
                    "readiness_score": 0,
                    "has_selected_domain": False
                }).execute()
            except Exception as e:
                print(f"[Supabase batch-create notice]: {e}")

        created_users.append({
            "id": user_id,
            "name": student_name,
            "email": email,
            "role": "mentee",
            "year": req.year,
            "branch": req.branch,
            "readinessScore": 0
        })

    db.save()

    return {
        "message": f"Batch provisioning complete. {len(created_users)} user(s) created, {skipped_count} skipped.",
        "createdCount": len(created_users),
        "skippedCount": skipped_count,
        "defaultPassword": default_pw,
        "createdUsers": created_users
    }


@onboarding_router.post("/batch-csv-create")
def batch_csv_create_users(
    req: BatchCSVCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin authorization required"
        )

    existing_emails = set(u.get("email", "").strip().lower() for u in getattr(db, "users", []))
    created_count = 0
    skipped_count = 0
    created_users = []

    fallback_default_pw = "College@2026"

    for row in req.users:
        raw_email = str(row.get("email id") or row.get("email_id") or row.get("email") or "").strip().lower()
        if not raw_email or "@" not in raw_email:
            skipped_count += 1
            continue

        if raw_email in existing_emails:
            skipped_count += 1
            continue

        existing_emails.add(raw_email)

        name_val = str(row.get("Name") or row.get("name") or "").strip()
        if not name_val:
            name_val = derive_name_from_email(raw_email)

        raw_dept = str(row.get("dept") or row.get("branch") or "cs").strip().lower()
        mapped_branch = map_dept_code(raw_dept)

        raw_year = str(row.get("year") or "4th Year").strip()
        normalized_year = normalize_year_str(raw_year)

        raw_password = str(row.get("password") or "").strip()
        if raw_password:
            hashed_pw = hash_password(raw_password)
        else:
            hashed_pw = hash_password(fallback_default_pw)

        user_id = f"u_{uuid.uuid4().hex[:8]}"

        new_user = {
            "id": user_id,
            "name": name_val,
            "email": raw_email,
            "passwordHash": hashed_pw,
            "password_hash": hashed_pw,
            "role": "mentee",
            "year": normalized_year,
            "branch": mapped_branch,
            "domainInterest": "Software Engineering",
            "domain": "Software Engineering",
            "hasSelectedDomain": False,
            "is_verified": True,
            "readinessScore": 0,
            "readiness_score": 0,
        }

        db.users.append(new_user)
        if hasattr(db, "user_map"):
            db.user_map[user_id] = new_user

        modules = DEFAULT_ROADMAPS.get("Software Engineering", [])
        if hasattr(db, "userRoadmaps"):
            db.userRoadmaps.append({
                "id": f"rm_{user_id}",
                "userId": user_id,
                "domain": "Software Engineering",
                "overallProgress": 0,
                "modules": modules
            })

        if supabase_client:
            try:
                supabase_client.table("users").insert({
                    "id": user_id,
                    "email": raw_email,
                    "name": name_val,
                    "password_hash": hashed_pw,
                    "role": "mentee",
                    "year": normalized_year,
                    "branch": mapped_branch,
                    "domain_interest": "Software Engineering",
                    "readiness_score": 0,
                    "has_selected_domain": False
                }).execute()
            except Exception as e:
                print(f"[Supabase batch-csv-create notice]: {e}")

        created_count += 1
        created_users.append({
            "id": user_id,
            "name": name_val,
            "email": raw_email,
            "role": "mentee",
            "year": normalized_year,
            "branch": mapped_branch
        })

    db.save()

    return {
        "message": f"Successfully provisioned {created_count} user(s)",
        "createdCount": created_count,
        "skippedCount": skipped_count,
        "createdUsers": created_users
    }
