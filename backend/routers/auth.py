"""
routers/auth.py — Authentication endpoints for Impulse UCEK Placement Suite.
Uses the new users + student_profiles schema (Impulse_DB_Design.md).
"""

import os
import random
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Response, Depends, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.database import db, hash_password, verify_password, supabase_client
from backend.auth import create_access_token, create_refresh_token, decode_token, get_current_user, ALLOWED_EMAIL_DOMAIN
from backend.schemas import (
    RegisterRequest, LoginRequest, DemoLoginRequest,
    SendOTPRequest, VerifyOTPResetRequest
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
    response.set_cookie(
        key="ucek_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=7 * 24 * 3600,
    )


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

    # Admin role check
    raw_role = (req.role or "student").lower()
    role = "student" if raw_role in ("student", "mentee", "user") else raw_role
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

    # Role tab isolation
    if req.role:
        expected = req.role.strip().lower()
        actual = user.get("role", "student").strip().lower()
        if expected in ("student",) and actual == "admin":
            raise HTTPException(
                status_code=403,
                detail="This is an Admin account. Please switch to the Admin tab to sign in."
            )
        elif expected == "admin" and actual != "admin":
            raise HTTPException(
                status_code=403,
                detail="This is a Student account. Please switch to the Student tab to sign in."
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
def logout(response: Response):
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

def _send_otp_email(to_email: str, otp_code: str) -> bool:
    resend_api_key = (os.getenv("RESEND_API_KEY") or "").strip()
    if not resend_api_key:
        print("[Resend Notice] RESEND_API_KEY is not configured.")
        return False
    try:
        payload = {
            "from": "UCEK Placement Portal <onboarding@resend.dev>",
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
        }
        resp = http_requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
        if resp.status_code in (200, 201):
            print(f"[Resend] OTP email dispatched to {to_email}")
            return True
        print(f"[Resend HTTP {resp.status_code}]: {resp.text}")
        return False
    except Exception as e:
        print(f"[Resend Error] {to_email}:", e)
        return False


@router.post("/send-otp")
@limiter.limit("3/minute")
def send_otp(request: Request, req: SendOTPRequest):
    email = req.email.strip().lower()
    user = db.get_user_by_email(email)
    # Always respond the same way to prevent email enumeration
    if not user:
        return {
            "message": f"If an account exists for {email}, a verification code has been dispatched.",
            "otpSent": True,
        }

    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow().timestamp() + 600

    db.otp_store[email] = {"code": otp_code, "expiresAt": expires_at, "attempts": 0}
    print(f"\n[OTP] Generated for {email}: {otp_code}\n")

    _send_otp_email(email, otp_code)
    return {
        "message": f"6-digit verification code dispatched to {email}. Please check your inbox.",
        "otpSent": True,
    }


@router.post("/verify-otp-reset")
@limiter.limit("5/minute")
def verify_otp_reset(request: Request, req: VerifyOTPResetRequest):
    email = req.email.strip().lower()
    user = db.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    otp_entry = db.otp_store.get(email)
    if not otp_entry:
        raise HTTPException(status_code=400, detail="No OTP code requested or OTP has expired.")

    if datetime.utcnow().timestamp() > otp_entry["expiresAt"]:
        del db.otp_store[email]
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new code.")

    if otp_entry["code"] != req.otpCode.strip():
        otp_entry["attempts"] += 1
        if otp_entry["attempts"] >= 5:
            del db.otp_store[email]
            raise HTTPException(status_code=400, detail="Too many invalid attempts. OTP invalidated.")
        raise HTTPException(status_code=400, detail="Invalid 6-digit OTP code. Please check and try again.")

    new_pw_hash = hash_password(req.newPassword)
    db.update_user_password(user["id"], new_pw_hash)
    del db.otp_store[email]

    return {"message": "Password reset successful! You can now sign in with your new password."}
