"""
database.py — Supabase/PostgreSQL data-access layer for Impulse UCEK Placement Suite.

Targets the NEW database schema as defined in Impulse_DB_Design.md.

Architecture: React Frontend → FastAPI Backend → Supabase/PostgreSQL
PostgreSQL/Supabase is the single source of truth.
"""

import os
import hashlib
import base64
from datetime import datetime
from typing import Dict, Any, List, Optional

# ─── Load environment variables ────────────────────────────────────────────────
for env_path in [
    os.path.join(os.getcwd(), '.env'),
    os.path.join(os.getcwd(), 'backend', '.env'),
]:
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        key = k.strip()
                        val = v.strip().strip('"').strip("'")
                        if val or key not in os.environ:
                            os.environ[key] = val
        except Exception:
            pass

# ─── Supabase client initialisation ───────────────────────────────────────────

try:
    from supabase import create_client, Client
    HAS_SUPABASE_SDK = True
except ImportError:
    HAS_SUPABASE_SDK = False

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

supabase_client: Optional[Any] = None

if HAS_SUPABASE_SDK and SUPABASE_URL and SUPABASE_KEY:
    try:
        import httpx
        from supabase import ClientOptions
        limits = httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=30.0)
        timeout = httpx.Timeout(connect=10.0, read=30.0, write=15.0, pool=15.0)
        http_client = httpx.Client(limits=limits, timeout=timeout)
        options = ClientOptions(httpx_client=http_client, postgrest_client_timeout=30)
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY, options=options)
        print(f"[Supabase] Connected to Supabase DB at {SUPABASE_URL}")
    except Exception as err:
        print("[Supabase] Failed to initialise client:", err)

# ─── Password helpers ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    try:
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')
    except Exception:
        salt = "ucek_salt_2026"
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return base64.b64encode(key).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    if hashed_password.startswith('$2a$') or hashed_password.startswith('$2b$'):
        try:
            import bcrypt
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            pass
    # PBKDF2 fallback
    salt = "ucek_salt_2026"
    key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
    calc_hash = base64.b64encode(key).decode('utf-8')
    return calc_hash == hashed_password


# ─── Database class ────────────────────────────────────────────────────────────

class Database:
    """
    Thin data-access wrapper over Supabase/PostgreSQL.

    Stateful in-memory storage is limited to:
      - revokedTokens  — JWT revocation list (lost on restart; tokens are short-lived)
      - otp_store      — Temporary OTP codes for password reset (in-memory is fine)
    """

    def __init__(self):
        self.revokedTokens: List[str] = []
        self.otp_store: Dict[str, Dict[str, Any]] = {}
        self._seed_default_admin()

    # ── Internal helpers ───────────────────────────────────────────────────────

    def _seed_default_admin(self):
        """Ensure the default admin account exists in the `users` table."""
        import logging
        _logger = logging.getLogger("uvicorn.error")
        admin_pw_env = os.getenv("ADMIN_DEFAULT_PASSWORD", "admin")
        if admin_pw_env == "admin":
            _logger.warning(
                "[SECURITY WARNING] Default admin password is 'admin'. "
                "Set ADMIN_DEFAULT_PASSWORD env var to a strong password."
            )
        admin_email = os.getenv("ADMIN_EMAIL", "unstopignitersucek@gmail.com").strip().lower()
        if not supabase_client:
            return
        try:
            res = supabase_client.table("users").select("id").eq("email", admin_email).execute()
            if not res.data:
                pw_hash = hash_password(admin_pw_env)
                now = datetime.utcnow().isoformat()
                supabase_client.table("users").insert({
                    "name": "Admin UCEK",
                    "email": admin_email,
                    "password_hash": pw_hash,
                    "role": "admin",
                    "is_active": True,
                    "must_change_password": False,
                    "created_at": now,
                    "updated_at": now,
                }).execute()
        except Exception as e:
            print("[Supabase admin seed notice]:", e)

    # ── Users ──────────────────────────────────────────────────────────────────

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Return a fully joined user+profile dict for the given user UUID,
        or None if the user does not exist.
        """
        if not supabase_client or not user_id:
            return None
        try:
            res = supabase_client.table("users").select(
                "id, name, email, password_hash, role, is_active, must_change_password, created_at"
            ).eq("id", str(user_id)).execute()
            if not res.data:
                return None
            return self._join_user_profile(res.data[0])
        except Exception as e:
            print(f"[DB get_user_by_id {user_id}]:", e)
        return None

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Return a fully joined user+profile dict for the given email."""
        if not supabase_client or not email:
            return None
        clean = email.strip().lower()
        try:
            res = supabase_client.table("users").select(
                "id, name, email, password_hash, role, is_active, must_change_password, created_at"
            ).eq("email", clean).execute()
            if not res.data:
                return None
            return self._join_user_profile(res.data[0])
        except Exception as e:
            print(f"[DB get_user_by_email {clean}]:", e)
        return None

    def _join_user_profile(self, user_row: Dict[str, Any]) -> Dict[str, Any]:
        """
        Given a raw `users` row, fetch the matching `student_profiles` row
        (if the user is a student) and return a merged dict used throughout
        the backend.
        """
        uid = str(user_row.get("id", ""))
        role = str(user_row.get("role", "student"))

        profile: Dict[str, Any] = {}
        department_code: Optional[str] = None
        department_name: Optional[str] = None
        department_id: Optional[str] = None
        domain_id: Optional[str] = None
        domain_name: Optional[str] = None
        year: Optional[int] = None
        readiness_score: Optional[float] = None

        if role == "student" and supabase_client:
            try:
                sp_res = supabase_client.table("student_profiles").select(
                    "department_id, year, domain_id, readiness_score, onboarding_source"
                ).eq("user_id", uid).execute()
                if sp_res.data:
                    profile = sp_res.data[0]
                    department_id = profile.get("department_id")
                    domain_id = profile.get("domain_id")
                    year = profile.get("year")
                    readiness_score = profile.get("readiness_score")
            except Exception as e:
                print(f"[DB join_profile student {uid}]:", e)

            # Resolve department code/name
            if department_id and supabase_client:
                try:
                    dept_res = supabase_client.table("departments").select("code, name").eq("id", department_id).execute()
                    if dept_res.data:
                        department_code = dept_res.data[0].get("code")
                        department_name = dept_res.data[0].get("name")
                except Exception as e:
                    print(f"[DB resolve department {department_id}]:", e)

            # Resolve domain name
            if domain_id and supabase_client:
                try:
                    dom_res = supabase_client.table("domains").select("name").eq("id", domain_id).execute()
                    if dom_res.data:
                        domain_name = dom_res.data[0].get("name")
                except Exception as e:
                    print(f"[DB resolve domain {domain_id}]:", e)

        return {
            "id": uid,
            "name": str(user_row.get("name", "")),
            "email": str(user_row.get("email", "")),
            "password_hash": str(user_row.get("password_hash", "")),
            "role": role,
            "is_active": bool(user_row.get("is_active", True)),
            "must_change_password": bool(user_row.get("must_change_password", False)),
            "created_at": str(user_row.get("created_at", "")),
            # Profile-level fields (students only)
            "department_id": department_id,
            "department_code": department_code,
            "department_name": department_name,
            "year": year,
            "domain_id": domain_id,
            "domain_name": domain_name,
            "readiness_score": readiness_score,
        }

    def update_user_password(self, user_id: str, new_password_hash: str) -> bool:
        """Update the password_hash for a user by ID."""
        if not supabase_client:
            return False
        try:
            now = datetime.utcnow().isoformat()
            res = supabase_client.table("users").update({
                "password_hash": new_password_hash,
                "password_changed_at": now,
                "updated_at": now,
            }).eq("id", str(user_id)).execute()
            return bool(res.data)
        except Exception as e:
            print(f"[DB update_user_password {user_id}]:", e)
        return False

    # ── Departments / Domains (catalog) ──────────────────────────────────────

    def get_all_departments(self) -> List[Dict[str, Any]]:
        """Return all active departments from the `departments` table."""
        if not supabase_client:
            return []
        try:
            res = supabase_client.table("departments").select("id, code, name").eq("is_active", True).execute()
            return res.data or []
        except Exception as e:
            print("[DB get_all_departments]:", e)
        return []

    def get_department_by_id(self, dept_id: str) -> Optional[Dict[str, Any]]:
        if not supabase_client or not dept_id:
            return None
        try:
            res = supabase_client.table("departments").select("id, code, name").eq("id", dept_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            print(f"[DB get_department_by_id {dept_id}]:", e)
        return None

    def get_department_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        if not supabase_client or not code:
            return None
        try:
            res = supabase_client.table("departments").select("id, code, name").eq("code", code.upper()).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            print(f"[DB get_department_by_code {code}]:", e)
        return None

    def get_all_domains(self) -> List[Dict[str, Any]]:
        """Return all active domains from the `domains` table."""
        if not supabase_client:
            return []
        try:
            res = supabase_client.table("domains").select("id, name, slug").eq("is_active", True).execute()
            return res.data or []
        except Exception as e:
            print("[DB get_all_domains]:", e)
        return []

    def get_domain_by_id(self, domain_id: str) -> Optional[Dict[str, Any]]:
        if not supabase_client or not domain_id:
            return None
        try:
            res = supabase_client.table("domains").select("id, name, slug").eq("id", domain_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            print(f"[DB get_domain_by_id {domain_id}]:", e)
        return None

    def get_domain_by_name_or_slug(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Resolve a domain by UUID, slug, or name (case-insensitive)."""
        if not supabase_client or not identifier:
            return None
        ident = str(identifier).strip()
        # 1. Try by UUID if it matches UUID format
        if len(ident) == 36 and ident.count("-") == 4:
            dom = self.get_domain_by_id(ident)
            if dom:
                return dom
        # 2. Try by exact slug
        try:
            res = supabase_client.table("domains").select("id, name, slug").eq("slug", ident.lower()).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
        # 3. Try by exact name
        try:
            res = supabase_client.table("domains").select("id, name, slug").ilike("name", ident).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
        # 4. Try alias mapping for known product titles
        _alias_map = {
            "software engineering": "software-engineering",
            "swe": "software-engineering",
            "backend & cloud engineering": "backend-engineering",
            "backend engineering": "backend-engineering",
            "dev": "backend-engineering",
            "ui/ux & product design": "ui-ux",
            "ui/ux": "ui-ux",
            "ui": "ui-ux",
            "video editing": "video-editing",
            "graphics designing": "graphics-designing",
            "cybersecurity & soc": "cybersecurity",
            "cybersecurity": "cybersecurity",
        }
        mapped_slug = _alias_map.get(ident.lower())
        if mapped_slug:
            try:
                res = supabase_client.table("domains").select("id, name, slug").eq("slug", mapped_slug).execute()
                if res.data:
                    return res.data[0]
            except Exception:
                pass
        # 5. Try prefix / substring
        try:
            res = supabase_client.table("domains").select("id, name, slug").ilike("name", f"%{ident[:6]}%").execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
        return None

    # ── Readiness ─────────────────────────────────────────────────────────────

    def calculate_and_store_readiness(self, student_id: str) -> Optional[float]:
        """
        Calculate readiness per Impulse_DB_Design.md §8 and persist the
        snapshot in student_profiles.readiness_score.

        Components:
          Aptitude  = AVG(score_percentage) of aptitude attempts
          Technical = AVG(score_percentage) of technical attempts
          ATS       = latest ATS score from resume_reviews (for student's current domain)

        Overall = (Aptitude + Technical + ATS) / 3
        Missing components treated as 0.
        """
        if not supabase_client:
            return None
        uid = str(student_id)

        apt_scores: List[float] = []
        tech_scores: List[float] = []

        try:
            att_res = supabase_client.table("mock_test_attempts").select(
                "score_percentage, test_id"
            ).eq("student_id", uid).eq("status", "submitted").execute()
            if att_res.data:
                test_ids = list({a["test_id"] for a in att_res.data if a.get("test_id")})
                type_map: Dict[str, str] = {}
                if test_ids:
                    t_res = supabase_client.table("mock_tests").select("id, test_type").in_("id", test_ids).execute()
                    if t_res.data:
                        type_map = {r["id"]: r.get("test_type", "") for r in t_res.data}
                for a in att_res.data:
                    sp = float(a.get("score_percentage", 0))
                    tt = type_map.get(a.get("test_id", ""), "")
                    if tt == "aptitude":
                        apt_scores.append(sp)
                    elif tt == "technical":
                        tech_scores.append(sp)
        except Exception as e:
            print(f"[DB readiness attempt fetch error {uid}]:", e)

        aptitude_avg = (sum(apt_scores) / len(apt_scores)) if apt_scores else 0.0
        technical_avg = (sum(tech_scores) / len(tech_scores)) if tech_scores else 0.0

        # ATS: latest review score for student's current domain
        ats_score = 0.0
        try:
            # Get student's current domain_id
            sp_res = supabase_client.table("student_profiles").select("domain_id").eq("user_id", uid).execute()
            current_domain_id = sp_res.data[0].get("domain_id") if sp_res.data else None

            if current_domain_id:
                rr_res = supabase_client.table("resume_reviews").select("ats_score, domain_id").eq("student_id", uid).execute()
                if rr_res.data:
                    # Only applicable if the review domain matches current domain
                    review = rr_res.data[0]
                    if review.get("domain_id") == current_domain_id:
                        ats_score = float(review.get("ats_score", 0))
        except Exception as e:
            print(f"[DB readiness ATS fetch {uid}]:", e)

        readiness = round((aptitude_avg + technical_avg + ats_score) / 3, 2)

        # Persist snapshot
        try:
            now = datetime.utcnow().isoformat()
            supabase_client.table("student_profiles").update({
                "readiness_score": readiness,
                "readiness_calculated_at": now,
                "updated_at": now,
            }).eq("user_id", uid).execute()
        except Exception as e:
            print(f"[DB readiness snapshot update {uid}]:", e)

        return readiness

    def get_readiness_components(self, student_id: str) -> Dict[str, Any]:
        """
        Return readiness breakdown {aptitude, technical, ats, score} for a student.
        Does NOT recalculate or store — reads from existing data on-demand.
        Used for API responses where we need component breakdown.
        """
        if not supabase_client:
            return {"score": None, "aptitude": None, "technical": None, "ats": None}

        uid = str(student_id)
        apt_scores: List[float] = []
        tech_scores: List[float] = []
        ats_score: Optional[float] = None

        try:
            att_res = supabase_client.table("mock_test_attempts").select(
                "score_percentage, test_id"
            ).eq("student_id", uid).eq("status", "submitted").execute()

            if att_res.data:
                test_ids = list({a.get("test_id") for a in att_res.data if a.get("test_id")})
                type_map: Dict[str, str] = {}
                if test_ids:
                    mt_res = supabase_client.table("mock_tests").select("id, test_type").in_("id", test_ids).execute()
                    if mt_res.data:
                        type_map = {r["id"]: r.get("test_type", "") for r in mt_res.data}
                for a in att_res.data:
                    sp = float(a.get("score_percentage", 0))
                    tt = type_map.get(a.get("test_id", ""), "")
                    if tt == "aptitude":
                        apt_scores.append(sp)
                    elif tt == "technical":
                        tech_scores.append(sp)
        except Exception as e:
            print(f"[DB readiness components {uid}]:", e)

        try:
            sp_res = supabase_client.table("student_profiles").select("domain_id").eq("user_id", uid).execute()
            current_domain_id = sp_res.data[0].get("domain_id") if sp_res.data else None
            if current_domain_id:
                rr_res = supabase_client.table("resume_reviews").select("ats_score, domain_id").eq("student_id", uid).execute()
                if rr_res.data:
                    review = rr_res.data[0]
                    if review.get("domain_id") == current_domain_id:
                        ats_score = float(review.get("ats_score", 0))
        except Exception as e:
            print(f"[DB readiness ATS components {uid}]:", e)

        aptitude_avg = round(sum(apt_scores) / len(apt_scores), 2) if apt_scores else None
        technical_avg = round(sum(tech_scores) / len(tech_scores), 2) if tech_scores else None

        components = [
            aptitude_avg if aptitude_avg is not None else 0.0,
            technical_avg if technical_avg is not None else 0.0,
            ats_score if ats_score is not None else 0.0,
        ]
        final_score = round(sum(components) / 3, 2)

        return {
            "score": final_score,
            "aptitude": aptitude_avg,
            "technical": technical_avg,
            "ats": ats_score,
        }

    # ── Mock Tests ─────────────────────────────────────────────────────────────

    def get_published_tests_for_student(self, department_id: Optional[str], year: Optional[Any]) -> List[Dict[str, Any]]:
        """
        Return published mock tests that match the student's department and year.
        Targeting rules (Impulse_DB_Design.md §16.4):
          (target_department_id IS NULL OR target_department_id = student's department_id)
          AND
          (target_year IS NULL OR target_year = student's year)
          AND
          status = 'published'
        """
        if not supabase_client:
            return []
        try:
            # Pre-load department codes
            departments = self.get_all_departments()
            dept_map = {str(d["id"]): d.get("code", "") for d in departments}

            # Parse student year safely (handles 4, "4", "4th Year", etc.)
            parsed_year: Optional[int] = None
            if year is not None:
                if isinstance(year, int) and year in (1, 2, 3, 4):
                    parsed_year = year
                else:
                    s = str(year).strip().lower()
                    for digit in ("1", "2", "3", "4"):
                        if digit in s:
                            parsed_year = int(digit)
                            break

            res = supabase_client.table("mock_tests").select(
                "id, title, duration_minutes, target_department_id, target_year, test_type, status, published_at"
            ).eq("status", "published").order("created_at", desc=True).execute()
            if not res.data:
                return []

            matching = []
            for t in res.data:
                td = t.get("target_department_id")
                ty = t.get("target_year")

                # Department rule: NULL -> all departments, otherwise matches student's department
                dept_match = (td is None) or (department_id is not None and str(td).lower() == str(department_id).lower())

                # Year rule: NULL -> all years, otherwise matches student's year
                year_match = (ty is None) or (parsed_year is not None and int(ty) == parsed_year)

                if dept_match and year_match:
                    q_res = supabase_client.table("mock_test_questions").select("id", count="exact").eq("test_id", t["id"]).execute()
                    q_count = q_res.count if hasattr(q_res, 'count') and q_res.count is not None else len(q_res.data or [])

                    target_dept_code = dept_map.get(str(td)) if td else None
                    duration = int(t.get("duration_minutes", 30))
                    test_type_str = str(t.get("test_type", "general")).lower()

                    matching.append({
                        "id": str(t["id"]),
                        "title": str(t.get("title", "")),
                        "duration_minutes": duration,
                        "durationMinutes": duration,
                        "durationMins": duration,
                        "test_type": test_type_str,
                        "category": test_type_str.capitalize(),
                        "status": str(t.get("status", "published")),
                        "total_questions": q_count,
                        "totalQuestions": q_count,
                        "questionCount": q_count,
                        "target_department_id": str(td) if td else None,
                        "target_department_code": target_dept_code,
                        "targetDept": target_dept_code or "All Departments",
                        "target_year": int(ty) if ty else None,
                        "targetYear": f"{ty}th Year" if ty else "All Years",
                        "published_at": str(t.get("published_at", "")),
                    })
            return matching
        except Exception as e:
            print("[DB get_published_tests_for_student]:", e)
        return []

    def get_all_published_tests(self) -> List[Dict[str, Any]]:
        """Return all published mock tests (for admin)."""
        if not supabase_client:
            return []
        try:
            departments = self.get_all_departments()
            dept_map = {str(d["id"]): d.get("code", "") for d in departments}

            res = supabase_client.table("mock_tests").select(
                "id, title, duration_minutes, target_department_id, target_year, test_type, status, published_at"
            ).eq("status", "published").order("created_at", desc=True).execute()
            out = []
            for t in (res.data or []):
                q_res = supabase_client.table("mock_test_questions").select("id", count="exact").eq("test_id", t["id"]).execute()
                q_count = q_res.count if hasattr(q_res, 'count') and q_res.count is not None else len(q_res.data or [])
                td = t.get("target_department_id")
                ty = t.get("target_year")
                target_dept_code = dept_map.get(str(td)) if td else None
                duration = int(t.get("duration_minutes", 30))
                test_type_str = str(t.get("test_type", "general")).lower()

                out.append({
                    "id": str(t["id"]),
                    "title": str(t.get("title", "")),
                    "duration_minutes": duration,
                    "durationMinutes": duration,
                    "durationMins": duration,
                    "test_type": test_type_str,
                    "category": test_type_str.capitalize(),
                    "status": str(t.get("status", "published")),
                    "total_questions": q_count,
                    "totalQuestions": q_count,
                    "questionCount": q_count,
                    "target_department_id": str(td) if td else None,
                    "target_department_code": target_dept_code,
                    "targetDept": target_dept_code or "All Departments",
                    "target_year": int(ty) if ty else None,
                    "targetYear": f"{ty}th Year" if ty else "All Years",
                    "published_at": str(t.get("published_at", "")),
                })
            return out
        except Exception as e:
            print("[DB get_all_published_tests]:", e)
        return []

    def get_test_by_id(self, test_id: str) -> Optional[Dict[str, Any]]:
        """Return a single mock test by ID."""
        if not supabase_client or not test_id:
            return None
        try:
            res = supabase_client.table("mock_tests").select("*").eq("id", test_id).execute()
            if not res.data:
                return None
            t = res.data[0]
            td = t.get("target_department_id")
            ty = t.get("target_year")
            duration = int(t.get("duration_minutes", 30))
            test_type_str = str(t.get("test_type", "general")).lower()

            target_dept_code = None
            if td:
                dept_res = supabase_client.table("departments").select("code").eq("id", td).execute()
                if dept_res.data:
                    target_dept_code = dept_res.data[0].get("code")

            return {
                "id": str(t["id"]),
                "title": str(t.get("title", "")),
                "duration_minutes": duration,
                "durationMinutes": duration,
                "durationMins": duration,
                "test_type": test_type_str,
                "category": test_type_str.capitalize(),
                "status": str(t.get("status", "")),
                "target_department_id": str(td) if td else None,
                "target_department_code": target_dept_code,
                "targetDept": target_dept_code or "All Departments",
                "target_year": int(ty) if ty else None,
                "targetYear": f"{ty}th Year" if ty else "All Years",
                "published_at": str(t.get("published_at", "")),
                "created_by": str(t.get("created_by", "")),
            }
        except Exception as e:
            print(f"[DB get_test_by_id {test_id}]:", e)
        return None

    def get_questions_for_test(self, test_id: str) -> List[Dict[str, Any]]:
        """Return all questions for a test, ordered by question_order."""
        if not supabase_client or not test_id:
            return []
        try:
            res = supabase_client.table("mock_test_questions").select(
                "id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, question_order"
            ).eq("test_id", test_id).order("question_order").execute()
            return res.data or []
        except Exception as e:
            print(f"[DB get_questions_for_test {test_id}]:", e)
        return []

    def get_question_by_id(self, question_id: str) -> Optional[Dict[str, Any]]:
        """Return a single question by ID."""
        if not supabase_client or not question_id:
            return None
        try:
            res = supabase_client.table("mock_test_questions").select("*").eq("id", question_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            print(f"[DB get_question_by_id {question_id}]:", e)
        return None

    def get_student_attempt(self, student_id: str, test_id: str, status: str = "in_progress") -> Optional[Dict[str, Any]]:
        """Return an in-progress (or other status) attempt for student+test."""
        if not supabase_client:
            return None
        try:
            res = supabase_client.table("mock_test_attempts").select("*").eq(
                "student_id", str(student_id)
            ).eq("test_id", str(test_id)).eq("status", status).order("created_at", desc=True).limit(1).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            print(f"[DB get_student_attempt {student_id}/{test_id}]:", e)
        return None

    def get_attempt_by_id(self, attempt_id: str) -> Optional[Dict[str, Any]]:
        if not supabase_client:
            return None
        try:
            res = supabase_client.table("mock_test_attempts").select("*").eq("id", attempt_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            print(f"[DB get_attempt_by_id {attempt_id}]:", e)
        return None

    def get_student_test_history(self, student_id: str) -> List[Dict[str, Any]]:
        """Return submitted attempts for a student, joined with test titles."""
        if not supabase_client:
            return []
        uid = str(student_id)
        try:
            res = supabase_client.table("mock_test_attempts").select(
                "id, test_id, attempt_number, marks_obtained, total_marks, score_percentage, status, started_at, submitted_at"
            ).eq("student_id", uid).eq("status", "submitted").order("submitted_at", desc=True).execute()
            if not res.data:
                return []

            # Bulk-fetch test titles
            test_ids = list({a["test_id"] for a in res.data if a.get("test_id")})
            title_map: Dict[str, str] = {}
            type_map: Dict[str, str] = {}
            if test_ids:
                mt_res = supabase_client.table("mock_tests").select("id, title, test_type").in_("id", test_ids).execute()
                if mt_res.data:
                    title_map = {r["id"]: r.get("title", "") for r in mt_res.data}
                    type_map = {r["id"]: r.get("test_type", "") for r in mt_res.data}

            out = []
            for a in res.data:
                tid = a.get("test_id", "")
                out.append({
                    "id": str(a["id"]),
                    "test_id": str(tid),
                    "test_title": title_map.get(tid, "Mock Test"),
                    "test_type": type_map.get(tid, "general"),
                    "attempt_number": int(a.get("attempt_number", 1)),
                    "marks_obtained": int(a.get("marks_obtained", 0)),
                    "total_marks": int(a.get("total_marks", 0)),
                    "score_percentage": float(a.get("score_percentage", 0)),
                    "status": str(a.get("status", "")),
                    "submitted_at": str(a.get("submitted_at", "")),
                    "cleared": float(a.get("score_percentage", 0)) > 65,
                })
            return out
        except Exception as e:
            print(f"[DB get_student_test_history {uid}]:", e)
        return []

    # ── Admin metrics ──────────────────────────────────────────────────────────

    def get_admin_student_list(self, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        """
        Return paginated student list for the admin dashboard.
        Reads readiness_score snapshot from student_profiles directly.
        """
        if not supabase_client:
            return {"students": [], "total": 0}
        try:
            offset = (page - 1) * page_size
            # Join users + student_profiles + departments using explicit foreign key
            res = supabase_client.table("users").select(
                "id, name, email, created_at, "
                "student_profiles!student_profiles_user_id_fkey(department_id, year, readiness_score, domain_id, departments(code, name))"
            ).eq("role", "student").eq("is_active", True).order("created_at", desc=True).range(offset, offset + page_size - 1).execute()

            total_res = supabase_client.table("users").select("id", count="exact").eq("role", "student").eq("is_active", True).execute()
            total = total_res.count if hasattr(total_res, 'count') and total_res.count is not None else 0

            students = []
            for u in (res.data or []):
                profile = u.get("student_profiles")
                if isinstance(profile, list) and profile:
                    profile = profile[0]
                elif not isinstance(profile, dict):
                    profile = {}
                dept = profile.get("departments") or {}
                if isinstance(dept, list) and dept:
                    dept = dept[0]
                elif not isinstance(dept, dict):
                    dept = {}
                students.append({
                    "id": str(u["id"]),
                    "name": str(u.get("name", "")),
                    "email": str(u.get("email", "")),
                    "department_code": dept.get("code"),
                    "department_name": dept.get("name"),
                    "branch": dept.get("code"),
                    "year": profile.get("year"),
                    "readiness_score": profile.get("readiness_score"),
                    "created_at": str(u.get("created_at", "")),
                })
            return {"students": students, "total": total}
        except Exception as e:
            print("[DB get_admin_student_list]:", e)
        return {"students": [], "total": 0}

    def get_admin_kpis(self) -> Dict[str, Any]:
        """
        Return the four admin dashboard KPIs using aggregate queries.
        See Impulse_DB_Design.md §29.
        """
        if not supabase_client:
            return {"total_students": 0, "total_mock_tests_taken": 0, "total_resumes_reviewed": 0, "total_interview_practices": 0}
        try:
            # 1. Total onboarded (active) students
            s_res = supabase_client.table("users").select("id", count="exact").eq("role", "student").eq("is_active", True).execute()
            total_students = s_res.count if hasattr(s_res, 'count') and s_res.count is not None else 0

            # 2. Total mock tests taken = distinct (student_id, test_id) combos
            mt_res = supabase_client.table("mock_test_attempts").select("student_id, test_id").execute()
            distinct_pairs = set()
            for a in (mt_res.data or []):
                distinct_pairs.add((a.get("student_id"), a.get("test_id")))
            total_mock_tests_taken = len(distinct_pairs)

            # 3. Total resumes reviewed = unique students with a resume_reviews row
            rr_res = supabase_client.table("resume_reviews").select("student_id", count="exact").execute()
            total_resumes_reviewed = rr_res.count if hasattr(rr_res, 'count') and rr_res.count is not None else 0

            # 4. Total interview practices = total rows in hr_interview_attempts
            ia_res = supabase_client.table("hr_interview_attempts").select("id", count="exact").execute()
            total_interview_practices = ia_res.count if hasattr(ia_res, 'count') and ia_res.count is not None else 0

            return {
                "total_students": total_students,
                "total_mock_tests_taken": total_mock_tests_taken,
                "total_resumes_reviewed": total_resumes_reviewed,
                "total_interview_practices": total_interview_practices,
            }
        except Exception as e:
            print("[DB get_admin_kpis]:", e)
        return {"total_students": 0, "total_mock_tests_taken": 0, "total_resumes_reviewed": 0, "total_interview_practices": 0}

    # ── Roadmap ────────────────────────────────────────────────────────────────

    def get_roadmap_for_domain(self, domain_id: str) -> List[Dict[str, Any]]:
        """Return all roadmap items for a domain, ordered by sort_order."""
        if not supabase_client or not domain_id:
            return []
        try:
            res = supabase_client.table("roadmap_items").select(
                "id, parent_id, title, description, item_type, sort_order"
            ).eq("domain_id", domain_id).eq("is_active", True).order("sort_order").execute()
            return res.data or []
        except Exception as e:
            print(f"[DB get_roadmap_for_domain {domain_id}]:", e)
        return []

    def get_student_roadmap_progress(self, student_id: str) -> List[Dict[str, Any]]:
        """Return a student's roadmap progress rows."""
        if not supabase_client:
            return []
        try:
            res = supabase_client.table("student_roadmap_progress").select(
                "roadmap_item_id, completed, completed_at"
            ).eq("student_id", str(student_id)).execute()
            return res.data or []
        except Exception as e:
            print(f"[DB get_student_roadmap_progress {student_id}]:", e)
        return []

    def upsert_roadmap_progress(self, student_id: str, roadmap_item_id: str, completed: bool) -> bool:
        """Mark a roadmap item as completed/incomplete for a student."""
        if not supabase_client:
            return False
        try:
            now = datetime.utcnow().isoformat()
            payload = {
                "student_id": str(student_id),
                "roadmap_item_id": str(roadmap_item_id),
                "completed": completed,
                "completed_at": now if completed else None,
                "updated_at": now,
            }
            supabase_client.table("student_roadmap_progress").upsert(
                payload, on_conflict="student_id,roadmap_item_id"
            ).execute()
            return True
        except Exception as e:
            print(f"[DB upsert_roadmap_progress {student_id}/{roadmap_item_id}]:", e)
        return False

    # ── Resume ────────────────────────────────────────────────────────────────

    def get_student_resume(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Return the student's resume record with all section sub-tables."""
        if not supabase_client:
            return None
        uid = str(student_id)
        try:
            res = supabase_client.table("student_resumes").select("*").eq("student_id", uid).execute()
            if not res.data:
                return None
            resume = res.data[0]
            resume_id = resume["id"]

            skills_res = supabase_client.table("resume_skills").select("*").eq("resume_id", resume_id).order("sort_order").execute()
            projects_res = supabase_client.table("resume_projects").select("*").eq("resume_id", resume_id).order("sort_order").execute()
            experience_res = supabase_client.table("resume_experience").select("*").eq("resume_id", resume_id).order("sort_order").execute()
            education_res = supabase_client.table("resume_education").select("*").eq("resume_id", resume_id).order("sort_order").execute()
            certs_res = supabase_client.table("resume_certifications").select("*").eq("resume_id", resume_id).order("sort_order").execute()
            achievements_res = supabase_client.table("resume_achievements").select("*").eq("resume_id", resume_id).order("sort_order").execute()

            resume["skills"] = skills_res.data or []
            resume["projects"] = projects_res.data or []
            resume["experience"] = experience_res.data or []
            resume["education"] = education_res.data or []
            resume["certifications"] = certs_res.data or []
            resume["achievements"] = achievements_res.data or []
            return resume
        except Exception as e:
            print(f"[DB get_student_resume {uid}]:", e)
        return None

    def upsert_student_resume(self, student_id: str, data: Dict[str, Any]) -> Optional[str]:
        """
        Create or update the student_resumes row, and persist all section sub-tables
        if provided in data: skills, projects, experience, education, certifications, achievements.
        Returns the resume UUID on success, None on failure.
        """
        if not supabase_client:
            return None
        uid = str(student_id)
        now = datetime.utcnow().isoformat()
        try:
            existing = supabase_client.table("student_resumes").select("id").eq("student_id", uid).execute()
            payload = {
                "student_id": uid,
                "summary": data.get("summary"),
                "phone": data.get("phone"),
                "location": data.get("location"),
                "linkedin_url": data.get("linkedin_url") or data.get("linkedIn"),
                "github_url": data.get("github_url") or data.get("github"),
                "template_type": "modern" if str(data.get("template_type", "")).lower() == "modern" else "ats",
                "source_type": "uploaded" if str(data.get("source_type", "")).lower() == "uploaded" else "builder",
                "updated_at": now,
            }
            if existing.data:
                resume_id = existing.data[0]["id"]
                supabase_client.table("student_resumes").update(payload).eq("id", resume_id).execute()
            else:
                payload["created_at"] = now
                ins_res = supabase_client.table("student_resumes").insert(payload).execute()
                if not ins_res.data:
                    return None
                resume_id = ins_res.data[0]["id"]

            # Persist section sub-tables if provided
            if "skills" in data and isinstance(data["skills"], list):
                supabase_client.table("resume_skills").delete().eq("resume_id", resume_id).execute()
                for i, item in enumerate(data["skills"]):
                    if isinstance(item, dict):
                        supabase_client.table("resume_skills").insert({
                            "resume_id": resume_id,
                            "skill": str(item.get("skill") or item.get("items") or item.get("name") or "").strip(),
                            "category": item.get("category"),
                            "sort_order": int(item.get("sort_order", i)),
                        }).execute()

            if "projects" in data and isinstance(data["projects"], list):
                supabase_client.table("resume_projects").delete().eq("resume_id", resume_id).execute()
                for i, item in enumerate(data["projects"]):
                    if isinstance(item, dict):
                        supabase_client.table("resume_projects").insert({
                            "resume_id": resume_id,
                            "title": str(item.get("title") or "Project").strip(),
                            "description": item.get("description"),
                            "technologies": item.get("technologies") or item.get("techStack"),
                            "project_url": item.get("project_url") or item.get("link"),
                            "sort_order": int(item.get("sort_order", i)),
                        }).execute()

            if "experience" in data and isinstance(data["experience"], list):
                supabase_client.table("resume_experience").delete().eq("resume_id", resume_id).execute()
                for i, item in enumerate(data["experience"]):
                    if isinstance(item, dict):
                        ent_type = str(item.get("entry_type", "experience")).lower()
                        if ent_type not in ("experience", "leadership"):
                            ent_type = "experience"
                        supabase_client.table("resume_experience").insert({
                            "resume_id": resume_id,
                            "entry_type": ent_type,
                            "organization": str(item.get("organization") or item.get("company") or "Company").strip(),
                            "role": str(item.get("role") or item.get("position") or "Role").strip(),
                            "description": item.get("description") or "\n".join(item.get("bullets", []) if isinstance(item.get("bullets"), list) else []),
                            "start_date": item.get("start_date") or None,
                            "end_date": item.get("end_date") or None,
                            "is_current": bool(item.get("is_current", False)),
                            "sort_order": int(item.get("sort_order", i)),
                        }).execute()

            if "education" in data and isinstance(data["education"], list):
                supabase_client.table("resume_education").delete().eq("resume_id", resume_id).execute()
                for i, item in enumerate(data["education"]):
                    if isinstance(item, dict):
                        supabase_client.table("resume_education").insert({
                            "resume_id": resume_id,
                            "institution": str(item.get("institution") or "University").strip(),
                            "degree": str(item.get("degree") or "Degree").strip(),
                            "field_of_study": item.get("field_of_study") or item.get("fieldOfStudy"),
                            "start_year": int(item["start_year"]) if item.get("start_year") else None,
                            "end_year": int(item["end_year"]) if item.get("end_year") else None,
                            "grade": item.get("grade") or item.get("gpa"),
                            "sort_order": int(item.get("sort_order", i)),
                        }).execute()

            if "certifications" in data and isinstance(data["certifications"], list):
                supabase_client.table("resume_certifications").delete().eq("resume_id", resume_id).execute()
                for i, item in enumerate(data["certifications"]):
                    if isinstance(item, dict):
                        supabase_client.table("resume_certifications").insert({
                            "resume_id": resume_id,
                            "name": str(item.get("name") or "Certification").strip(),
                            "issuer": item.get("issuer"),
                            "issue_date": item.get("issue_date") or None,
                            "credential_url": item.get("credential_url"),
                            "sort_order": int(item.get("sort_order", i)),
                        }).execute()
                    elif isinstance(item, str) and item.strip():
                        supabase_client.table("resume_certifications").insert({
                            "resume_id": resume_id,
                            "name": item.strip(),
                            "issuer": None,
                            "sort_order": i,
                        }).execute()

            if "achievements" in data and isinstance(data["achievements"], list):
                supabase_client.table("resume_achievements").delete().eq("resume_id", resume_id).execute()
                for i, item in enumerate(data["achievements"]):
                    if isinstance(item, dict):
                        supabase_client.table("resume_achievements").insert({
                            "resume_id": resume_id,
                            "title": str(item.get("title") or "Achievement").strip(),
                            "description": item.get("description"),
                            "sort_order": int(item.get("sort_order", i)),
                        }).execute()

            return resume_id
        except Exception as e:
            print(f"[DB upsert_student_resume {uid}]:", e)
        return None

    # ── HR Practice Questions ──────────────────────────────────────────────────

    def get_hr_questions(self) -> List[Dict[str, Any]]:
        """Return all active HR practice questions."""
        if not supabase_client:
            return []
        try:
            res = supabase_client.table("hr_practice_questions").select(
                "id, question, is_active"
            ).eq("is_active", True).execute()
            return res.data or []
        except Exception as e:
            print("[DB get_hr_questions]:", e)
        return []

    def get_hr_question_by_id(self, question_id: str) -> Optional[Dict[str, Any]]:
        if not supabase_client or not question_id:
            return None
        try:
            res = supabase_client.table("hr_practice_questions").select("id, question").eq("id", question_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            print(f"[DB get_hr_question_by_id {question_id}]:", e)
        return None

    def save_hr_interview_attempt(self, student_id: str, question_id: str, score: float, pace_wpm: float, confidence_score: float) -> bool:
        """Persist one HR interview attempt."""
        if not supabase_client:
            return False
        try:
            now = datetime.utcnow().isoformat()
            supabase_client.table("hr_interview_attempts").insert({
                "student_id": str(student_id),
                "question_id": str(question_id),
                "score": round(score, 2),
                "pace_wpm": round(pace_wpm, 2),
                "confidence_score": round(confidence_score, 2),
                "completed_at": now,
                "created_at": now,
            }).execute()
            return True
        except Exception as e:
            print(f"[DB save_hr_interview_attempt {student_id}]:", e)
        return False

    def get_student_latest_hr_attempt(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Return the most recent HR interview attempt for a student."""
        if not supabase_client:
            return None
        try:
            res = supabase_client.table("hr_interview_attempts").select(
                "id, question_id, score, pace_wpm, confidence_score, completed_at"
            ).eq("student_id", str(student_id)).order("completed_at", desc=True).limit(1).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            print(f"[DB get_student_latest_hr_attempt {student_id}]:", e)
        return None

    def get_student_hr_attempts(self, student_id: str) -> List[Dict[str, Any]]:
        """Return all HR interview attempts for a student."""
        if not supabase_client:
            return []
        try:
            res = supabase_client.table("hr_interview_attempts").select(
                "id, question_id, score, pace_wpm, confidence_score, completed_at"
            ).eq("student_id", str(student_id)).order("completed_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            print(f"[DB get_student_hr_attempts {student_id}]:", e)
        return []


# ─── Module-level singleton ────────────────────────────────────────────────────
db = Database()


# ─── Convenience functions (keep the same call sites as before) ────────────────

def get_user_readiness_metrics(user_id: str, **kwargs) -> Dict[str, Any]:
    """Public helper used by routers to get readiness breakdown."""
    user = db.get_user_by_id(str(user_id))
    if not user or user.get("role") != "student":
        return {"score": None, "aptitude": None, "technical": None, "ats": None}
    return db.get_readiness_components(str(user_id))


def calculate_user_readiness(user_id: str, **kwargs) -> Optional[float]:
    """Return only the overall readiness score."""
    metrics = get_user_readiness_metrics(user_id)
    return metrics.get("score")
