import html
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any

def sanitize_text(text: Optional[str]) -> Optional[str]:
    if text is None:
        return None
    # Strip HTML tags & escape special characters
    clean = html.escape(text.strip())
    return clean

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: Optional[str] = "mentee"
    year: Optional[str] = "3rd Year"
    branch: Optional[str] = "Computer Science & Engg"
    domainInterest: Optional[str] = "Software Engineering"
    adminSecurityCode: Optional[str] = None

    @validator('name')
    def validate_name(cls, v):
        return sanitize_text(v)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPResetRequest(BaseModel):
    email: EmailStr
    otpCode: str = Field(..., min_length=6, max_length=6)
    newPassword: str = Field(..., min_length=6, max_length=128)

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    newPassword: str = Field(..., min_length=6, max_length=128)

class DemoLoginRequest(BaseModel):
    role: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    year: Optional[str] = None
    branch: Optional[str] = None
    domainInterest: Optional[str] = None
    hasSelectedDomain: Optional[bool] = None
    bio: Optional[str] = None
    linkedInUrl: Optional[str] = None
    githubUrl: Optional[str] = None

class ToggleMilestoneRequest(BaseModel):
    moduleId: str
    milestoneId: str
    completed: bool

class UserAnswer(BaseModel):
    questionId: str
    selectedOption: int

class SubmitTestRequest(BaseModel):
    userAnswers: List[UserAnswer]
    timeTakenSec: int

class RequestMentorRequest(BaseModel):
    mentorId: str
    domain: Optional[str] = None

class AddCheckInLogRequest(BaseModel):
    pairId: str
    topic: str
    mentorNotes: str
    actionItems: List[str]

class ReviewResumeRequest(BaseModel):
    resumeText: str
    jobRole: Optional[str] = "Software Engineer"

class MatchJDRequest(BaseModel):
    jobTitle: Optional[str] = "Software Engineer"
    company: Optional[str] = "Target Employer"
    jdText: str
    resumeText: str

class EnhanceBulletRequest(BaseModel):
    bulletText: str
    targetRole: Optional[str] = "Software Engineer"

class AnalyzeInterviewRequest(BaseModel):
    questionId: Optional[str] = None
    questionText: str
    transcriptText: Optional[str] = None
    transcript: Optional[str] = None
    audioBase64: Optional[str] = None
    mimeType: Optional[str] = "audio/webm"

class CreateQuestionRequest(BaseModel):
    title: str
    type: str
    difficulty: str
    options: List[str]
    correctOptionIndex: int
    explanation: str
    companyTag: Optional[str] = None

class UpdateRoleRequest(BaseModel):
    userId: str
    role: str

class CSVQuestionRow(BaseModel):
    question: Optional[str] = None
    title: Optional[str] = None
    options: List[str]
    correctOptionIndex: int
    explanation: Optional[str] = ""

class UploadCSVTestRequest(BaseModel):
    title: str
    duration: int
    target_dept: Optional[str] = "All"
    targetDept: Optional[str] = None
    target_year: Optional[str] = "All"
    targetYear: Optional[str] = None
    questions: List[CSVQuestionRow]
