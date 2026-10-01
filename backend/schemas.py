"""
schemas.py — Pydantic request/response models for Impulse UCEK Placement Suite.
Aligned with the new Supabase/PostgreSQL schema (Impulse_DB_Design.md).
"""

import re
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any


def sanitize_text(text: Optional[str]) -> Optional[str]:
    if text is None:
        return None
    clean = re.sub(r'<[^>]*>', '', text).strip()
    return clean


def parse_year_int(val: Any) -> Optional[int]:
    if val is None:
        return None
    if isinstance(val, int):
        return val if val in (1, 2, 3, 4) else None
    s = str(val).strip().lower()
    for digit in ("1", "2", "3", "4"):
        if digit in s:
            return int(digit)
    return None


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: Optional[str] = "student"
    # For students registering themselves
    department_code: Optional[str] = None   # e.g. "CSE", "IT", "ECE"
    branch: Optional[str] = None            # Frontend compatibility alias
    year: Optional[Any] = None              # Accepts 1-4 or "4th Year"
    domainInterest: Optional[str] = None
    domain: Optional[str] = None
    # Admin self-registration
    adminSecurityCode: Optional[str] = None

    @validator('name')
    def validate_name(cls, v):
        return sanitize_text(v)

    def resolved_year(self) -> Optional[int]:
        return parse_year_int(self.year)

    def resolved_dept_code(self) -> Optional[str]:
        code = self.department_code or self.branch
        if not code:
            return None
        code_str = str(code).strip().upper()
        if code_str in ("CS", "COMPUTER SCIENCE", "COMPUTER SCIENCE AND ENGINEERING"):
            return "CSE"
        if code_str in ("INFORMATION TECHNOLOGY",):
            return "IT"
        if code_str in ("ELECTRONICS", "ELECTRONICS AND COMMUNICATION ENGINEERING"):
            return "ECE"
        return code_str


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None   # "student" or "admin" — enforced for tab isolation


class SendOTPRequest(BaseModel):
    email: EmailStr


class VerifyOTPResetRequest(BaseModel):
    email: EmailStr
    otpCode: str = Field(..., min_length=6, max_length=6)
    newPassword: str = Field(..., min_length=6, max_length=128)


class DemoLoginRequest(BaseModel):
    role: str


class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(..., min_length=1, max_length=128)
    newPassword: str = Field(..., min_length=6, max_length=128)
    confirmPassword: str = Field(..., min_length=6, max_length=128)


# ─── Profile ──────────────────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    """Students can edit name, department_code, and year only."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    department_code: Optional[str] = None   # e.g. "CSE"
    branch: Optional[str] = None            # Frontend compatibility alias
    year: Optional[Any] = None              # Accepts 1-4 or "4th Year"

    # Domain selection
    domain_id: Optional[str] = None         # UUID
    domain: Optional[str] = None            # Domain name / slug
    domainInterest: Optional[str] = None    # Frontend compatibility alias
    hasSelectedDomain: Optional[bool] = None

    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            clean = sanitize_text(v)
            if not clean:
                raise ValueError("Name cannot be empty")
            return clean
        return None

    def resolved_year(self) -> Optional[int]:
        return parse_year_int(self.year)

    def resolved_dept_code(self) -> Optional[str]:
        code = self.department_code or self.branch
        if not code:
            return None
        code_str = str(code).strip().upper()
        if code_str in ("CS", "COMPUTER SCIENCE", "COMPUTER SCIENCE AND ENGINEERING"):
            return "CSE"
        if code_str in ("INFORMATION TECHNOLOGY",):
            return "IT"
        if code_str in ("ELECTRONICS", "ELECTRONICS AND COMMUNICATION ENGINEERING"):
            return "ECE"
        return code_str

    def resolved_domain_identifier(self) -> Optional[str]:
        return self.domain_id or self.domainInterest or self.domain


# ─── Mock Tests ───────────────────────────────────────────────────────────────

class CSVQuestionRow(BaseModel):
    """Question row from CSV upload — accepts both option_a/b/c/d and legacy options-list format."""
    question: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    # Legacy: 4-element options list [A, B, C, D]
    options: Optional[List[str]] = None
    correct_option: Optional[str] = None       # "A", "B", "C", "D" (new)
    correctOptionIndex: Optional[int] = None   # 0/1/2/3 (legacy)
    explanation: Optional[str] = ""

    def resolved_option_a(self) -> str:
        if self.option_a:
            return self.option_a
        if self.options and len(self.options) > 0:
            return self.options[0]
        return ""

    def resolved_option_b(self) -> str:
        if self.option_b:
            return self.option_b
        if self.options and len(self.options) > 1:
            return self.options[1]
        return ""

    def resolved_option_c(self) -> str:
        if self.option_c:
            return self.option_c
        if self.options and len(self.options) > 2:
            return self.options[2]
        return ""

    def resolved_option_d(self) -> str:
        if self.option_d:
            return self.option_d
        if self.options and len(self.options) > 3:
            return self.options[3]
        return ""

    def resolved_correct_option(self) -> str:
        if self.correct_option and self.correct_option.strip().upper() in ("A", "B", "C", "D"):
            return self.correct_option.strip().upper()
        if self.correctOptionIndex is not None:
            idx = int(self.correctOptionIndex)
            return {0: "A", 1: "B", 2: "C", 3: "D"}.get(idx, "A")
        return "A"


class UploadCSVTestRequest(BaseModel):
    title: str
    duration_minutes: Optional[int] = None
    duration: Optional[int] = None                          # Legacy alias
    test_type: str = "aptitude"                             # "aptitude", "technical", "general"
    target_department_code: Optional[str] = None            # e.g. "CSE" (new)
    target_dept: Optional[str] = None                       # Legacy alias
    target_year: Optional[Any] = None                       # None → all years
    questions: List[CSVQuestionRow]

    def resolved_duration(self) -> int:
        return int(self.duration_minutes or self.duration or 30)

    def resolved_dept_code(self) -> Optional[str]:
        code = self.target_department_code or self.target_dept
        if not code or str(code).lower() in ("all", "all departments", "none", ""):
            return None
        code_str = str(code).strip().upper()
        if "CS" in code_str or "COMPUTER" in code_str:
            return "CSE"
        if "IT" in code_str or "INFORMATION" in code_str:
            return "IT"
        if "ECE" in code_str or "ELECTRONIC" in code_str:
            return "ECE"
        if "EEE" in code_str or "ELECTRICAL" in code_str:
            return "EEE"
        if "MECH" in code_str:
            return "MECH"
        if "CIVIL" in code_str:
            return "CIVIL"
        return code_str

    def resolved_year(self) -> Optional[int]:
        val = self.target_year
        if val is None:
            return None
        if isinstance(val, int):
            return val if val in (1, 2, 3, 4) else None
        s = str(val).strip().lower()
        if "all" in s or s == "":
            return None
        for digit in ("1", "2", "3", "4"):
            if digit in s:
                return int(digit)
        return None


class StartTestRequest(BaseModel):
    pass  # no body needed — test_id in path, student from token


class TerminateTestRequest(BaseModel):
    attempt_id: Optional[str] = None
    reason: Optional[str] = "violation"  # "violation" | "fullscreen_exit" | "timeout"


class SubmitTestRequest(BaseModel):
    """
    Flexible answer format — accepts:
      - {question_id: "A"|"B"|"C"|"D"}    (letter format, new)
      - {question_id: 0|1|2|3}             (integer index, legacy frontend format)
      - userAnswers: [{questionId, selectedOption}]
    """
    answers: Optional[Dict[str, Any]] = None
    userAnswers: Optional[Any] = None
    time_taken_seconds: Optional[int] = 0
    timeTakenSec: Optional[int] = None   # Legacy frontend alias
    testTitle: Optional[str] = None
    category: Optional[str] = None
    passed: Optional[bool] = None
    percentage: Optional[float] = None
    score: Optional[int] = None
    totalQuestions: Optional[int] = None

    def resolved_answers(self) -> Dict[str, Any]:
        ans = {}
        if isinstance(self.answers, dict):
            ans.update(self.answers)
        if isinstance(self.userAnswers, list):
            for item in self.userAnswers:
                if isinstance(item, dict) and "questionId" in item:
                    ans[str(item["questionId"])] = item.get("selectedOption")
        elif isinstance(self.userAnswers, dict):
            ans.update(self.userAnswers)
        return ans


# ─── Roadmap ──────────────────────────────────────────────────────────────────

class ToggleRoadmapItemRequest(BaseModel):
    roadmap_item_id: Optional[str] = None
    milestoneId: Optional[str] = None
    moduleId: Optional[str] = None
    completed: bool

    def resolved_item_id(self) -> str:
        return self.roadmap_item_id or self.milestoneId or ""


class SelectDomainRequest(BaseModel):
    domain_id: Optional[str] = None
    domain: Optional[str] = None
    domainName: Optional[str] = None

    def resolved_identifier(self) -> str:
        return self.domain_id or self.domain or self.domainName or ""


# ─── AI Suite ─────────────────────────────────────────────────────────────────

class ReviewResumeRequest(BaseModel):
    resumeText: str
    jobRole: Optional[str] = "Software Engineer"
    domain_id: Optional[str] = None   # student's current domain UUID


class MatchJDRequest(BaseModel):
    jobTitle: Optional[str] = "Software Engineer"
    company: Optional[str] = "Target Employer"
    jdText: str
    resumeText: str


class EnhanceBulletRequest(BaseModel):
    bulletText: str
    targetRole: Optional[str] = "Software Engineer"


class AnalyzeInterviewRequest(BaseModel):
    question_id: Optional[str] = None
    questionText: str
    transcriptText: Optional[str] = None
    transcript: Optional[str] = None
    audioBase64: Optional[str] = None
    mimeType: Optional[str] = "audio/webm"
    durationSeconds: Optional[float] = None


# ─── Admin ────────────────────────────────────────────────────────────────────

class CreateStudentRequest(BaseModel):
    """Admin individual student creation."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    department_code: str      # "CSE", "IT", "ECE"
    year: int                 # 1–4
    password: str = Field(..., min_length=6, max_length=128)

    @validator('year')
    def validate_year(cls, v):
        if v not in (1, 2, 3, 4):
            raise ValueError("Year must be 1, 2, 3, or 4")
        return v


class BatchCSVUser(BaseModel):
    name: Optional[str] = None
    email: str
    department_code: str = "CSE"
    year: Optional[int] = 4
    password: Optional[str] = None


class BatchCSVCreateRequest(BaseModel):
    users: List[Dict[str, Any]]


# ─── Resume Builder ───────────────────────────────────────────────────────────

class ResumeSkillItem(BaseModel):
    skill: Optional[str] = None
    items: Optional[str] = None
    category: Optional[str] = None
    sort_order: Optional[int] = 0


class ResumeProjectItem(BaseModel):
    title: Optional[str] = "Project"
    description: Optional[str] = None
    technologies: Optional[str] = None
    techStack: Optional[str] = None
    project_url: Optional[str] = None
    link: Optional[str] = None
    bullets: Optional[List[str]] = None
    sort_order: Optional[int] = 0


class ResumeExperienceItem(BaseModel):
    entry_type: Optional[str] = "experience"   # "experience" or "leadership"
    organization: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    position: Optional[str] = None
    description: Optional[str] = None
    bullets: Optional[List[str]] = None
    start_date: Optional[Any] = None
    startDate: Optional[Any] = None
    end_date: Optional[Any] = None
    endDate: Optional[Any] = None
    is_current: Optional[bool] = False
    isCurrent: Optional[bool] = False
    sort_order: Optional[int] = 0


class ResumeEducationItem(BaseModel):
    institution: Optional[str] = "University"
    degree: Optional[str] = "Degree"
    field_of_study: Optional[str] = None
    fieldOfStudy: Optional[str] = None
    start_year: Optional[Any] = None
    startDate: Optional[Any] = None
    end_year: Optional[Any] = None
    endDate: Optional[Any] = None
    grade: Optional[str] = None
    gpa: Optional[str] = None
    sort_order: Optional[int] = 0


class ResumeCertificationItem(BaseModel):
    name: Optional[str] = "Certification"
    issuer: Optional[str] = None
    issue_date: Optional[Any] = None
    credential_url: Optional[str] = None
    sort_order: Optional[int] = 0


class ResumeAchievementItem(BaseModel):
    title: Optional[str] = "Achievement"
    description: Optional[str] = None
    sort_order: Optional[int] = 0


class SaveResumeRequest(BaseModel):
    fullName: Optional[str] = None
    name: Optional[str] = None
    summary: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    linkedIn: Optional[str] = None
    github_url: Optional[str] = None
    github: Optional[str] = None
    portfolio_url: Optional[str] = None
    portfolio: Optional[str] = None
    template_type: Optional[str] = "ats"
    template: Optional[str] = None
    source_type: Optional[str] = "builder"
    skills: Optional[List[Any]] = None
    projects: Optional[List[Any]] = None
    experience: Optional[List[Any]] = None
    education: Optional[List[Any]] = None
    certifications: Optional[List[Any]] = None
    achievements: Optional[List[Any]] = None


# ─── Platform Settings ────────────────────────────────────────────────────────

class UpdateRegistrationSettingRequest(BaseModel):
    enabled: bool
