"""
backend/services/ai_usage_service.py

Minimal Monthly AI Usage Limit Service for Impulse UCEK Placement Suite.
Enforces fixed monthly allowances for:
- Resume Reviewer: 2 successful saved AI reviews / calendar month
- JD Matcher: 2 successful saved AI matches / calendar month
- HR Interview: 4 successfully completed and saved practice sessions / calendar month

Source of Truth: Supabase (PostgreSQL)
- Reuses reliable existing records:
  - hr_interview_attempts for HR Interview
  - resume_reviews for Resume Reviewer baseline
- Tracks ephemeral/upsert usages via public.ai_usage_logs
- Thread-safe serialization per student & feature to prevent concurrent limit bypasses
- Only successful, saved AI operations consume usage.
"""

import logging
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple

from fastapi import HTTPException
from backend.database import supabase_client

logger = logging.getLogger("ai_usage_service")

# Fixed monthly allowances configured for students
FEATURE_LIMITS: Dict[str, int] = {
    "resume_reviewer": 2,
    "jd_matcher": 2,
    "hr_interview": 4,
}

FEATURE_LABELS: Dict[str, str] = {
    "resume_reviewer": "Resume Reviews",
    "jd_matcher": "JD Matches",
    "hr_interview": "HR Practices",
}

# Per-student, per-feature serialization locks to prevent concurrent race conditions
_locks_mutex = threading.Lock()
_feature_locks: Dict[Tuple[str, str], threading.Lock] = {}


def get_feature_lock(student_id: str, feature: str) -> threading.Lock:
    """Return or create a thread-safe lock for (student_id, feature)."""
    key = (str(student_id).strip(), feature.strip())
    with _locks_mutex:
        if key not in _feature_locks:
            _feature_locks[key] = threading.Lock()
        return _feature_locks[key]


def get_current_month_bounds(now_dt: Optional[datetime] = None) -> Tuple[datetime, datetime, str]:
    """
    Returns (start_of_month_utc, start_of_next_month_utc, reset_date_formatted_str).
    Standardizes on UTC boundaries across all environments.
    """
    now = now_dt or datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=timezone.utc)
    
    if now.month == 12:
        start_of_next_month = datetime(now.year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    else:
        start_of_next_month = datetime(now.year, now.month + 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    reset_date_str = start_of_next_month.strftime("%B 1, %Y")
    return start_of_month, start_of_next_month, reset_date_str


def get_student_feature_usage(student_id: str, feature: str) -> Dict[str, Any]:
    """
    Compute actual reliable usage count for student_id and feature in the current calendar month.
    """
    uid = str(student_id).strip()
    limit = FEATURE_LIMITS.get(feature, 2)
    label = FEATURE_LABELS.get(feature, feature)
    start_of_month, start_of_next_month, reset_date_str = get_current_month_bounds()
    start_iso = start_of_month.isoformat()
    next_iso = start_of_next_month.isoformat()

    used = 0

    if not supabase_client or not uid:
        return {
            "feature": feature,
            "label": label,
            "used": 0,
            "limit": limit,
            "remaining": limit,
            "reset_date": reset_date_str,
            "reset_date_iso": next_iso,
        }

    try:
        if feature == "hr_interview":
            # HR Interview: Count reliable existing rows in hr_interview_attempts
            res = (
                supabase_client.table("hr_interview_attempts")
                .select("id, completed_at, created_at")
                .eq("student_id", uid)
                .gte("completed_at", start_iso)
                .lt("completed_at", next_iso)
                .execute()
            )
            used = len(res.data) if res.data else 0

        elif feature == "resume_reviewer":
            # Resume Reviewer:
            # 1. Query ai_usage_logs for this month
            tracking_records = []
            try:
                res_logs = (
                    supabase_client.table("ai_usage_logs")
                    .select("id, created_at")
                    .eq("student_id", uid)
                    .eq("feature", "resume_reviewer")
                    .gte("created_at", start_iso)
                    .lt("created_at", next_iso)
                    .order("created_at", desc=False)
                    .execute()
                )
                tracking_records = res_logs.data or []
            except Exception as log_err:
                logger.warning(f"[ai_usage_service] ai_usage_logs query fallback: {log_err}")
                tracking_records = []

            # 2. Query resume_reviews baseline (upserted single row per student)
            rr_res = (
                supabase_client.table("resume_reviews")
                .select("id, reviewed_at")
                .eq("student_id", uid)
                .execute()
            )
            has_prior_unlogged_review = False
            if rr_res.data:
                latest_review = rr_res.data[0]
                reviewed_at_str = latest_review.get("reviewed_at")
                if reviewed_at_str:
                    try:
                        reviewed_at_dt = datetime.fromisoformat(reviewed_at_str.replace("Z", "+00:00"))
                        if reviewed_at_dt.tzinfo is None:
                            reviewed_at_dt = reviewed_at_dt.replace(tzinfo=timezone.utc)
                        if start_of_month <= reviewed_at_dt < start_of_next_month:
                            if not tracking_records:
                                has_prior_unlogged_review = True
                            else:
                                earliest_track_str = tracking_records[0].get("created_at")
                                earliest_track_dt = datetime.fromisoformat(earliest_track_str.replace("Z", "+00:00"))
                                if earliest_track_dt.tzinfo is None:
                                    earliest_track_dt = earliest_track_dt.replace(tzinfo=timezone.utc)
                                if reviewed_at_dt < earliest_track_dt:
                                    has_prior_unlogged_review = True
                    except Exception as parse_err:
                        logger.warning(f"[ai_usage_service] error parsing reviewed_at: {parse_err}")

            used = len(tracking_records) + (1 if has_prior_unlogged_review else 0)

        elif feature == "jd_matcher":
            # JD Matcher: Read from ai_usage_logs for this month
            try:
                res_logs = (
                    supabase_client.table("ai_usage_logs")
                    .select("id, created_at")
                    .eq("student_id", uid)
                    .eq("feature", "jd_matcher")
                    .gte("created_at", start_iso)
                    .lt("created_at", next_iso)
                    .execute()
                )
                used = len(res_logs.data) if res_logs.data else 0
            except Exception as log_err:
                logger.warning(f"[ai_usage_service] ai_usage_logs query for jd_matcher: {log_err}")
                used = 0

    except Exception as e:
        logger.error(f"[ai_usage_service] Error computing usage for student {uid}, feature {feature}: {e}")

    remaining = max(0, limit - used)
    return {
        "feature": feature,
        "label": label,
        "used": used,
        "limit": limit,
        "remaining": remaining,
        "reset_date": reset_date_str,
        "reset_date_iso": next_iso,
    }


def get_all_student_usage(student_id: str) -> Dict[str, Any]:
    """Return consolidated usage status across all 3 AI features for a student."""
    now = datetime.now(timezone.utc)
    _, start_of_next_month, reset_date_str = get_current_month_bounds(now)
    features_usage = {}
    for feat in ["resume_reviewer", "jd_matcher", "hr_interview"]:
        features_usage[feat] = get_student_feature_usage(student_id, feat)

    return {
        "month": now.strftime("%B %Y"),
        "reset_date": reset_date_str,
        "reset_date_iso": start_of_next_month.isoformat(),
        "features": features_usage,
    }


def record_successful_usage(student_id: str, feature: str, reference_id: Optional[str] = None) -> bool:
    """
    Persist one successful usage event in public.ai_usage_logs.
    Only called AFTER the external AI call succeeds and its result is saved.
    """
    if not supabase_client:
        return False
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        payload: Dict[str, Any] = {
            "student_id": str(student_id),
            "feature": str(feature),
            "created_at": now_iso,
        }
        if reference_id:
            payload["reference_id"] = str(reference_id)
        supabase_client.table("ai_usage_logs").insert(payload).execute()
        return True
    except Exception as e:
        logger.error(f"[ai_usage_service] Failed to record usage log for student {student_id}, feature {feature}: {e}")
        return False


@contextmanager
def enforce_ai_usage_limit(student_id: str, feature: str):
    """
    Context manager guaranteeing atomic/serialized limit checking.
    Prevents concurrent requests from the same student from bypassing the monthly limit.
    Only successful operations whose results are saved consume usage.
    """
    lock = get_feature_lock(student_id, feature)
    with lock:
        usage = get_student_feature_usage(student_id, feature)
        if usage["used"] >= usage["limit"]:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "monthly_limit_exceeded",
                    "message": f"Monthly limit of {usage['limit']} {usage['label']} reached. Your allowance will reset on {usage['reset_date']}.",
                    "feature": feature,
                    "used": usage["used"],
                    "limit": usage["limit"],
                    "reset_date": usage["reset_date"],
                }
            )
        yield usage
