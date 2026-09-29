"""
auth.py — JWT helpers and FastAPI dependency for authenticated routes.
Token revocation list is kept in-memory (lost on restart; tokens are short-lived).
"""

import os
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load env variables if not already loaded
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv()

from fastapi import Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import logging

logger = logging.getLogger("uvicorn.error")

JWT_SECRET = os.getenv('JWT_SECRET')
if not JWT_SECRET:
    JWT_SECRET = 'ucek_unstop_igniters_placement_platform_secret_2026'
    logger.warning("[SECURITY WARNING] JWT_SECRET environment variable is not set! Using default secret.")

ALGORITHM = 'HS256'
ALLOWED_EMAIL_DOMAIN = os.getenv('ALLOWED_EMAIL_DOMAIN', '')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '60'))

security = HTTPBearer(auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta is not None:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode = {"id": user_id, "tokenType": "refresh", "exp": expire}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    from backend.database import db
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token required.")

    token = credentials.credentials
    if token in db.revokedTokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked.")

    payload = decode_token(token)
    user_id = payload.get("id")
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")
    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    from backend.database import db
    if not credentials or not credentials.credentials:
        return None
    try:
        token = credentials.credentials
        if token in db.revokedTokens:
            return None
        payload = decode_token(token)
        user_id = payload.get("id")
        return db.get_user_by_id(user_id)
    except Exception:
        return None
