import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from backend.database import db
from backend.auth import get_current_user
from backend.schemas import RequestMentorRequest, AddCheckInLogRequest

router = APIRouter(tags=["mentorship"])

@router.get("/api/mentors")
def get_mentors():
    mentors = [
        {
            "id": u["id"],
            "name": u["name"],
            "email": u["email"],
            "role": u["role"],
            "year": u["year"],
            "branch": u["branch"],
            "domainInterest": u["domainInterest"],
            "bio": u.get("bio", "Experienced senior mentor at UCEK ready to help with Placement prep."),
            "linkedInUrl": u.get("linkedInUrl"),
            "githubUrl": u.get("githubUrl"),
            "readinessScore": u.get("readinessScore", 85)
        }
        for u in db.users if u["role"] == "mentor" or u["id"] == "u_mentor"
    ]
    return {"mentors": mentors}

@router.get("/api/mentorship/my")
@router.get("/api/mentorship/my-pair")
def get_my_mentorship(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    pair = next(
        (m for m in db.mentorships if m["mentee"]["id"] == user_id or m["mentor"]["id"] == user_id),
        None
    )
    return {"mentorship": pair}

@router.post("/api/mentors/request")
@router.post("/api/mentorship/request")
def request_mentor(req: RequestMentorRequest, current_user: dict = Depends(get_current_user)):
    mentor = next((u for u in db.users if u["id"] == req.mentorId), None)
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")

    existing = next(
        (m for m in db.mentorships if m["mentee"]["id"] == current_user["id"] and m["status"] == "active"),
        None
    )

    if existing:
        return {"message": "Active mentorship pair already exists", "pair": existing}

    new_pair = {
        "id": f"m_pair_{uuid.uuid4().hex[:8]}",
        "mentor": {
            "id": mentor["id"],
            "name": mentor["name"],
            "email": mentor["email"],
            "role": mentor["role"],
            "year": mentor.get("year"),
            "branch": mentor.get("branch"),
            "domainInterest": mentor.get("domainInterest"),
            "bio": mentor.get("bio")
        },
        "mentee": {
            "id": current_user["id"],
            "name": current_user["name"],
            "email": current_user["email"],
            "role": current_user["role"],
            "year": current_user.get("year"),
            "branch": current_user.get("branch"),
            "domainInterest": current_user.get("domainInterest")
        },
        "domain": req.domain or current_user.get("domainInterest", "Software Engineering"),
        "status": "active",
        "checkInLogs": [],
        "createdAt": datetime.now().isoformat()
    }

    db.mentorships.append(new_pair)
    db.save()

    return {"message": "Mentorship request sent successfully", "pair": new_pair}

@router.post("/api/mentorship/checkin")
@router.post("/api/mentorship/log")
def add_checkin_log(req: AddCheckInLogRequest, current_user: dict = Depends(get_current_user)):
    pair = next((m for m in db.mentorships if m["id"] == req.pairId), None)
    if not pair:
        raise HTTPException(status_code=404, detail="Mentorship pair not found")

    new_log = {
        "id": f"log_{uuid.uuid4().hex[:8]}",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "topic": req.topic,
        "mentorNotes": req.mentorNotes,
        "actionItems": req.actionItems
    }

    if "checkInLogs" not in pair or not isinstance(pair["checkInLogs"], list):
        pair["checkInLogs"] = []

    pair["checkInLogs"].append(new_log)
    db.save()

    return {"message": "Check-in log added successfully", "mentorship": pair, "newLog": new_log}
