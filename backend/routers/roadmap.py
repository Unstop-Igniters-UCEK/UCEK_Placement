from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from backend.database import db
from backend.auth import get_current_user
from backend.schemas import ToggleMilestoneRequest
from backend.mock_data import DEFAULT_ROADMAPS

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])

@router.get("")
def get_roadmap(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    roadmap = next((r for r in db.userRoadmaps if r["userId"] == user_id), None)
    if not roadmap:
        domain = current_user.get("domainInterest", "Software Engineering")
        roadmap = {
            "id": f"map_{user_id}",
            "userId": user_id,
            "domain": domain,
            "overallProgress": 0,
            "modules": DEFAULT_ROADMAPS.get(domain, DEFAULT_ROADMAPS["Software Engineering"]),
            "lastUpdated": datetime.now().isoformat()
        }
        db.userRoadmaps.append(roadmap)
        db.save()

    return {"roadmap": roadmap}

@router.post("/toggle")
def toggle_milestone(req: ToggleMilestoneRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    roadmap = next((r for r in db.userRoadmaps if r["userId"] == user_id), None)
    if not roadmap:
        domain = current_user.get("domainInterest", "Software Engineering")
        roadmap = {
            "id": f"map_{user_id}",
            "userId": user_id,
            "domain": domain,
            "overallProgress": 0,
            "modules": DEFAULT_ROADMAPS.get(domain, DEFAULT_ROADMAPS["Software Engineering"]),
            "lastUpdated": datetime.now().isoformat()
        }
        db.userRoadmaps.append(roadmap)

    total_milestones = 0
    completed_milestones = 0

    for module in roadmap["modules"]:
        if module["id"] == req.moduleId:
            for ms in module["milestones"]:
                if ms["id"] == req.milestoneId:
                    ms["completed"] = req.completed

        for ms in module["milestones"]:
            total_milestones += 1
            if ms.get("completed"):
                completed_milestones += 1

    progress = round((completed_milestones / total_milestones) * 100) if total_milestones > 0 else 0
    roadmap["overallProgress"] = progress
    roadmap["lastUpdated"] = datetime.now().isoformat()

    db.save()

    return {"message": "Milestone toggled", "roadmap": roadmap}
