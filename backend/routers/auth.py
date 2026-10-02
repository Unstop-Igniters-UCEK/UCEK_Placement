"""
routers/auth.py — Authentication endpoints for Impulse UCEK Placement Suite.
Uses the new users + student_profiles schema (Impulse_DB_Design.md).
"""

import os
import random
import uuid
from datetime import datetime, timedelta

from typing import Optional
from fastapi import APIRouter, HTTPException, Response, Depends, Request, status
from fastapi.security import HTTPAuthorizationCredentials
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.database import db, hash_password, verify_password, supabase_client
from backend.auth import create_access_token, create_refresh_token, decode_token, get_current_user, ALLOWED_EMAIL_DOMAIN, security
from backend.schemas import (
    RegisterRequest, LoginRequest, DemoLoginRequest,
    SendOTPRequest, VerifyOTPResetRequest,
    ForgotPasswordHelpRequest, ForcedChangePasswordRequest
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


def _build_user_payload(user: dict, include_readiness: bool = False) -> dict:
    """Build the JSON object returned to the frontend for a logged-in user."""
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

    payload = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "is_active": user.get("is_active", True),
        "must_change_password": user.get("must_change_password", False),
        # Profile fields (students)
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
        "readiness_score": user.get("readiness_score"),
    }
    if include_readiness and user.get("role") == "student":
        from backend.database import get_user_readiness_metrics
        readiness = get_user_readiness_metrics(user["id"])
        payload["readiness"] = readiness
        payload["readiness_score"] = readiness.get("score")
    return payload


def _set_refresh_cookie(response: Response, refresh_token: str):
    is_secure = (
        os.getenv("ENVIRONMENT", "").lower() == "production"
        or os.getenv("NODE_ENV", "").lower() == "production"
    )
    # Session cookie: No max_age or expires so it is discarded when browser closes
    response.set_cookie(
        key="ucek_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
    )


# ─── Registration Availability ────────────────────────────────────────────────

@router.get("/registration-status")
def get_registration_status():
    """
    Public endpoint: Returns whether student self-registration is currently allowed.
    Fails closed (returns False) if database query fails.
    """
    enabled = db.is_student_self_registration_enabled()
    return {
        "student_self_registration_enabled": bool(enabled)
    }


# ─── Register ─────────────────────────────────────────────────────────────────

@router.post("/register")
@router.post("/signup")
@limiter.limit("30/minute")
def register(request: Request, req: RegisterRequest, response: Response):
    email = req.email.strip().lower()

    # Optional domain enforcement
    if ALLOWED_EMAIL_DOMAIN and not email.endswith(f"@{ALLOWED_EMAIL_DOMAIN}"):
        if os.getenv("STRICT_EMAIL_DOMAIN", "false") == "true":
            raise HTTPException(
                status_code=400,
                detail=f"Registration restricted to official college email (@{ALLOWED_EMAIL_DOMAIN})"
            )

    # Resolve role
    raw_role = (req.role or "student").lower()
    role = "student" if raw_role in ("student", "mentee", "user") else raw_role

    # Student self-registration restriction check (authoritative database check)
    if role == "student":
        if not db.is_student_self_registration_enabled():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Impulse is currently exclusive to students of the University College of Engineering Kariavattom (UCEK). Student self-registration is temporarily unavailable. If you are a UCEK student, please contact an admin or faculty member to have your account onboarded."
            )

    # Admin role check
    if role == "admin":
        expected_code = os.getenv("ADMIN_SECRET_KEY", "UCEK_ADMIN_FACULTY_2026").strip()
        provided_code = (req.adminSecurityCode or "").strip()
        if provided_code != expected_code:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid Admin Security Passcode. Admin registration is restricted to authorised college faculty."
            )

    # Check duplicate email
    existing = db.get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database unavailable. Please try again later.")

    pw_hash = hash_password(req.password)
    now = datetime.utcnow().isoformat()

    try:
        # Insert user row
        u_res = supabase_client.table("users").insert({
            "name": req.name.strip(),
            "email": email,
            "password_hash": pw_hash,
            "role": role,
            "is_active": True,
            "must_change_password": False,
            "created_at": now,
            "updated_at": now,
        }).execute()

        if not u_res.data:
            raise HTTPException(status_code=500, detail="Failed to create user account.")

        new_user_id = u_res.data[0]["id"]

        # For students, create student_profiles row
        if role == "student":
            dept_code = req.resolved_dept_code() or "CSE"
            dept = db.get_department_by_code(dept_code)
            if not dept:
                depts = db.get_all_departments()
                dept = depts[0] if depts else None
            if not dept:
                raise HTTPException(status_code=400, detail="Invalid department.")
            department_id = dept["id"]

            year = req.resolved_year() or 4

            domain_id = None
            dom_ident = req.domainInterest or req.domain
            if dom_ident:
                dom = db.get_domain_by_name_or_slug(dom_ident)
                if dom:
                    domain_id = dom["id"]

            supabase_client.table("student_profiles").insert({
                "user_id": new_user_id,
                "department_id": department_id,
                "year": year,
                "domain_id": domain_id,
                "readiness_score": 0,
                "onboarding_source": "self",
                "onboarded_by": None,
                "created_at": now,
                "updated_at": now,
            }).execute()

    except HTTPException:
        raise
    except Exception as e:
        print("[Register error]:", e)
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")

    user = db.get_user_by_id(str(new_user_id))
    if not user:
        raise HTTPException(status_code=500, detail="Account created but could not retrieve user data.")

    access_token = create_access_token({"id": user["id"], "email": user["email"], "role": user["role"], "name": user["name"]})
    refresh_token = create_refresh_token(user["id"])
    _set_refresh_cookie(response, refresh_token)

    return {
        "message": "Account registered successfully.",
        "user": _build_user_payload(user, include_readiness=True),
        "accessToken": access_token,
    }


# ─── Login ────────────────────────────────────────────────────────────────────

@router.post("/login")
@limiter.limit("30/minute")
def login(request: Request, req: LoginRequest, response: Response):
    email = req.email.strip().lower()
    user = db.get_user_by_email(email)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="This account has been deactivated.")

    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Role portal isolation check
    if req.role:
        raw_portal = req.role.strip().lower()
        requested_portal = "admin" if raw_portal == "admin" else "student"

        raw_user_role = str(user.get("role") or "student").strip().lower()
        actual_user_role = "admin" if raw_user_role == "admin" else "student"

        if requested_portal == "student" and actual_user_role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This is an administrator account. Please use the Admin sign-in."
            )
        elif requested_portal == "admin" and actual_user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This is a student account. Please use the Student sign-in."
            )

    access_token = create_access_token({"id": user["id"], "email": user["email"], "role": user["role"], "name": user["name"]})
    refresh_token = create_refresh_token(user["id"])
    _set_refresh_cookie(response, refresh_token)

    return {
        "message": "Login successful.",
        "user": _build_user_payload(user, include_readiness=True),
        "accessToken": access_token,
    }


# ─── Me ───────────────────────────────────────────────────────────────────────

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": _build_user_payload(current_user, include_readiness=True)}


# ─── Refresh ──────────────────────────────────────────────────────────────────

@router.post("/refresh")
def refresh_token_endpoint(request: Request, response: Response):
    cookie_val = request.cookies.get("ucek_refresh_token")
    if not cookie_val:
        raise HTTPException(status_code=401, detail="Refresh token required.")

    payload = decode_token(cookie_val)
    if payload.get("tokenType") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

    user_id = payload.get("id")
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    access_token = create_access_token({"id": user["id"], "email": user["email"], "role": user["role"], "name": user["name"]})
    return {"accessToken": access_token}


# ─── Logout ───────────────────────────────────────────────────────────────────

@router.post("/logout")
def logout(response: Response, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if credentials and credentials.credentials:
        token = credentials.credentials
        if token not in db.revokedTokens:
            db.revokedTokens.append(token)
    response.delete_cookie(key="ucek_refresh_token")
    return {"message": "Logged out successfully."}


# ─── Demo login (admin only — looks up the seeded admin account) ──────────────

@router.post("/demo-login")
def demo_login(req: DemoLoginRequest, response: Response):
    role = req.role.lower()
    admin_email = os.getenv("ADMIN_EMAIL", "unstopignitersucek@gmail.com").strip().lower()

    if role == "admin":
        user = db.get_user_by_email(admin_email)
    else:
        raise HTTPException(status_code=404, detail=f"Demo account not available for role '{role}'.")

    if not user:
        raise HTTPException(status_code=404, detail=f"Demo account not found for role '{role}'.")

    access_token = create_access_token({"id": user["id"], "email": user["email"], "role": user["role"], "name": user["name"]})
    refresh_token = create_refresh_token(user["id"])
    _set_refresh_cookie(response, refresh_token)

    return {
        "message": "Demo login successful.",
        "user": _build_user_payload(user),
        "accessToken": access_token,
    }


# ─── OTP-based password reset ─────────────────────────────────────────────────

import requests as http_requests

def _send_otp_email(to_email: str, otp_code: str) -> tuple[bool, Optional[str]]:
    resend_api_key = (os.getenv("RESEND_API_KEY") or "").strip()
    if not resend_api_key:
        msg = "Email service not configured (RESEND_API_KEY is missing)."
        print(f"[Resend Notice] {msg}")
        return False, msg
    try:
        from_email = (os.getenv("RESEND_FROM_EMAIL") or "").strip() or "UCEK Placement Portal <onboarding@resend.dev>"
        payload = {
            "from": from_email,
            "to": [to_email],
            "subject": f"🔑 {otp_code} is your Password Verification Code",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #27272a; border-radius: 16px; background-color: #0c0c10; color: #ffffff;">
              <h2 style="color: #f97316; margin-bottom: 4px; font-size: 20px;">UCEK Placement Portal</h2>
              <p style="color: #a1a1aa; font-size: 13px; margin-top: 0;">Password Reset Request</p>
              <hr style="border: 0; border-top: 1px solid #27272a; margin: 16px 0;" />
              <p style="font-size: 14px; color: #e4e4e7;">Use the following 6-digit verification code to reset your password:</p>
              <div style="background-color: #18181c; padding: 16px; border-radius: 12px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #ffffff; border: 1px solid #3f3f46; margin: 20px 0; font-family: monospace;">
                {otp_code}
              </div>
              <p style="font-size: 12px; color: #71717a; line-height: 1.5;">This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
            </div>
            """
        }
        headers = {
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
        resp = http_requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
        if resp.status_code in (200, 201):
            print(f"[Resend] OTP email dispatched to {to_email}")
            return True, None

        error_detail = None
        try:
            body = resp.json()
            error_detail = body.get("message")
        except Exception:
            pass

        print(f"[Resend HTTP {resp.status_code}]: {resp.text}")
        return False, error_detail or f"Email provider rejected request (HTTP {resp.status_code})."
    except Exception as e:
        print(f"[Resend Error] {to_email}:", e)
        return False, f"Failed to connect to email provider: {str(e)}"


# ─── Forgot Password / Admin-Assisted Reset Request ──────────────────────────

GENERIC_RESET_HELP_MESSAGE = "Your request has been sent to the Placement Administrator. Please wait for an administrator to assist you."

@router.post("/forgot-password/request")
@router.post("/send-otp")
@limiter.limit("5/minute")
def request_password_reset_help(request: Request, req: ForgotPasswordHelpRequest):
    """
    Student submits email to request admin-assisted password recovery.
    - Server looks up the account.
    - If user doesn't exist, is not student, or is inactive: returns generic response (no email enumeration).
    - If already pending: returns message indicating request is already pending.
    - If valid: creates pending record in password_reset_requests.
    """
    email = req.email.strip().lower()
    user = db.get_user_by_email(email)

    # Generic response for non-existent, inactive, or non-student accounts (no user enumeration)
    if not user or user.get("role") != "student" or not user.get("is_active", True):
        return {
            "message": GENERIC_RESET_HELP_MESSAGE,
            "alreadyPending": False,
        }

    student_id = user["id"]
    success, status_code = db.create_password_reset_request(student_id)

    if status_code == "already_pending":
        return {
            "message": "Your password change request is already pending with the Placement Administrator.",
            "alreadyPending": True,
        }

    if not success:
        print(f"[ForgotPassword Error] Server-side database failure persisting request for student_id={student_id}")
        return {
            "message": GENERIC_RESET_HELP_MESSAGE,
            "alreadyPending": False,
        }

    return {
        "message": GENERIC_RESET_HELP_MESSAGE,
        "alreadyPending": False,
    }


# ─── Student Forced Password Change ──────────────────────────────────────────

@router.post("/forced-change-password")
@limiter.limit("10/minute")
def forced_change_password(
    request: Request,
    req: ForcedChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Authenticated student forced password change (after logging in with admin temporary password).
    - Reuses existing password validation rules (min 6 chars, match confirmation).
    - Hashes with existing bcrypt hash_password.
    - Updates users.password_hash and sets must_change_password = False.
    - Updates password_changed_at timestamp.
    """
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can perform this password reset.")

    # Validate new password
    new_pw = (req.newPassword or "").strip()
    confirm_pw = (req.confirmPassword or "").strip()

    if not new_pw:
        raise HTTPException(status_code=400, detail="New password is required.")
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")
    if new_pw != confirm_pw:
        raise HTTPException(status_code=400, detail="New passwords do not match.")

    # Disallow reusing the same password
    stored_hash = current_user.get("password_hash")
    if stored_hash and verify_password(new_pw, stored_hash):
        raise HTTPException(status_code=400, detail="New password must be different from current password.")

    # Update in database
    new_hash = hash_password(new_pw)
    success = db.update_user_password(current_user["id"], new_hash, must_change_password=False)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update password. Please try again.")

    return {
        "message": "Password changed successfully. You can now access your dashboard.",
        "must_change_password": False,
    }
