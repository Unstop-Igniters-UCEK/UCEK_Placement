from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from backend.database import db, get_user_readiness_metrics, calculate_user_readiness
from backend.auth import get_current_user
from backend.schemas import ProfileUpdateRequest

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/readiness")
def get_readiness(current_user: dict = Depends(get_current_user)):
    metrics = get_user_readiness_metrics(current_user["id"])
    return {"readiness": metrics}

@router.get("/dashboard")
def get_dashboard(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # User roadmap directly queried from Supabase user_roadmaps table
    roadmap = None
    if current_user.get("hasSelectedDomain") and current_user.get("domainInterest"):
        roadmap = db.get_user_roadmap(user_id)

    # Recent test scores directly queried from Supabase test_scores table
    user_scores = db.get_user_test_scores(user_id)

    # Genuine readiness metrics calculated strictly from real Supabase DB data
    readiness_metrics = get_user_readiness_metrics(user_id)

    # Mentors queried directly from Supabase users table where role == 'mentor'
    mentors = db.get_all_mentors()

    user_payload = {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "year": current_user["year"],
        "branch": current_user["branch"],
        "domainInterest": current_user.get("domainInterest") if current_user.get("hasSelectedDomain") else None,
        "hasSelectedDomain": current_user.get("hasSelectedDomain", False),
        "isVerified": current_user.get("isVerified", True),
        "readinessScore": readiness_metrics["score"],
        "readiness": readiness_metrics,
        "bio": current_user.get("bio"),
        "linkedInUrl": current_user.get("linkedInUrl"),
        "githubUrl": current_user.get("githubUrl"),
        "targetDrive": current_user.get("targetDrive")
    }

    return {
        "user": user_payload,
        "readiness": readiness_metrics,
        "roadmap": roadmap,
        "recentScores": user_scores,
        "recommendedMentors": mentors
    }

@router.put("/profile")
def update_profile(req: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    user = db.get_user_by_id(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.name is not None: user["name"] = req.name.strip()
    if req.year is not None: user["year"] = req.year
    if req.branch is not None: user["branch"] = req.branch
    if req.hasSelectedDomain is not None: user["hasSelectedDomain"] = req.hasSelectedDomain
    if req.bio is not None: user["bio"] = req.bio
    if req.linkedInUrl is not None: user["linkedInUrl"] = req.linkedInUrl
    if req.githubUrl is not None: user["githubUrl"] = req.githubUrl

    if req.domainInterest is not None:
        user["domainInterest"] = req.domainInterest
        user["hasSelectedDomain"] = True

    if req.targetDrive is not None:
        user["targetDrive"] = req.targetDrive.strip()

    db.save_user(user)

    updated_payload = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "year": user["year"],
        "branch": user["branch"],
        "domainInterest": user["domainInterest"] if user.get("hasSelectedDomain") else None,
        "hasSelectedDomain": user.get("hasSelectedDomain", False),
        "isVerified": user.get("isVerified", True),
        "readinessScore": calculate_user_readiness(user["id"]),
        "bio": user.get("bio"),
        "linkedInUrl": user.get("linkedInUrl"),
        "githubUrl": user.get("githubUrl"),
        "targetDrive": user.get("targetDrive")
    }

    return {"message": "Profile updated successfully", "user": updated_payload}

