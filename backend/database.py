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
        self.hrPracticeQuestions: List[Dict[str, Any]] = INITIAL_INTERVIEW_QUESTIONS
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
                            "hasSelectedDomain": bool(u.get("has_selected_domain") or u.get("hasSelectedDomain") or False),
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

            # 4. Sync directly from Supabase relational test_scores table
            try:
                ts_res = supabase_client.table("test_scores").select("*").execute()
                if ts_res.data and len(ts_res.data) > 0:
                    existing_by_id = {str(s.get("id")): s for s in self.testScores if s.get("id")}
                    loaded_scores = []
                    for s in ts_res.data:
                        score_id = str(s.get("id"))
                        prev = existing_by_id.get(score_id, {})
                        score_val = int(s.get("score", prev.get("score", 0)))
                        total_val = int(s.get("total") or s.get("total_questions") or prev.get("totalQuestions") or 10)
                        pct_val = float(s.get("percentage") or prev.get("percentage") or ((score_val / total_val) * 100 if total_val > 0 else 0.0))

                        loaded_scores.append({
                            "id": score_id,
                            "userId": str(s.get("user_id") or prev.get("userId")),
                            "testId": str(s.get("test_id") or prev.get("testId")),
                            "testTitle": s.get("test_title") or s.get("testTitle") or prev.get("testTitle") or "Mock Assessment Drive",
                            "category": s.get("category") or prev.get("category") or "Company Drive",
                            "score": score_val,
                            "total": total_val,
                            "totalQuestions": total_val,
                            "percentage": pct_val,
                            "passed": bool(s.get("passed") if s.get("passed") is not None else prev.get("passed", pct_val >= 60)),
                            "timeTakenSec": int(s.get("time_taken_sec") or s.get("timeTakenSec") or prev.get("timeTakenSec") or 0),
                            "userAnswers": s.get("user_answers") or s.get("userAnswers") or prev.get("userAnswers") or {},
                            "submittedAt": str(s.get("submitted_at") or s.get("date") or prev.get("submittedAt") or ""),
                            "submitted_at": str(s.get("submitted_at") or s.get("date") or prev.get("submittedAt") or ""),
                            "date": str(s.get("submitted_at") or s.get("date") or prev.get("date") or "").split("T")[0]
                        })
                    self.testScores = loaded_scores
                    print(f"[Supabase] Loaded {len(self.testScores)} test scores directly from Supabase test_scores table.")
            except Exception as e:
                print("[Supabase test_scores table load notice]:", e)

            # 5. Sync directly from Supabase relational mock_tests table
            try:
                mt_res = supabase_client.table("mock_tests").select("*").execute()
                if mt_res.data and len(mt_res.data) > 0:
                    self.mockTests = []
                    for t in mt_res.data:
                        self.mockTests.append({
                            "id": str(t.get("id")),
                            "title": str(t.get("title", "")),
                            "category": str(t.get("category", "")),
                            "companyTag": str(t.get("company_tag") or t.get("companyTag") or "General Placement"),
                            "company_tag": str(t.get("company_tag") or t.get("companyTag") or "General Placement"),
                            "durationMinutes": int(t.get("duration_mins") or t.get("durationMinutes") or 30),
                            "duration_mins": int(t.get("duration_mins") or t.get("durationMinutes") or 30),
                            "passPercentage": int(t.get("pass_percentage") or t.get("passPercentage") or 70),
                            "pass_percentage": int(t.get("pass_percentage") or t.get("passPercentage") or 70),
                            "questions": t.get("question_ids") or t.get("questions") or []
                        })
                    print(f"[Supabase] Loaded {len(self.mockTests)} mock tests directly from Supabase mock_tests table.")
            except Exception as e:
                print("[Supabase mock_tests table load notice]:", e)

            # 6. Sync directly from Supabase relational mentorships table
            try:
                m_res = supabase_client.table("mentorships").select("*").execute()
                if m_res.data and len(m_res.data) > 0:
                    self.mentorships = []
                    for m in m_res.data:
                        self.mentorships.append({
                            "id": str(m.get("id")),
                            "mentorId": str(m.get("mentor_id")),
                            "mentorName": str(m.get("mentor_name")),
                            "menteeId": str(m.get("mentee_id")),
                            "menteeName": str(m.get("mentee_name")),
                            "status": str(m.get("status", "Active")),
                            "nextMeetingDate": str(m.get("next_meeting_date", "")),
                            "logs": m.get("logs", [])
                        })
                    print(f"[Supabase] Loaded {len(self.mentorships)} mentorship pairs directly from Supabase mentorships table.")
            except Exception as e:
                print("[Supabase mentorships table load notice]:", e)

            # 7. Sync directly from Supabase relational resumes table
            try:
                r_res = supabase_client.table("resumes").select("*").execute()
                if r_res.data and len(r_res.data) > 0:
                    self.resumes = []
                    for r in r_res.data:
                        self.resumes.append({
                            "id": str(r.get("id")),
                            "userId": str(r.get("user_id")),
                            "fileName": str(r.get("file_name", "")),
                            "fileUrl": str(r.get("file_url", "")),
                            "parsedSkills": r.get("parsed_skills", []),
                            "atsScore": int(r.get("ats_score", 0)),
                            "uploadedAt": str(r.get("uploaded_at", ""))
                        })
                    print(f"[Supabase] Loaded {len(self.resumes)} resumes directly from Supabase resumes table.")
            except Exception as e:
                if "PGRST205" in str(e) or "resumes" in str(e):
                    print("[Supabase] Resumes table optional or in-memory fallback active.")
                else:
                    print("[Supabase resumes table load notice]:", e)

            # 8. Sync directly from Supabase relational hr_practice_questions table
            try:
                hr_res = supabase_client.table("hr_practice_questions").select("*").execute()
                if hr_res.data and len(hr_res.data) >= 5:
                    self.hrPracticeQuestions = []
                    for q in hr_res.data:
                        self.hrPracticeQuestions.append({
                            "id": str(q.get("id")),
                            "companyTag": str(q.get("company_tag") or q.get("companyTag") or "General HR"),
                            "company_tag": str(q.get("company_tag") or q.get("companyTag") or "General HR"),
                            "questionText": str(q.get("question_text") or q.get("question") or ""),
                            "question": str(q.get("question_text") or q.get("question") or ""),
                            "category": str(q.get("category", "HR & Behavioral")),
                            "isFeatured": bool(q.get("is_featured", True)),
                            "createdAt": str(q.get("created_at", ""))
                        })
                    print(f"[Supabase] Loaded {len(self.hrPracticeQuestions)} practice questions directly from Supabase hr_practice_questions table.")
                else:
                    print("[Supabase] Seeding default company practice questions to Supabase hr_practice_questions table...")
                    self.hrPracticeQuestions = INITIAL_INTERVIEW_QUESTIONS
                    for q in INITIAL_INTERVIEW_QUESTIONS:
                        supabase_client.table("hr_practice_questions").upsert({
                            "id": str(q["id"]),
                            "company_tag": str(q.get("companyTag") or q.get("company_tag") or "General HR"),
                            "question_text": str(q.get("questionText") or q.get("question") or ""),
                            "category": str(q.get("category", "HR & Behavioral")),
                            "is_featured": True,
                            "created_at": datetime.now().isoformat()
                        }, on_conflict="id").execute()
                    print(f"[Supabase] Successfully seeded {len(INITIAL_INTERVIEW_QUESTIONS)} practice questions into hr_practice_questions table.")
            except Exception as e:
                print("[Supabase hr_practice_questions table load notice]:", e)

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
            "hrPracticeQuestions": self.hrPracticeQuestions,
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
                    user_payload = {
                        "id": str(u.get("id")),
                        "name": str(u.get("name", "")),
                        "email": str(u.get("email", "")),
                        "password_hash": str(u.get("passwordHash") or u.get("password_hash") or ""),
                        "role": str(u.get("role", "mentee")),
                        "year": str(u.get("year", "4th Year")),
                        "branch": str(u.get("branch", "CSE")),
                        "domain_interest": str(u.get("domainInterest") or u.get("domain_interest") or "Software Engineering"),
                        "has_selected_domain": bool(u.get("hasSelectedDomain") or u.get("has_selected_domain") or False),
                        "is_verified": bool(u.get("isVerified", True)),
                        "readiness_score": int(u.get("readinessScore", 50)),
                        "bio": u.get("bio"),
                        "linkedin_url": u.get("linkedInUrl") or u.get("linkedin_url"),
                        "github_url": u.get("githubUrl") or u.get("github_url"),
                        "created_at": u.get("createdAt") or datetime.now().isoformat()
                    }
                    try:
                        supabase_client.table("users").upsert(user_payload, on_conflict="email").execute()
                    except Exception as err:
                        if "has_selected_domain" in str(err) or "PGRST204" in str(err):
                            user_payload.pop("has_selected_domain", None)
                            supabase_client.table("users").upsert(user_payload, on_conflict="email").execute()
                        else:
                            raise err
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

            # Sync to test_scores table
            try:
                for score in self.testScores:
                    score_val = int(score.get("score", 0))
                    total_val = int(score.get("total") or score.get("totalQuestions") or 10)
                    pct_val = float(score.get("percentage") or ((score_val / total_val) * 100 if total_val > 0 else 0.0))
                    supabase_client.table("test_scores").upsert({
                        "id": str(score.get("id")),
                        "user_id": str(score.get("userId")),
                        "test_id": str(score.get("testId")),
                        "score": score_val,
                        "total": total_val,
                        "percentage": round(pct_val, 2),
                        "submitted_at": str(score.get("submittedAt") or score.get("submitted_at") or score.get("date") or datetime.now().isoformat())
                    }, on_conflict="id").execute()
            except Exception as e:
                print("[Supabase test_scores table save notice]:", e)

            # Sync to mock_tests table
            try:
                for test in self.mockTests:
                    supabase_client.table("mock_tests").upsert({
                        "id": str(test.get("id")),
                        "title": str(test.get("title", "")),
                        "category": str(test.get("category", "")),
                        "company_tag": str(test.get("companyTag") or test.get("company_tag") or "General Placement"),
                        "duration_mins": int(test.get("durationMinutes") or test.get("duration_mins") or 30),
                        "pass_percentage": int(test.get("passPercentage") or test.get("pass_percentage") or 70),
                        "question_ids": test.get("questions") or test.get("question_ids") or []
                    }, on_conflict="id").execute()
            except Exception as e:
                print("[Supabase mock_tests table save notice]:", e)

            # Sync to mentorships table
            try:
                for m in self.mentorships:
                    supabase_client.table("mentorships").upsert({
                        "id": str(m.get("id")),
                        "mentor_id": str(m.get("mentorId")),
                        "mentor_name": str(m.get("mentorName")),
                        "mentee_id": str(m.get("menteeId")),
                        "mentee_name": str(m.get("menteeName")),
                        "status": str(m.get("status", "Active")),
                        "next_meeting_date": str(m.get("nextMeetingDate", "")),
                        "logs": m.get("logs", [])
                    }, on_conflict="id").execute()
            except Exception as e:
                print("[Supabase mentorships table save notice]:", e)

            # Sync to resumes table
            try:
                for r in self.resumes:
                    supabase_client.table("resumes").upsert({
                        "id": str(r.get("id")),
                        "user_id": str(r.get("userId")),
                        "file_name": str(r.get("fileName", "")),
                        "file_url": str(r.get("fileUrl", "")),
                        "parsed_skills": r.get("parsedSkills", []),
                        "ats_score": int(r.get("atsScore", 0)),
                        "uploaded_at": str(r.get("uploadedAt", datetime.now().isoformat()))
                    }, on_conflict="id").execute()
            except Exception as e:
                print("[Supabase resumes table save notice]:", e)

            # Sync to hr_practice_questions table
            try:
                for q in self.hrPracticeQuestions:
                    supabase_client.table("hr_practice_questions").upsert({
                        "id": str(q.get("id")),
                        "company_tag": str(q.get("companyTag") or q.get("company_tag") or "General HR"),
                        "question_text": str(q.get("questionText") or q.get("question") or ""),
                        "category": str(q.get("category", "HR")),
                        "is_featured": bool(q.get("isFeatured") if q.get("isFeatured") is not None else q.get("is_featured", True)),
                        "created_at": str(q.get("createdAt") or q.get("created_at") or datetime.now().isoformat())
                    }, on_conflict="id").execute()
            except Exception as e:
                print("[Supabase hr_practice_questions table save notice]:", e)

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

def calculate_user_readiness(user_id: str) -> int:
    u_id = str(user_id)
    test_scores = getattr(db, "testScores", []) or []
    raw_resumes = (getattr(db, "resumeReviews", []) or []) + (getattr(db, "resumes", []) or [])
    all_res_map = {str(r.get("id") or id(r)): r for r in raw_resumes}
    resume_reviews = list(all_res_map.values())
    user_roadmaps = getattr(db, "userRoadmaps", []) or []

    u_tests = [s for s in test_scores if str(s.get("userId")) == u_id]
    u_resumes = [r for r in resume_reviews if str(r.get("userId")) == u_id]

    def get_test_pct(s):
        if not s:
            return 0
        if isinstance(s.get("accuracy"), (int, float)) and s["accuracy"] > 0:
            return float(s["accuracy"])
        tot = max(1, int(s.get("total") or s.get("totalQuestions") or 10))
        score_val = float(s.get("score", 0))
        if "percentage" in s and s["percentage"] is not None:
            return float(s["percentage"])
        return (score_val / tot) * 100

    apt_tests = [s for s in u_tests if "aptitude" in str(s.get("category", "")).lower() or "company" in str(s.get("category", "")).lower()]
    tech_tests = [s for s in u_tests if "technical" in str(s.get("category", "")).lower() or "coding" in str(s.get("category", "")).lower()]

    if apt_tests:
        apt_score = round(sum(get_test_pct(s) for s in apt_tests) / len(apt_tests))
    elif u_tests:
        apt_score = round(sum(get_test_pct(s) for s in u_tests) / len(u_tests))
    else:
        apt_score = 0

    if tech_tests:
        tech_score = round(sum(get_test_pct(s) for s in tech_tests) / len(tech_tests))
    elif u_tests:
        tech_score = round(sum(get_test_pct(s) for s in u_tests) / len(u_tests))
    else:
        tech_score = 0

    if u_resumes:
        ats_score = int(u_resumes[-1].get("atsScore") or u_resumes[-1].get("ats_score") or 82)
    else:
        ats_score = 82

    user_rm = next((r for r in user_roadmaps if str(r.get("userId")) == u_id), None)
    tot_t = 0
    done_t = 0
    if user_rm and isinstance(user_rm.get("modules"), list):
        for m in user_rm["modules"]:
            if isinstance(m, dict) and isinstance(m.get("milestones"), list):
                for ms in m["milestones"]:
                    tot_t += 1
                    if isinstance(ms, dict) and ms.get("completed"):
                        done_t += 1
    domain_pct = round((done_t / tot_t) * 100) if tot_t > 0 else int(user_rm.get("overallProgress", 0) if user_rm else 0)

    if u_tests:
        calc_readiness = round((0.35 * apt_score) + (0.35 * tech_score) + (0.20 * ats_score) + (0.10 * domain_pct))
    else:
        calc_readiness = round((0.20 * ats_score) + (0.10 * domain_pct))

    return min(100, max(0, calc_readiness))
