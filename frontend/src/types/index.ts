export type UserRole = 'mentee' | 'admin';

export interface UserReadinessMetrics {
  score: number | null;
  aptitude: number | null;
  technical: number | null;
  ats: number | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  year: string;
  branch: string;
  domain?: string | null;
  domain_id?: string | null;
  hasSelectedDomain?: boolean;
  targetDrive?: string | null;
  readinessScore?: number | null;
  readiness?: UserReadinessMetrics;
  avatar?: string;
  company?: string; // For placed mentors
  bio?: string;
  isExternal?: boolean;
  must_change_password?: boolean;
}

export interface AdminPasswordResetRequest {
  id: string;
  student_id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  created_at: string;
  status: string;
}


export interface Milestone {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  completed: boolean;
  keyConcepts: string[];
  resources: {
    name: string;
    type: 'doc' | 'video' | 'practice';
    url: string;
  }[];
}

export interface Module {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  milestones: Milestone[];
}

export interface DomainRoadmap {
  id: string;
  name: string;
  description: string;
  modules: Module[];
}

export interface Question {
  id: string;
  title: string;
  type: 'Technical' | 'Aptitude' | 'Logical' | 'Verbal' | 'Company-Specific';
  companyTag?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface MockTest {
  id: string;
  title: string;
  category: 'Aptitude' | 'Technical' | 'General';
  companyTag?: string;
  company_tag?: string;
  durationMinutes: number;
  durationMins?: number;
  duration_mins?: number;
  questionCount: number;
  totalQuestions?: number;
  passPercentage: number;
  pass_percentage?: number;
  description: string;
  questions: any[];
  targetDept?: string;
  target_dept?: string;
  targetYear?: string;
  target_year?: string;
}

export interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  category: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  passed: boolean;
  timeSpentMinutes: number;
  date: string;
  userAnswers: Record<string, number>;
  test_type?: string;
  testType?: string;
  target_department_id?: string | null;
  isDepartmental?: boolean;
  is_departmental?: boolean;
  status?: string;
  submitted_at?: string;
  submittedAt?: string;
}

export interface InterviewQuestion {
  id: string;
  questionText: string;
  category: 'HR & Behavioral' | 'Technical' | 'Situational' | 'Company-Specific';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  companyTag?: string;
  suggestedAnswer: string;
}

export interface InterviewFeedback {
  wpm: number;
  fillerCount: number;
  fillerWords: string[];
  confidenceScore: number; // 0-100
  tone: string;
  overallRating: number; // 1-10
  strengths: string[];
  improvements: string[];
  clarityScore: number;
  relevanceScore: number;
  sampleIdealResponse: string;
  transcript: string;
}

export interface SeniorMentor {
  id: string;
  name: string;
  avatar: string;
  role: string; // e.g. "SDE-1"
  company: string; // e.g. "Google"
  domain: string;
  bio: string;
  rating: number; // e.g. 4.9
  availability: string; // e.g. "2 hrs/week"
}

export interface CheckInLog {
  id: string;
  date: string;
  topic: string;
  feedback: string;
  actionItems: string[];
}

export interface MentorshipPair {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorCompany: string;
  mentorRole: string;
  menteeId: string;
  menteeName: string;
  status: 'Pending' | 'Active';
  nextMeetingDate?: string;
  logs: CheckInLog[];
}

export interface ResumeData {
  template: 'ats' | 'modern';
  personal: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn: string;
    github: string;
    summary: string;
    avatar?: string;
  };
  education: {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }[];
  experience: {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    bullets: string[];
  }[];
  projects: {
    id: string;
    title: string;
    techStack: string;
    description: string;
    link: string;
    bullets: string[];
  }[];
  skills: {
    id: string;
    category: string;
    items: string;
  }[];
  certifications: string[];
}

export interface ResumeReviewResult {
  ats_score: number;
  recruiter_assessment: string;
  strengths: string[];
  recommended_keywords: string[];
  bullet_recommendations: {
    category: string;
    original: string;
    revised: string;
    reason: string;
  }[];
}

export interface JDMatchResult {
  matchPercentage: number;
  interviewChance: number;
  matchingSkills: string[];
  missingSkills: string[];
  missingKeywords?: string[];
  suggestions?: string[];
  tailoredBullets: string[];
  summary?: string;
}

export const EMPTY_RESUME_DATA: ResumeData = {
  template: 'ats',
  personal: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    github: '',
    summary: ''
  },
  education: [],
  experience: [],
  projects: [],
  skills: [],
  certifications: []
};

