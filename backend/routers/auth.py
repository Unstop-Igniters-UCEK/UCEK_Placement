import uuid
import os
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Response, Depends, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from backend.database import db, hash_password, verify_password, supabase_client
from backend.auth import create_access_token, create_refresh_token, decode_token, get_current_user, ALLOWED_EMAIL_DOMAIN
from backend.schemas import (
    RegisterRequest, LoginRequest, ForgotPasswordRequest,
    ResetPasswordRequest, DemoLoginRequest, SendOTPRequest, VerifyOTPResetRequest
)
from backend.mock_data import DEFAULT_ROADMAPS

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

@router.post("/register")
@router.post("/signup")
@limiter.limit("5/minute")
def register(request: Request, req: RegisterRequest, response: Response):
    email = req.email.strip().lower()
    
    # Optional domain enforcement if enabled
    if ALLOWED_EMAIL_DOMAIN and not email.endswith(f"@{ALLOWED_EMAIL_DOMAIN}"):
        if os.getenv("STRICT_EMAIL_DOMAIN", "false") == "true":
            raise HTTPException(
                status_code=400,
                detail=f"Registration restricted to official college email (@{ALLOWED_EMAIL_DOMAIN})"
            )

    existing = next((u for u in db.users if u.get("email", "").strip().lower() == email), None)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists with this email")

    # Enforce Admin Passcode Security check
    if req.role and req.role.lower() == "admin":
        expected_code = os.getenv("ADMIN_SECRET_KEY", "UCEK_ADMIN_FACULTY_2026").strip()
        provided_code = (req.adminSecurityCode or "").strip()
        if provided_code != expected_code:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid Admin Security Passcode. Admin registration is restricted to authorized college faculty."
            )

    user_id = f"u_{uuid.uuid4().hex[:8]}"
    pw_hash = hash_password(req.password)
    now_str = datetime.now().isoformat()

    new_user = {
        "id": user_id,
        "name": req.name.strip(),
        "email": email,
        "passwordHash": pw_hash,
        "password_hash": pw_hash,
        "role": req.role or "mentee",
        "year": req.year or "3rd Year",
        "branch": req.branch or "Computer Science & Engg",
        "domainInterest": req.domainInterest or "Software Engineering",
        "isVerified": True,
        "readinessScore": 50,
        "createdAt": now_str
    }

    db.users.append(new_user)

    # Direct Supabase Relational User Table Insert
    from backend.database import supabase_client
    if supabase_client:
        try:
            supabase_client.table("users").upsert({
                "id": new_user["id"],
                "name": new_user["name"],
                "email": new_user["email"],
                "password_hash": new_user["passwordHash"],
                "role": new_user["role"],
                "year": new_user["year"],
                "branch": new_user["branch"],
                "domain_interest": new_user["domainInterest"],
                "is_verified": True,
                "readiness_score": 50,
                "created_at": now_str
            }).execute()
            print(f"[Supabase] Registered user {new_user['email']} directly to Supabase users table!")
        except Exception as e:
            print("[Supabase Direct User Register Error]:", e)

    # Initialize domain roadmap if student/mentee
    domain = new_user["domainInterest"]
    modules = DEFAULT_ROADMAPS.get(domain, DEFAULT_ROADMAPS["Software Engineering"])
    db.userRoadmaps.append({
        "id": f"map_{user_id}",
        "userId": user_id,
        "domain": domain,
        "overallProgress": 0,
        "modules": modules,
        "lastUpdated": now_str
    })

    db.save()

    user_payload = {
        "id": new_user["id"],
        "name": new_user["name"],
        "email": new_user["email"],
        "role": new_user["role"],
        "year": new_user["year"],
        "branch": new_user["branch"],
        "domainInterest": new_user["domainInterest"],
        "hasSelectedDomain": new_user.get("hasSelectedDomain", False),
        "isVerified": new_user["isVerified"],
        "readinessScore": new_user["readinessScore"]
    }

    access_token = create_access_token({"id": new_user["id"], "email": new_user["email"], "role": new_user["role"], "name": new_user["name"]})
    refresh_token = create_refresh_token(new_user["id"])

    response.set_cookie(
        key="ucek_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 3600
    )

    return {
        "message": "User registered successfully",
        "user": user_payload,
        "accessToken": access_token
    }

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, req: LoginRequest, response: Response):
    email = req.email.strip().lower()
    user = next((u for u in db.users if u["email"].lower() == email), None)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Enforce strict role isolation between Admin and Student sign-in tabs
    if req.role:
        expected_role = req.role.strip().lower()
        actual_role = user.get("role", "mentee").strip().lower()

        if expected_role in ("student", "mentee") and actual_role == "admin":
            raise HTTPException(
                status_code=403,
                detail="This is an Admin account. Please switch to the Admin tab to sign in."
            )
        elif expected_role == "admin" and actual_role != "admin":
            raise HTTPException(
                status_code=403,
                detail="This is a Student account. Please switch to the Student tab to sign in."
            )

    user_payload = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "year": user["year"],
        "branch": user["branch"],
        "domainInterest": user["domainInterest"],
        "hasSelectedDomain": user.get("hasSelectedDomain", False),
        "isVerified": user.get("isVerified", True),
        "readinessScore": user.get("readinessScore", 60),
        "bio": user.get("bio"),
        "linkedInUrl": user.get("linkedInUrl"),
        "githubUrl": user.get("githubUrl")
    }

    access_token = create_access_token({"id": user["id"], "email": user["email"], "role": user["role"], "name": user["name"]})
    refresh_token = create_refresh_token(user["id"])

    response.set_cookie(
        key="ucek_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 3600
    )

    return {
        "message": "Login successful",
        "user": user_payload,
        "accessToken": access_token
    }

@router.post("/demo-login")
def demo_login(req: DemoLoginRequest, response: Response):
    role = req.role.lower()
    user = None
    if role == "admin":
        user = next((u for u in db.users if u["id"] == "u_admin"), None)
    elif role == "mentor":
        user = next((u for u in db.users if u["id"] == "u_mentor"), None)
    else:
        user = next((u for u in db.users if u["id"] == "u_student"), None)

    if not user:
        user = db.users[0] if len(db.users) > 0 else None

    if not user:
        raise HTTPException(status_code=404, detail="Demo account not found")

    user_payload = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "year": user["year"],
        "branch": user["branch"],
        "domainInterest": user["domainInterest"],
        "hasSelectedDomain": user.get("hasSelectedDomain", False),
        "isVerified": user.get("isVerified", True),
        "readinessScore": user.get("readinessScore", 75),
        "bio": user.get("bio"),
        "linkedInUrl": user.get("linkedInUrl"),
        "githubUrl": user.get("githubUrl")
    }

    access_token = create_access_token({"id": user["id"], "email": user["email"], "role": user["role"], "name": user["name"]})
    refresh_token = create_refresh_token(user["id"])

    response.set_cookie(
        key="ucek_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 3600
    )

    return {
        "message": "Demo login successful",
        "user": user_payload,
        "accessToken": access_token
    }

@router.post("/refresh")
def refresh_token_endpoint(response: Response, cookie_val: str = None):
    # Retrieve refresh token from cookie or header
    if not cookie_val:
        raise HTTPException(status_code=401, detail="Refresh token required")

    payload = decode_token(cookie_val)
    if payload.get("tokenType") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("id")
    user = next((u for u in db.users if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"id": user["id"], "email": user["email"], "role": user["role"], "name": user["name"]})
    return {"accessToken": access_token}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="ucek_refresh_token")
    return {"message": "Logged out successfully"}

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    user_payload = {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "year": current_user["year"],
        "branch": current_user["branch"],
        "domainInterest": current_user["domainInterest"],
        "hasSelectedDomain": current_user.get("hasSelectedDomain", False),
        "isVerified": current_user.get("isVerified", True),
        "readinessScore": current_user.get("readinessScore", 75),
        "bio": current_user.get("bio"),
        "linkedInUrl": current_user.get("linkedInUrl"),
        "githubUrl": current_user.get("githubUrl")
    }
    return {"user": user_payload}

import requests

def send_resend_email(to_email: str, otp_code: str) -> bool:
    resend_api_key = (os.getenv("RESEND_API_KEY") or "").strip()
    if not resend_api_key:
        print("[Resend Notice] RESEND_API_KEY is not configured or empty in backend/.env")
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
        if resp.status_code in (200, 201):
            print(f"[Resend Success] Password reset OTP email dispatched to {to_email}")
            return True
        else:
            print(f"[Resend HTTP Error {resp.status_code}]: {resp.text}")
            return False
    except Exception as e:
        print(f"[Resend Error] Failed to send email to {to_email}:", e)
        return False
    return False

@router.post("/send-otp")
@limiter.limit("3/minute")
def send_otp(request: Request, req: SendOTPRequest):
    email = req.email.strip().lower()
    user = next((u for u in db.users if u.get("email", "").strip().lower() == email), None)
    if not user:
        return {
            "message": f"If an account exists for {email}, a verification code has been dispatched.",
            "otpSent": True
        }

    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now().timestamp() + 600

    db.otp_store[email] = {
        "code": otp_code,
        "expiresAt": expires_at,
        "attempts": 0
    }
    
    print(f"\n==========================================")
    print(f"[OTP FORGOT PASSWORD] Generated OTP for {email}: {otp_code}")
    print(f"==========================================\n")

    email_sent = send_resend_email(email, otp_code)
    return {
        "message": f"6-digit verification code dispatched to {email}. Please check your inbox.",
        "otpSent": True
    }

@router.post("/verify-otp-reset")
@limiter.limit("5/minute")
def verify_otp_reset(request: Request, req: VerifyOTPResetRequest):
    email = req.email.strip().lower()
    user = next((u for u in db.users if u.get("email", "").strip().lower() == email), None)
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    otp_entry = db.otp_store.get(email)
    if not otp_entry:
        raise HTTPException(status_code=400, detail="No OTP code requested or OTP has expired.")

    if datetime.now().timestamp() > otp_entry["expiresAt"]:
        del db.otp_store[email]
        raise HTTPException(status_code=400, detail="OTP code has expired. Please request a new code.")

    if otp_entry["code"] != req.otpCode.strip():
        otp_entry["attempts"] += 1
        if otp_entry["attempts"] >= 5:
            del db.otp_store[email]
            raise HTTPException(status_code=400, detail="Too many invalid attempts. OTP code invalidated.")
        raise HTTPException(status_code=400, detail="Invalid 6-digit OTP code. Please check and try again.")

    new_pw_hash = hash_password(req.newPassword)
    db.update_user_password(email, new_pw_hash)

    del db.otp_store[email]

    return {"message": "Password reset successful! You can now sign in with your new password."}
