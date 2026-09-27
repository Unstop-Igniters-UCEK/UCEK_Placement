import os
import json
import hashlib
import base64
from datetime import datetime
from typing import Dict, Any, List, Optional

# Load env variables from .env files
for env_path in [
    os.path.join(os.getcwd(), '.env'),
    os.path.join(os.getcwd(), 'frontend', '.env'),
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

try:
    from supabase import create_client, Client
    HAS_SUPABASE_SDK = True
except ImportError:
    HAS_SUPABASE_SDK = False

SUPABASE_URL = (
    os.getenv("SUPABASE_URL")
    or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    or "https://exybkbctsfjckzyszdcg.supabase.co"
)
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

supabase_client: Optional[Any] = None
if HAS_SUPABASE_SDK and SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"[Supabase] Connected to Supabase DB at {SUPABASE_URL}")
    except Exception as err:
        print("[Supabase] Failed to initialize client:", err)

# Helper function for password hashing using PBKDF2 HMAC SHA256 or bcrypt compatibility
def hash_password(password: str, salt: str = "ucek_salt_2026") -> str:
    try:
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')
    except Exception:
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return base64.b64encode(key).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str, salt: str = "ucek_salt_2026") -> bool:
    if not hashed_password or not plain_password:
        return False
    # If standard bcrypt hash from node/python (starts with $2a$ or $2b$)
    if hashed_password.startswith('$2a$') or hashed_password.startswith('$2b$'):
        try:
            import bcrypt
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            pass
    # Default PBKDF2 comparison
    calc_hash = hash_password(plain_password, salt)
    return calc_hash == hashed_password

class Database:
    def __init__(self):
        self.revokedTokens: List[str] = []
        self.resetTokens: Dict[str, Any] = {}
        self.otp_store: Dict[str, Dict[str, Any]] = {}
        self.load()

    def load(self):
        # 1. Sync authentication metadata from Supabase app_state table (revoked/reset tokens only)
        if supabase_client:
            try:
                res = supabase_client.table("app_state").select("data").eq("key", "ucek_db_state").execute()
                if res.data and len(res.data) > 0:
                    remote_data = res.data[0].get("data", {})
                    if isinstance(remote_data, dict):
                        self.revokedTokens = remote_data.get('revokedTokens', self.revokedTokens)
                        self.resetTokens = remote_data.get('resetTokens', self.resetTokens)
            except Exception as e:
                print("[Supabase app_state load notice]:", e)

        # 2. Check or seed admin user in Supabase users table
        self._seed_default_users()

    def get_mock_tests(self) -> List[Dict[str, Any]]:
        """Query Supabase mock_tests table directly on-demand."""
        if supabase_client:
            try:
                mt_res = supabase_client.table("mock_tests").select("*").execute()
                if mt_res.data and len(mt_res.data) > 0:
                    loaded_tests = []
                    for t in mt_res.data:
                        tid = str(t.get("id"))
                        q_ids = t.get("question_ids") or t.get("questions") or []
                        dur = int(t.get("duration_mins") or 30)
                        target_dept = t.get("target_dept") or "All"
                        target_year = t.get("target_year") or "All"
                        comp_tag = t.get("company_tag") or "Department Core"
                        pass_pct = int(t.get("pass_percentage") or 60)

                        if len(q_ids) > 0:
                            loaded_tests.append({
                                "id": tid,
                                "title": str(t.get("title") or "Mock Assessment"),
                                "category": str(t.get("category") or "Departmental"),
                                "companyTag": comp_tag,
                                "company_tag": comp_tag,
                                "durationMins": dur,
                                "durationMinutes": dur,
                                "duration_mins": dur,
                                "passPercentage": pass_pct,
                                "pass_percentage": pass_pct,
                                "questionIds": q_ids,
                                "questions": q_ids,
                                "question_ids": q_ids,
                                "totalQuestions": len(q_ids),
                                "targetDept": target_dept,
                                "target_dept": target_dept,
                                "targetYear": target_year,
                                "target_year": target_year,
                                "description": f"Departmental assessment for {target_dept} ({target_year})."
                            })
                    return loaded_tests
            except Exception as e:
                print("[Supabase get_mock_tests error]:", e)
        return []

    def get_mock_test_by_id(self, test_id: str) -> Optional[Dict[str, Any]]:
        """Query Supabase mock_tests table directly for a specific test ID."""
        tid = str(test_id)
        if supabase_client:
            try:
                res = supabase_client.table("mock_tests").select("*").eq("id", tid).execute()
                if res.data and len(res.data) > 0:
                    t = res.data[0]
                    q_ids = t.get("question_ids") or t.get("questions") or []
                    dur = int(t.get("duration_mins") or 30)
                    target_dept = t.get("target_dept") or "All"
                    target_year = t.get("target_year") or "All"
                    comp_tag = t.get("company_tag") or "Department Core"
                    pass_pct = int(t.get("pass_percentage") or 60)
                    return {
                        "id": tid,
                        "title": str(t.get("title") or "Mock Assessment"),
                        "category": str(t.get("category") or "Departmental"),
                        "companyTag": comp_tag,
                        "company_tag": comp_tag,
                        "durationMins": dur,
                        "durationMinutes": dur,
                        "duration_mins": dur,
                        "passPercentage": pass_pct,
                        "pass_percentage": pass_pct,
                        "questionIds": q_ids,
                        "questions": q_ids,
                        "question_ids": q_ids,
                        "totalQuestions": len(q_ids),
                        "targetDept": target_dept,
                        "target_dept": target_dept,
                        "targetYear": target_year,
                        "target_year": target_year,
                        "description": f"Departmental assessment for {target_dept} ({target_year})."
                    }
            except Exception as e:
                print(f"[Supabase get_mock_test_by_id notice for {tid}]:", e)
        return None

    def get_questions_by_ids(self, q_ids: List[Any]) -> List[Dict[str, Any]]:
        """Query Supabase questions table directly on-demand."""
        if not q_ids or not supabase_client:
            return []
        str_ids = [str(i) for i in q_ids if isinstance(i, (str, int))]
        if str_ids:
            try:
                res = supabase_client.table("questions").select("*").in_("id", str_ids).execute()
                if res.data:
                    out = []
                    for q in res.data:
                        q_text = str(q.get("title") or q.get("question") or "")
                        out.append({
                            "id": str(q.get("id")),
                            "title": q_text,
                            "question": q_text,
                            "options": q.get("options") or [],
                            "correctOptionIndex": int(q.get("correct_option_index") or 0),
                            "explanation": str(q.get("explanation") or ""),
                            "category": str(q.get("category") or "General"),
                            "difficulty": str(q.get("difficulty") or "Medium"),
                            "companyTag": str(q.get("company_tag") or "General")
                        })
                    return out
            except Exception as e:
                print("[Supabase get_questions_by_ids notice]:", e)
        return []

    def save_mock_test(self, new_test: Dict[str, Any]) -> bool:
        """Upsert a single mock test directly to Supabase mock_tests table."""
        tid = str(new_test.get("id"))
        if not supabase_client:
            return True
        try:
            q_ids = new_test.get("questionIds") or new_test.get("question_ids") or []
            payload = {
                "id": tid,
                "title": str(new_test.get("title", "")),
                "category": str(new_test.get("category", "")),
                "company_tag": str(new_test.get("companyTag") or new_test.get("company_tag") or "General Placement"),
                "duration_mins": int(new_test.get("durationMins") or new_test.get("duration_mins") or 30),
                "pass_percentage": int(new_test.get("passPercentage") or new_test.get("pass_percentage") or 60),
                "question_ids": q_ids,
                "target_dept": new_test.get("targetDept") or new_test.get("target_dept") or "All",
                "target_year": new_test.get("targetYear") or new_test.get("target_year") or "All"
            }
            supabase_client.table("mock_tests").upsert(payload, on_conflict="id").execute()
            return True
        except Exception as e:
            print(f"[Supabase save_mock_test notice for {tid}]:", e)
            return False

    def save_questions(self, questions: List[Dict[str, Any]]) -> bool:
        """Upsert questions directly to Supabase questions table."""
        if not supabase_client:
            return True
        try:
            for q in questions:
                supabase_client.table("questions").upsert({
                    "id": str(q.get("id")),
                    "title": str(q.get("title") or q.get("question") or ""),
                    "question": str(q.get("title") or q.get("question") or ""),
                    "options": q.get("options", []),
                    "correct_option_index": int(q.get("correctOptionIndex", 0)),
                    "explanation": str(q.get("explanation", "")),
                    "category": str(q.get("category", "General")),
                    "difficulty": str(q.get("difficulty", "Medium")),
                    "created_at": datetime.now().isoformat()
                }, on_conflict="id").execute()
            return True
        except Exception as e:
            print("[Supabase save_questions notice]:", e)
            return False

    def save(self):
        """Persist lightweight app-level metadata (revoked tokens, reset tokens)."""
        self._save_app_state()

    def _save_app_state(self):
        """Write the lightweight app_state JSON blob (single Supabase row)."""
        if not supabase_client:
            return
        try:
            supabase_client.table("app_state").upsert({
                "key": "ucek_db_state",
                "data": {
                    "revokedTokens": self.revokedTokens,
                    "resetTokens": self.resetTokens,
                },
                "updated_at": datetime.now().isoformat()
            }).execute()
        except Exception as e:
            print("[Supabase app_state save notice]:", e)

    def _seed_default_users(self):
        import logging
        _seed_logger = logging.getLogger("uvicorn.error")
        admin_pw_env = os.getenv("ADMIN_DEFAULT_PASSWORD", "admin")
        if admin_pw_env == "admin":
            _seed_logger.warning("[SECURITY WARNING] Default admin password is 'admin'. Set ADMIN_DEFAULT_PASSWORD env var to a strong password.")
        pw_hash = hash_password(admin_pw_env)
        now_str = datetime.now().isoformat()
        admin_user = {
            "id": "u_admin_ucek",
            "name": "Admin UCEK",
            "email": "unstopignitersucek@gmail.com",
            "passwordHash": pw_hash,
            "password_hash": pw_hash,
            "role": "admin",
            "year": "Faculty",
            "branch": "Computer Science & Engg",
            "domainInterest": "Software Engineering",
            "isVerified": True,
            "readinessScore": 100,
            "createdAt": now_str
        }
        if supabase_client:
            try:
                res = supabase_client.table("users").select("id").eq("email", admin_user["email"]).execute()
                if not res.data:
                    supabase_client.table("users").insert({
                        "id": admin_user["id"],
                        "name": admin_user["name"],
                        "email": admin_user["email"],
                        "password_hash": admin_user["password_hash"],
                        "role": admin_user["role"],
                        "year": admin_user["year"],
                        "branch": admin_user["branch"],
                        "domain_interest": admin_user["domainInterest"],
                        "is_verified": True,
                        "created_at": admin_user["createdAt"]
                    }).execute()
            except Exception as e:
                print("[Supabase admin check notice]:", e)
        return False

    @staticmethod
    def _map_user(u: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw Supabase user row to standard backend dictionary."""
        uid = str(u.get("id"))
        role_str = str(u.get("role") or "mentee").strip().lower()
        has_selected = bool(u.get("has_selected_domain") or u.get("hasSelectedDomain") or False)
        domain_raw = u.get("domain_interest") or u.get("domainInterest")

        if domain_raw and domain_raw.strip().lower() in ("software engineering",) and role_str != "admin":
            has_selected = False
            domain_val = None
        elif domain_raw and (has_selected or domain_raw.strip().lower() not in ("software engineering",)):
            has_selected = True
            domain_val = domain_raw.strip()
        elif has_selected and domain_raw:
            domain_val = domain_raw.strip()
        else:
            domain_val = None
            has_selected = False

        target_drive_val = u.get("target_drive") or u.get("targetDrive") or None

        return {
            "id": uid,
            "name": str(u.get("name", "")),
            "email": str(u.get("email", "")),
            "passwordHash": str(u.get("password_hash") or u.get("passwordHash") or ""),
            "password_hash": str(u.get("password_hash") or u.get("passwordHash") or ""),
            "role": str(u.get("role", "mentee")),
            "year": str(u.get("year", "4th Year")),
            "branch": str(u.get("branch", "CSE")),
            "domainInterest": domain_val if has_selected else None,
            "isVerified": bool(u.get("is_verified", True)),
            "hasSelectedDomain": has_selected,
            "targetDrive": target_drive_val,
            "readinessScore": int(u["readiness_score"]) if u.get("readiness_score") is not None else None,
            "bio": u.get("bio"),
            "linkedInUrl": u.get("linkedin_url") or u.get("linkedInUrl"),
            "githubUrl": u.get("github_url") or u.get("githubUrl"),
            "createdAt": u.get("created_at") or datetime.now().isoformat()
        }

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Query Supabase users table directly by ID."""
        uid = str(user_id)
        if supabase_client:
            try:
                res = supabase_client.table("users").select("*").eq("id", uid).execute()
                if res.data and len(res.data) > 0:
                    return self._map_user(res.data[0])
            except Exception as e:
                print(f"[Supabase get_user_by_id notice for {uid}]:", e)
        return None

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Query Supabase users table directly by email."""
        clean_email = email.strip().lower()
        if supabase_client:
            try:
                res = supabase_client.table("users").select("*").eq("email", clean_email).execute()
                if res.data and len(res.data) > 0:
                    return self._map_user(res.data[0])
            except Exception as e:
                print(f"[Supabase get_user_by_email notice for {clean_email}]:", e)
        return None

    def save_user(self, user_obj: Any) -> bool:
        """Targeted upsert of a single user row to Supabase."""
        if isinstance(user_obj, str):
            u = self.get_user_by_id(user_obj)
            if not u:
                return False
        elif isinstance(user_obj, dict):
            u = user_obj
        else:
            return False

        uid = str(u.get("id"))
        if not supabase_client:
            return True

        try:
            payload = {
                "id": uid,
                "name": str(u.get("name", "")),
                "email": str(u.get("email", "")),
                "password_hash": str(u.get("passwordHash") or u.get("password_hash") or ""),
                "role": str(u.get("role", "mentee")),
                "year": str(u.get("year", "4th Year")),
                "branch": str(u.get("branch", "CSE")),
                "domain_interest": u.get("domainInterest") if u.get("hasSelectedDomain") else None,
                "is_verified": bool(u.get("isVerified", True)),
                "readiness_score": int(u["readinessScore"]) if u.get("readinessScore") is not None else None,
                "bio": u.get("bio"),
                "linkedin_url": u.get("linkedInUrl") or u.get("linkedin_url"),
                "github_url": u.get("githubUrl") or u.get("github_url"),
                "created_at": u.get("createdAt") or datetime.now().isoformat()
            }
            supabase_client.table("users").upsert(payload, on_conflict="email").execute()
            return True
        except Exception as e:
            print(f"[Supabase save_user error for {uid}]:", e)
            return False

    def update_user_password(self, email: str, new_password_hash: str) -> bool:
        """Targeted update of user password hash in Supabase users table."""
        clean_email = email.strip().lower()
        if supabase_client:
            try:
                res = supabase_client.table("users").update({
                    "password_hash": new_password_hash
                }).eq("email", clean_email).execute()
                print(f"[Supabase] Successfully updated password_hash for {clean_email} in Supabase users table.")
                return bool(res.data)
            except Exception as e:
                print(f"[Supabase password update error for {clean_email}]:", e)
        for u in self.users:
            if u.get("email", "").strip().lower() == clean_email:
                u["passwordHash"] = new_password_hash
                u["password_hash"] = new_password_hash
                return True
        return False

    @staticmethod
    def _map_roadmap(r: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw Supabase user_roadmap row."""
        return {
            "id": str(r.get("id")),
            "userId": str(r.get("user_id") or r.get("userId")),
            "domain": str(r.get("domain")),
            "overallProgress": int(r.get("overall_progress", 0)),
            "modules": r.get("modules", []),
            "lastUpdated": str(r.get("last_updated", ""))
        }

    def get_user_roadmap(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Query Supabase user_roadmaps table directly for a specific student."""
        uid = str(user_id)
        if supabase_client:
            try:
                res = supabase_client.table("user_roadmaps").select("*").eq("user_id", uid).execute()
                if res.data and len(res.data) > 0:
                    return self._map_roadmap(res.data[0])
            except Exception as e:
                print(f"[Supabase get_user_roadmap notice for {uid}]:", e)
        return None

    def save_roadmap(self, roadmap_obj: Any) -> bool:
        """Targeted upsert of a single user roadmap row to Supabase."""
        if isinstance(roadmap_obj, str):
            rm = self.get_user_roadmap(roadmap_obj)
            if not rm:
                return False
        elif isinstance(roadmap_obj, dict):
            rm = roadmap_obj
        else:
            return False

        uid = str(rm.get("userId") or rm.get("user_id"))
        if not supabase_client:
            return True

        try:
            supabase_client.table("user_roadmaps").upsert({
                "id": str(rm.get("id")),
                "user_id": uid,
                "domain": str(rm.get("domain")),
                "overall_progress": int(rm.get("overallProgress", 0)),
                "modules": rm.get("modules", []),
                "last_updated": rm.get("lastUpdated") or datetime.now().isoformat()
            }, on_conflict="id").execute()
            return True
        except Exception as e:
            print(f"[Supabase save_roadmap error for user {uid}]:", e)
            return False

    def _map_test_score(self, s: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw Supabase test_score row."""
        score_id = str(s.get("id"))
        score_val = int(s.get("score", 0))
        total_val = int(s.get("total") or s.get("total_questions") or s.get("totalQuestions") or 10)
        pct_val = float(s.get("percentage") or ((score_val / total_val) * 100 if total_val > 0 else 0.0))
        test_id_str = str(s.get("test_id") or s.get("testId") or "")

        # Look up category and title from mock_tests catalog if missing
        found_test = None
        if not (s.get("category") and (s.get("test_title") or s.get("testTitle"))):
            found_test = self.get_mock_test_by_id(test_id_str)
        category_val = s.get("category") or (found_test.get("category") if found_test else "Company Drive")
        title_val = s.get("test_title") or s.get("testTitle") or (found_test.get("title") if found_test else "Mock Assessment Drive")

        return {
            "id": score_id,
            "userId": str(s.get("user_id") or s.get("userId")),
            "testId": test_id_str,
            "testTitle": title_val,
            "category": category_val,
            "score": score_val,
            "total": total_val,
            "totalQuestions": total_val,
            "percentage": pct_val,
            "passed": bool(s.get("passed") if s.get("passed") is not None else pct_val >= 60),
            "timeTakenSec": int(s.get("time_taken_sec") or s.get("timeTakenSec") or 0),
            "submittedAt": str(s.get("submitted_at") or s.get("submittedAt") or s.get("date") or ""),
            "submitted_at": str(s.get("submitted_at") or s.get("submittedAt") or s.get("date") or ""),
            "date": str(s.get("submitted_at") or s.get("submittedAt") or s.get("date") or "").split("T")[0]
        }

    def get_user_test_scores(self, user_id: str) -> List[Dict[str, Any]]:
        """Query Supabase test_scores table directly for a specific student."""
        uid = str(user_id)
        if supabase_client:
            try:
                res = supabase_client.table("test_scores").select("*").eq("user_id", uid).order("submitted_at", desc=True).execute()
                if res.data:
                    return [self._map_test_score(s) for s in res.data]
            except Exception as e:
                print(f"[Supabase get_user_test_scores notice for {uid}]:", e)
        return []

    def save_test_score(self, score_obj: Any) -> bool:
        """Targeted upsert of a single test score row to Supabase."""
        if isinstance(score_obj, str):
            score = self.get_user_test_scores(score_obj)
            if not score:
                return False
            score = score[0]
        elif isinstance(score_obj, dict):
            score = score_obj
        else:
            return False

        score_id = str(score.get("id"))
        if not supabase_client:
            return True

        try:
            score_val = int(score.get("score", 0))
            total_val = int(score.get("total") or score.get("totalQuestions") or 10)
            pct_val = float(score.get("percentage") or ((score_val / total_val) * 100 if total_val > 0 else 0.0))
            supabase_client.table("test_scores").upsert({
                "id": score_id,
                "user_id": str(score.get("userId")),
                "test_id": str(score.get("testId")),
                "score": score_val,
                "total": total_val,
                "percentage": round(pct_val, 2),
                "submitted_at": str(score.get("submittedAt") or score.get("submitted_at") or score.get("date") or datetime.now().isoformat())
            }, on_conflict="id").execute()
            return True
        except Exception as e:
            print(f"[Supabase save_test_score error for {score_id}]:", e)
            return False

    def delete_user_test_scores(self, user_id: str) -> bool:
        """Delete all test scores for a specific user from Supabase."""
        uid = str(user_id)
        if supabase_client:
            try:
                supabase_client.table("test_scores").delete().eq("user_id", uid).execute()
                return True
            except Exception as e:
                print(f"[Supabase delete_user_test_scores notice for {uid}]:", e)
        return True

    def get_all_mentors(self) -> List[Dict[str, Any]]:
        """Query Supabase users table directly for users with mentor role."""
        mentors = []
        if supabase_client:
            try:
                res = supabase_client.table("users").select("*").eq("role", "mentor").execute()
                if res.data:
                    for u in res.data:
                        mentors.append({
                            "id": str(u.get("id")),
                            "name": str(u.get("name", "Mentor")),
                            "email": str(u.get("email", "")),
                            "role": "mentor",
                            "year": str(u.get("year", "Faculty")),
                            "branch": str(u.get("branch", "CSE")),
                            "domainInterest": u.get("domain_interest"),
                            "bio": u.get("bio", "Experienced mentor at UCEK ready to help with Placement prep."),
                            "linkedInUrl": u.get("linkedin_url"),
                            "githubUrl": u.get("github_url"),
                            "readinessScore": u.get("readiness_score")
                        })
            except Exception as e:
                print("[Supabase get_all_mentors notice]:", e)
        return mentors

    def get_mentorship_for_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Query Supabase mentorships table directly for a specific student/mentor."""
        uid = str(user_id)
        if supabase_client:
            try:
                res = supabase_client.table("mentorships").select("*").or_(f"mentee_id.eq.{uid},mentor_id.eq.{uid}").execute()
                if res.data and len(res.data) > 0:
                    m = res.data[0]
                    return {
                        "id": str(m.get("id")),
                        "mentorId": str(m.get("mentor_id")),
                        "mentorName": str(m.get("mentor_name")),
                        "menteeId": str(m.get("mentee_id")),
                        "menteeName": str(m.get("mentee_name")),
                        "status": str(m.get("status", "Active")),
                        "nextMeetingDate": str(m.get("next_meeting_date", "")),
                        "logs": m.get("logs", [])
                    }
            except Exception as e:
                print(f"[Supabase get_mentorship_for_user notice for {uid}]:", e)
        return None

    def save_mentorship(self, mentorship_obj: Any) -> bool:
        """Targeted upsert of a single mentorship pair to Supabase."""
        if not isinstance(mentorship_obj, dict):
            return False

        mid = str(mentorship_obj.get("id"))
        if not supabase_client:
            return True

        try:
            supabase_client.table("mentorships").upsert({
                "id": mid,
                "mentor_id": str(mentorship_obj.get("mentorId") or (mentorship_obj.get("mentor") or {}).get("id", "")),
                "mentor_name": str(mentorship_obj.get("mentorName") or (mentorship_obj.get("mentor") or {}).get("name", "")),
                "mentee_id": str(mentorship_obj.get("menteeId") or (mentorship_obj.get("mentee") or {}).get("id", "")),
                "mentee_name": str(mentorship_obj.get("menteeName") or (mentorship_obj.get("mentee") or {}).get("name", "")),
                "status": str(mentorship_obj.get("status", "Active")),
                "next_meeting_date": str(mentorship_obj.get("nextMeetingDate", "")),
                "logs": mentorship_obj.get("logs") or mentorship_obj.get("checkInLogs") or []
            }, on_conflict="id").execute()
            return True
        except Exception as e:
            print(f"[Supabase save_mentorship error for {mid}]:", e)
            return False

    def get_all_users_admin(self) -> List[Dict[str, Any]]:
        """Query Supabase users table directly for Admin Dashboard."""
        if supabase_client:
            try:
                res = supabase_client.table("users").select("*").execute()
                if res.data:
                    return [self._map_user(u) for u in res.data]
            except Exception as e:
                print("[Supabase get_all_users_admin notice]:", e)
        return []

    def get_all_test_scores_admin(self) -> List[Dict[str, Any]]:
        """Query Supabase test_scores table directly for Admin Dashboard."""
        if supabase_client:
            try:
                res = supabase_client.table("test_scores").select("*").execute()
                if res.data:
                    return [self._map_test_score(s) for s in res.data]
            except Exception as e:
                print("[Supabase get_all_test_scores_admin notice]:", e)
        return []


db = Database()


def get_user_readiness_metrics(user_id: str) -> Dict[str, Any]:
    """Calculate genuine readiness metrics directly from Supabase DB records for this student."""
    u_id = str(user_id)

    # 1. Fetch test scores for this user from Supabase test_scores table
    u_tests = []
    if supabase_client:
        try:
            ts_res = supabase_client.table("test_scores").select("score,total,percentage,test_id").eq("user_id", u_id).execute()
            if ts_res.data:
                u_tests = ts_res.data
        except Exception as e:
            print(f"[Supabase readiness test_scores notice for {u_id}]:", e)

    # 2. Fetch ATS score for this user from Supabase users table readiness_score column
    ats_score = None
    if supabase_client:
        try:
            u_res = supabase_client.table("users").select("readiness_score").eq("id", u_id).execute()
            if u_res.data and len(u_res.data) > 0 and u_res.data[0].get("readiness_score") is not None:
                ats_score = int(u_res.data[0]["readiness_score"])
        except Exception as e:
            print(f"[Supabase readiness ats_score notice for {u_id}]:", e)

    # 3. Fetch user roadmap progress from Supabase user_roadmaps table
    user_rm = None
    if supabase_client:
        try:
            rm_res = supabase_client.table("user_roadmaps").select("overall_progress,modules").eq("user_id", u_id).execute()
            if rm_res.data and len(rm_res.data) > 0:
                user_rm = rm_res.data[0]
        except Exception as e:
            print(f"[Supabase readiness roadmap notice for {u_id}]:", e)

    def get_test_pct(s):
        if not s:
            return 0.0
        if "percentage" in s and s["percentage"] is not None:
            return float(s["percentage"])
        tot = max(1, int(s.get("total") or 10))
        score_val = float(s.get("score", 0))
        return (score_val / tot) * 100.0

    def get_test_cat(s):
        cat = s.get("category")
        if cat:
            return str(cat).lower()
        t_id = str(s.get("test_id") or s.get("testId") or "")
        found_test = db.get_mock_test_by_id(t_id) if t_id else None
        if found_test and found_test.get("category"):
            return str(found_test["category"]).lower()
        return "company drive"

    apt_tests = [s for s in u_tests if "aptitude" in get_test_cat(s) or "company" in get_test_cat(s)]
    tech_tests = [s for s in u_tests if "technical" in get_test_cat(s) or "coding" in get_test_cat(s) or "department" in get_test_cat(s)]

    apt_score = None
    if apt_tests:
        apt_score = round(sum(get_test_pct(s) for s in apt_tests) / len(apt_tests))
    elif u_tests and not tech_tests:
        apt_score = round(sum(get_test_pct(s) for s in u_tests) / len(u_tests))

    tech_score = None
    if tech_tests:
        tech_score = round(sum(get_test_pct(s) for s in tech_tests) / len(tech_tests))
    elif u_tests and not apt_tests:
        tech_score = round(sum(get_test_pct(s) for s in u_tests) / len(u_tests))

    tot_t = 0
    done_t = 0
    if user_rm and isinstance(user_rm.get("modules"), list):
        for m in user_rm["modules"]:
            if isinstance(m, dict) and isinstance(m.get("milestones"), list):
                for ms in m["milestones"]:
                    tot_t += 1
                    if isinstance(ms, dict) and ms.get("completed"):
                        done_t += 1

    domain_pct = None
    if tot_t > 0 and done_t > 0:
        domain_pct = round((done_t / tot_t) * 100)
    elif user_rm and isinstance(user_rm.get("overall_progress"), (int, float)) and user_rm["overall_progress"] > 0:
        domain_pct = int(user_rm["overall_progress"])

    # Calculate overall readiness score based strictly on genuine data available
    # Requires at least one core evaluation (Aptitude, Technical, or ATS) to produce an overall score
    if apt_score is None and tech_score is None and ats_score is None:
        final_readiness = None
    else:
        components = []
        if apt_score is not None:
            components.append((apt_score, 0.35))
        if tech_score is not None:
            components.append((tech_score, 0.35))
        if ats_score is not None:
            components.append((ats_score, 0.20))
        if domain_pct is not None:
            components.append((domain_pct, 0.10))

        if components:
            total_weight = sum(w for _, w in components)
            calc_readiness = round(sum(val * w for val, w in components) / total_weight)
            final_readiness = min(100, max(0, calc_readiness))
        else:
            final_readiness = None

    return {
        "score": final_readiness,
        "aptitude": apt_score,
        "technical": tech_score,
        "ats": ats_score
    }


def calculate_user_readiness(user_id: str) -> Optional[int]:
    metrics = get_user_readiness_metrics(user_id)
    return metrics["score"]

