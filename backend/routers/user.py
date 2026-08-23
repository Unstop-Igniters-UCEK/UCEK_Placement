from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from backend.database import db
from backend.auth import get_current_user
from backend.schemas import ProfileUpdateRequest
from backend.mock_data import DEFAULT_ROADMAPS

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/dashboard")
def get_dashboard(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # User roadmap
    roadmap = next((r for r in db.userRoadmaps if r["userId"] == user_id), None)
    if not roadmap:
        domain = current_user.get("domainInterest", "Software Engineering")
        roadmap = {
            "id": f"map_{user_id}",
            "userId": user_id,
            "domain": domain,
            "overallProgress": 0,
            "modules": DEFAULT_ROADMAPS.get(domain, DEFAULT_ROADMAPS["Software Engineering"]),
            "lastUpdated": ""
        }
        db.userRoadmaps.append(roadmap)
        db.save()

    # Recent test scores
    user_scores = [s for s in db.testScores if s["userId"] == user_id]

    # Recommended mentors matching domain
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
        for u in db.users if u["role"] == "mentor"
    ]

    return {
        "user": current_user,
        "roadmap": roadmap,
        "recentScores": user_scores,
        "recommendedMentors": mentors
    }

@router.put("/profile")
def update_profile(req: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    user = next((u for u in db.users if u["id"] == current_user["id"]), None)
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
        user_map = next((r for r in db.userRoadmaps if r["userId"] == user["id"]), None)
        if user_map:
            user_map["domain"] = req.domainInterest
            user_map["modules"] = DEFAULT_ROADMAPS.get(req.domainInterest, DEFAULT_ROADMAPS["Software Engineering"])
            user_map["overallProgress"] = 0
            user_map["lastUpdated"] = datetime.now().isoformat()
        else:
            db.userRoadmaps.append({
                "id": f"map_{user['id']}",
                "userId": user["id"],
                "domain": req.domainInterest,
                "overallProgress": 0,
                "modules": DEFAULT_ROADMAPS.get(req.domainInterest, DEFAULT_ROADMAPS["Software Engineering"]),
                "lastUpdated": datetime.now().isoformat()
            })

    if req.targetDrive is not None:
        user["targetDrive"] = req.targetDrive.strip()

    db.save()

    updated_payload = {
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
        "githubUrl": user.get("githubUrl"),
        "targetDrive": user.get("targetDrive")
    }

    return {"message": "Profile updated successfully", "user": updated_payload}
