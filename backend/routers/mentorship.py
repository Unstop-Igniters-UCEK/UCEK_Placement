"""
routers/mentorship.py — Mentorship endpoints stub.

Per Impulse_DB_Design.md:
  "Mentor functionality is deferred and is not included in this schema."

The mentorship page remains in the UI but all API endpoints return graceful
empty/unavailable states rather than touching any database table.
"""

from fastapi import APIRouter, Depends
from backend.auth import get_current_user

router = APIRouter(tags=["mentorship"])


@router.get("/api/mentors")
def get_mentors():
    """Mentorship is deferred. Returns an empty list."""
    return {"mentors": [], "message": "Mentorship feature coming soon."}


@router.get("/api/mentorship/my")
@router.get("/api/mentorship/my-pair")
def get_my_mentorship(current_user: dict = Depends(get_current_user)):
    """Mentorship is deferred. Returns null pair."""
    return {"mentorship": None, "message": "Mentorship feature coming soon."}


@router.post("/api/mentors/request")
@router.post("/api/mentorship/request")
def request_mentor(current_user: dict = Depends(get_current_user)):
    """Mentorship requests are deferred."""
    return {"message": "Mentorship feature coming soon."}


@router.post("/api/mentorship/checkin")
@router.post("/api/mentorship/log")
def add_checkin_log(current_user: dict = Depends(get_current_user)):
    """Mentorship check-in logs are deferred."""
    return {"message": "Mentorship feature coming soon."}
