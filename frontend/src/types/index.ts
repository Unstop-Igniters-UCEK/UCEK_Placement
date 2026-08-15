export type UserRole = 'mentee' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  year: string;
  branch: string;
  domain: string;
  hasSelectedDomain?: boolean;
  readinessScore: number;
  avatar?: string;
  company?: string; // For placed mentors
  bio?: string;
  isExternal?: boolean;
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
  category: 'Aptitude' | 'Company Drive' | 'Technical' | 'Verbal';
  companyTag?: string;
  durationMinutes: number;
  questionCount: number;
  passPercentage: number;
  description: string;
  questions: Question[];
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
  template: 'ats' | 'modern' | 'academic';
  personal: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn: string;
    github: string;
    summary: string;
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
  overallScore: number;
  atsScore: number;
  impactScore: number;
  formattingScore?: number;
  summary?: string;
  strengths?: string[];
  missingKeywords: string[];
  bulletImprovements: {
    category: string;
    issue: string;
    original: string;
    originalBullet?: string;
    revised: string;
    revisedBullet?: string;
    suggestion: string;
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
