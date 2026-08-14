import os
import json
import hashlib
import base64
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.mock_data import INITIAL_QUESTIONS, INITIAL_MOCK_TESTS, INITIAL_INTERVIEW_QUESTIONS, DEFAULT_ROADMAPS

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

DATA_DIR = os.path.join(os.getcwd(), '.data')
DB_FILE = os.path.join(DATA_DIR, 'db.json')

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
    or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eWJrYmN0c2ZqY2t6eXN6ZGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1ODA3NDcsImV4cCI6MjEwMTE1Njc0N30.m9TkoTbA8Kmi07sZ1oK2VbeQGKdCMkJQt8OAQnWII7U"
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
        self.users: List[Dict[str, Any]] = []
        self.questions: List[Dict[str, Any]] = INITIAL_QUESTIONS
        self.mockTests: List[Dict[str, Any]] = INITIAL_MOCK_TESTS
        self.testScores: List[Dict[str, Any]] = []
        self.resumes: List[Dict[str, Any]] = []
        self.resumeReviews: List[Dict[str, Any]] = []
        self.jdMatches: List[Dict[str, Any]] = []
        self.interviewResponses: List[Dict[str, Any]] = []
        self.mentorships: List[Dict[str, Any]] = []
        self.userRoadmaps: List[Dict[str, Any]] = []
        self.revokedTokens: List[str] = []
        self.resetTokens: Dict[str, Any] = {}
        self.otp_store: Dict[str, Dict[str, Any]] = {}
        self.load()

    def load(self):
        # Remove local file cache if it exists so we operate directly on Supabase DB
        if os.path.exists(DB_FILE):
            try:
                os.remove(DB_FILE)
                print("[Database] Cleaned local db.json file cache. Using Supabase DB as primary storage.")
            except Exception:
                pass

        # 1. Sync state JSON from Supabase app_state table
        if supabase_client:
            try:
                res = supabase_client.table("app_state").select("data").eq("key", "ucek_db_state").execute()
                if res.data and len(res.data) > 0:
                    remote_data = res.data[0].get("data", {})
                    if isinstance(remote_data, dict):
                        self.users = remote_data.get('users', self.users)
                        self.questions = remote_data.get('questions', self.questions)
                        self.mockTests = remote_data.get('mockTests', self.mockTests)
                        self.testScores = remote_data.get('testScores', self.testScores)
                        self.resumes = remote_data.get('resumes', self.resumes)
                        self.resumeReviews = remote_data.get('resumeReviews', self.resumeReviews)
                        self.jdMatches = remote_data.get('jdMatches', self.jdMatches)
                        self.interviewResponses = remote_data.get('interviewResponses', self.interviewResponses)
                        self.mentorships = remote_data.get('mentorships', self.mentorships)
                        self.userRoadmaps = remote_data.get('userRoadmaps', self.userRoadmaps)
                        self.revokedTokens = remote_data.get('revokedTokens', self.revokedTokens)
                        self.resetTokens = remote_data.get('resetTokens', self.resetTokens)
            except Exception as e:
                print("[Supabase app_state load notice]:", e)

            # 2. Sync directly from Supabase relational users table
            try:
                rel_res = supabase_client.table("users").select("*").execute()
                if rel_res.data and len(rel_res.data) > 0:
                    self.users = []
                    for u in rel_res.data:
                        mapped = {
                            "id": str(u.get("id")),
                            "name": str(u.get("name", "")),
                            "email": str(u.get("email", "")),
                            "passwordHash": str(u.get("password_hash") or u.get("passwordHash") or ""),
                            "password_hash": str(u.get("password_hash") or u.get("passwordHash") or ""),
                            "role": str(u.get("role", "mentee")),
                            "year": str(u.get("year", "4th Year")),
                            "branch": str(u.get("branch", "CSE")),
                            "domainInterest": str(u.get("domain_interest") or u.get("domainInterest") or "Software Engineering"),
                            "isVerified": bool(u.get("is_verified", True)),
                            "readinessScore": int(u.get("readiness_score", 50)),
                            "bio": u.get("bio"),
                            "linkedInUrl": u.get("linkedin_url"),
                            "githubUrl": u.get("github_url"),
                            "createdAt": u.get("created_at") or datetime.now().isoformat()
                        }
                        self.users.append(mapped)
                    print(f"[Supabase] Loaded {len(self.users)} users directly from Supabase users table.")
            except Exception as e:
                print("[Supabase users table load notice]:", e)

            # 3. Sync directly from Supabase relational user_roadmaps table
            try:
                rm_res = supabase_client.table("user_roadmaps").select("*").execute()
                if rm_res.data and len(rm_res.data) > 0:
                    self.userRoadmaps = []
                    for r in rm_res.data:
                        mapped_rm = {
                            "id": str(r.get("id")),
                            "userId": str(r.get("user_id")),
                            "domain": str(r.get("domain")),
                            "overallProgress": int(r.get("overall_progress", 0)),
                            "modules": r.get("modules", []),
                            "lastUpdated": str(r.get("last_updated", ""))
                        }
                        self.userRoadmaps.append(mapped_rm)
                    print(f"[Supabase] Loaded {len(self.userRoadmaps)} roadmaps directly from Supabase user_roadmaps table.")
            except Exception as e:
                print("[Supabase user_roadmaps table load notice]:", e)

        self._seed_default_users()
        self.save()

    def save(self):
        # Direct Supabase database sync (no local file creation)
        data = {
            "users": self.users,
            "questions": self.questions,
            "mockTests": self.mockTests,
            "testScores": self.testScores,
            "resumes": self.resumes,
            "resumeReviews": self.resumeReviews,
            "jdMatches": self.jdMatches,
            "interviewResponses": self.interviewResponses,
            "mentorships": self.mentorships,
            "userRoadmaps": self.userRoadmaps,
            "revokedTokens": self.revokedTokens,
            "resetTokens": self.resetTokens
        }

        if supabase_client:
            try:
                supabase_client.table("app_state").upsert({
                    "key": "ucek_db_state",
                    "data": data,
                    "updated_at": datetime.now().isoformat()
                }).execute()
            except Exception as e:
                print("[Supabase app_state save notice]:", e)

            try:
                for u in self.users:
                    supabase_client.table("users").upsert({
                        "id": str(u.get("id")),
                        "name": str(u.get("name", "")),
                        "email": str(u.get("email", "")),
                        "password_hash": str(u.get("passwordHash") or u.get("password_hash") or ""),
                        "role": str(u.get("role", "mentee")),
                        "year": str(u.get("year", "4th Year")),
                        "branch": str(u.get("branch", "CSE")),
                        "domain_interest": str(u.get("domainInterest") or u.get("domain_interest") or "Software Engineering"),
                        "is_verified": bool(u.get("isVerified", True)),
                        "readiness_score": int(u.get("readinessScore", 50)),
                        "bio": u.get("bio"),
                        "linkedin_url": u.get("linkedInUrl") or u.get("linkedin_url"),
                        "github_url": u.get("githubUrl") or u.get("github_url"),
                        "created_at": u.get("createdAt") or datetime.now().isoformat()
                    }, on_conflict="email").execute()
            except Exception as e:
                print("[Supabase users table save notice]:", e)

            try:
                for rm in self.userRoadmaps:
                    supabase_client.table("user_roadmaps").upsert({
                        "id": str(rm.get("id")),
                        "user_id": str(rm.get("userId")),
                        "domain": str(rm.get("domain")),
                        "overall_progress": int(rm.get("overallProgress", 0)),
                        "modules": rm.get("modules", []),
                        "last_updated": rm.get("lastUpdated") or datetime.now().isoformat()
                    }, on_conflict="id").execute()
            except Exception as e:
                print("[Supabase user_roadmaps table save notice]:", e)

    def update_user_password(self, email: str, new_password_hash: str) -> bool:
        clean_email = email.strip().lower()
        found = False
        for u in self.users:
            if u.get("email", "").strip().lower() == clean_email:
                u["passwordHash"] = new_password_hash
                u["password_hash"] = new_password_hash
                found = True

        if found and supabase_client:
            try:
                # Update password directly on existing user row in Supabase matching email
                supabase_client.table("users").update({
                    "password_hash": new_password_hash
                }).eq("email", clean_email).execute()
                print(f"[Supabase] Successfully updated password_hash for {clean_email} in Supabase users table.")
            except Exception as e:
                print(f"[Supabase password update error for {clean_email}]:", e)

        self.save()
        return found

    def _seed_default_users(self):
        pw_hash = hash_password("admin")
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
        if not any(u.get("email") == admin_user["email"] for u in self.users):
            self.users.append(admin_user)

db = Database()
