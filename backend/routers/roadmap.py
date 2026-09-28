"""
routers/roadmap.py — Domain roadmap endpoints for Impulse UCEK Placement Suite.
Aligned with Impulse_DB_Design.md §9–§10.

The roadmap is structured as a flat list of roadmap_items with parent_id.
Student progress is stored in student_roadmap_progress.
"""

from fastapi import APIRouter, Depends, HTTPException
from backend.database import db, supabase_client
from backend.auth import get_current_user
from backend.schemas import ToggleRoadmapItemRequest

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


@router.get("")
def get_roadmap(current_user: dict = Depends(get_current_user)):
    """
    Return the roadmap items for the student's current domain together with
    their progress. Returns null roadmap if the student has no domain selected.
    """
    if current_user.get("role") != "student":
        return {"roadmap": None, "progress": []}

    domain_id = current_user.get("domain_id")
    if not domain_id:
        return {"roadmap": None, "progress": [], "message": "No domain selected. Please select a domain first."}

    # Fetch roadmap definition for this domain
    items = db.get_roadmap_for_domain(domain_id)
    if not items:
        return {"roadmap": {"domain_id": domain_id, "items": []}, "progress": []}

    # Fetch student progress
    progress_rows = db.get_student_roadmap_progress(current_user["id"])
    completed_ids = {str(p["roadmap_item_id"]) for p in progress_rows if p.get("completed")}

    # Annotate items with completion state
    annotated = []
    for item in items:
        annotated.append({
            "id": str(item["id"]),
            "parent_id": str(item["parent_id"]) if item.get("parent_id") else None,
            "title": item.get("title", ""),
            "description": item.get("description"),
            "item_type": item.get("item_type", "objective"),
            "sort_order": item.get("sort_order", 0),
            "completed": str(item["id"]) in completed_ids,
        })

    # Group items into modules (items with parent_id is None or item_type in ('level', 'pathway', 'module'))
    top_items = []
    child_items = []
    for a in annotated:
        if not a.get("parent_id") and a.get("item_type") in ("level", "pathway", "module"):
            top_items.append(a)
        elif not a.get("parent_id"):
            top_items.append(a)
        else:
            child_items.append(a)

    if top_items:
        modules_map = {}
        for t in top_items:
            modules_map[t["id"]] = {
                "id": t["id"],
                "title": t["title"],
                "description": t.get("description"),
                "milestones": []
            }
        for c in child_items:
            pid = c.get("parent_id")
            if pid in modules_map:
                modules_map[pid]["milestones"].append(c)
            else:
                first_k = list(modules_map.keys())[0]
                modules_map[first_k]["milestones"].append(c)
        modules = list(modules_map.values())
    else:
        modules = [{
            "id": f"mod_{domain_id}",
            "title": current_user.get("domain_name") or "Core Curriculum",
            "milestones": annotated
        }] if annotated else []

    total = len(annotated)
    completed_count = sum(1 for a in annotated if a["completed"])
    progress_pct = round((completed_count / total) * 100) if total > 0 else 0

    return {
        "roadmap": {
            "domain_id": domain_id,
            "id": domain_id,
            "name": current_user.get("domain_name") or current_user.get("domain") or "Domain Roadmap",
            "domain_name": current_user.get("domain_name"),
            "items": annotated,
            "modules": modules,
            "total_items": total,
            "completed_items": completed_count,
            "progress_percentage": progress_pct,
        },
        "progress": progress_rows,
    }


@router.post("/toggle")
def toggle_roadmap_item(req: ToggleRoadmapItemRequest, current_user: dict = Depends(get_current_user)):
    """Mark a roadmap item as completed or incomplete for the authenticated student."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can update roadmap progress.")

    target_id = req.milestoneId or req.roadmap_item_id
    if not target_id:
        raise HTTPException(status_code=400, detail="roadmap_item_id or milestoneId required.")

    success = db.upsert_roadmap_progress(
        student_id=current_user["id"],
        roadmap_item_id=target_id,
        completed=req.completed,
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update roadmap progress.")

    return {"message": "Roadmap item updated.", "roadmap_item_id": target_id, "completed": req.completed}
