"""
routers/onboarding_router.py — Admin bulk student onboarding endpoints.
Mounts at /api/admin/users/.
Uses the shared OnboardingService for validation, duplicate detection, and account provisioning.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.database import supabase_client
from backend.auth import get_current_user
from backend.services.onboarding_service import (
    check_existing_accounts,
    provision_student_batch,
    get_initial_student_password,
    normalize_department_code,
    normalize_year_int,
)

onboarding_router = APIRouter(prefix="/api/admin/users", tags=["onboarding"])


class CheckBatchRequest(BaseModel):
    emails: List[str]


class ProvisionStudentItem(BaseModel):
    name: str
    email: str
    department_code: str
    year: Any = 4


class BatchProvisionRequest(BaseModel):
    students: List[ProvisionStudentItem]


class BatchCreateUsersRequest(BaseModel):
    emails: List[str]
    names: Optional[Dict[str, str]] = None
    department_code: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[Any] = 4


class BatchCSVCreateRequest(BaseModel):
    users: List[dict]


def _require_admin(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authorization required.")


@onboarding_router.get("/config")
def get_onboarding_config(current_user: dict = Depends(get_current_user)):
    """Return onboarding configuration such as initial default student password."""
    _require_admin(current_user)
    return {
        "initialPassword": get_initial_student_password(),
        "supportedDepartments": ["CSE", "ECE", "IT"]
    }


@onboarding_router.post("/check-batch")
def check_batch_duplicates(
    req: CheckBatchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Check list of incoming student emails against existing database records.
    Returns existing accounts with names, departments, and years for duplicate resolution.
    """
    _require_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    existing_map = check_existing_accounts(req.emails)
    return {
        "existing": existing_map,
        "existingCount": len(existing_map),
        "initialPassword": get_initial_student_password()
    }


@onboarding_router.post("/batch-provision")
def batch_provision(
    req: BatchProvisionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Common student provisioning endpoint used by both Direct Email and CSV onboarding.
    Provisions validated students with generic initial password and must_change_password=True.
    Never overwrites existing accounts.
    """
    _require_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    students_data = [item.dict() for item in req.students]
    result = provision_student_batch(students_data, admin_id=current_user["id"])
    return result


@onboarding_router.post("/batch-create")
def batch_create_legacy(
    req: BatchCreateUsersRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Legacy Direct Email Batch endpoint routed to the shared provisioning service.
    """
    _require_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    dept_raw = req.department_code or req.branch or "CSE"
    dept_code = normalize_department_code(dept_raw) or "CSE"
    year_int = normalize_year_int(req.year)
    names_map = req.names or {}

    students_to_provision = []
    for email in req.emails:
        clean_email = email.strip()
        if not clean_email:
            continue
        name = names_map.get(clean_email) or names_map.get(clean_email.lower()) or "Student"
        students_to_provision.append({
            "name": name,
            "email": clean_email,
            "department_code": dept_code,
            "year": year_int,
        })

    return provision_student_batch(students_to_provision, admin_id=current_user["id"])


@onboarding_router.post("/batch-csv-create")
def batch_csv_create_legacy(
    req: BatchCSVCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Legacy CSV Batch endpoint routed to the shared provisioning service.
    """
    _require_admin(current_user)
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable.")

    students_to_provision = []
    for row in req.users:
        email = str(row.get("email") or row.get("email_id") or "").strip()
        name = str(row.get("name") or row.get("Name") or "").strip() or "Student"
        dept_raw = str(row.get("department_code") or row.get("dept") or row.get("branch") or "CSE").strip()
        dept_code = normalize_department_code(dept_raw) or "CSE"
        year_val = row.get("year", 4)

        if email:
            students_to_provision.append({
                "name": name,
                "email": email,
                "department_code": dept_code,
                "year": year_val,
            })

    return provision_student_batch(students_to_provision, admin_id=current_user["id"])
