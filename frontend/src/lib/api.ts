/**
 * api.ts — Central API service for the UCEK Placement Platform frontend.
 * All requests to the FastAPI backend go through this file.
 *
 * Base URL is set via VITE_API_BASE_URL in .env (e.g. http://localhost:8000)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BASE_URL || 'http://localhost:8000';

/** Retrieve JWT token stored in sessionStorage by the auth flow. */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('ucek_access_token');
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('ucek_access_token', token);
  // Clear any legacy persistent token from localStorage
  localStorage.removeItem('ucek_access_token');
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('ucek_access_token');
  localStorage.removeItem('ucek_access_token');
}

/** Retrieve JWT token for internal requests. */
function getToken(): string | null {
  return getStoredToken();
}

/** Build Authorization header if a token is available. */
function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

/** Centralized fetch handler that captures 401 Unauthorized and notifies the app. */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    const urlStr = typeof input === 'string' ? input : input.toString();
    if (!urlStr.includes('/api/auth/login') && !urlStr.includes('/api/auth/register')) {
      clearStoredToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ucek:unauthorized'));
      }
    }
  }
  return res;
}

// ─── Health Check ──────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/api/health`);
  return res.json();
}

// ─── Authentication API ───────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password?: string;
  role?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  role?: string;
  year?: string;
  branch?: string;
  domainInterest?: string;
  adminSecurityCode?: string;
}

export interface UserReadinessMetrics {
  score: number | null;
  aptitude: number | null;
  technical: number | null;
  ats: number | null;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    year: string;
    branch: string;
    domainInterest?: string;
    domain?: string;
    hasSelectedDomain?: boolean;
    readinessScore?: number | null;
    readiness?: UserReadinessMetrics;
    avatar?: string;
    bio?: string;
    targetDrive?: string;
  };
  accessToken: string;
}

export async function updateProfileApi(payload: {
  name?: string;
  year?: string;
  branch?: string;
  domainInterest?: string;
  hasSelectedDomain?: boolean;
  bio?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  targetDrive?: string;
}): Promise<AuthResponse['user']> {
  const res = await authFetch(`${BASE_URL}/api/user/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, `Failed to update profile (${res.status})`));
  }

  const data = await res.json();
  return data.user;
}

function parseErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  let msg = fallback;
  if (typeof err.error === 'string' && err.error) msg = err.error;
  else if (typeof err.detail === 'string' && err.detail) msg = err.detail;
  else if (Array.isArray(err.detail) && err.detail.length > 0) {
    msg = err.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
  }

  if (msg.toLowerCase().includes('rate limit exceeded')) {
    return 'Too many attempts in a short time. Please wait a minute before trying again.';
  }
  return msg;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password || '',
      role: payload.role,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, `Login failed (${res.status})`));
  }

  return res.json();
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password || '',
      role: payload.role || 'mentee',
      year: payload.year || '4th Year',
      branch: payload.branch || 'CSE',
      domainInterest: payload.domainInterest || undefined,
      adminSecurityCode: payload.adminSecurityCode || undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, `Registration failed (${res.status})`));
  }

  return res.json();
}

export async function demoLoginApi(role: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string; error?: string })?.error ||
      (err as { detail?: string; error?: string })?.detail ||
      `Demo login failed (${res.status})`
    );
  }

  return res.json();
}

export interface RegistrationStatusResponse {
  student_self_registration_enabled: boolean;
}

/** Check if public student self-registration is enabled. Fails closed (false) on error. */
export async function getRegistrationStatusApi(): Promise<RegistrationStatusResponse> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/registration-status`);
    if (!res.ok) {
      return { student_self_registration_enabled: false };
    }
    return await res.json();
  } catch {
    return { student_self_registration_enabled: false };
  }
}

export async function sendOtpApi(email: string): Promise<{ message: string; otpSent: boolean }> {
  const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, 'Failed to send verification code'));
  }

  return res.json();
}

export async function verifyOtpResetApi(email: string, otpCode: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/verify-otp-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      otpCode: otpCode.trim(),
      newPassword: newPassword,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, 'Invalid OTP code or password reset failed'));
  }

  return res.json();
}

export async function getMeApi(): Promise<{ user: AuthResponse['user'] }> {
  const res = await authFetch(`${BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user session');
  }

  return res.json();
}

export async function getUserReadinessApi(): Promise<UserReadinessMetrics> {
  const res = await authFetch(`${BASE_URL}/api/user/readiness`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!res.ok) {
    return { score: null, aptitude: null, technical: null, ats: null };
  }

  const data = await res.json();
  return data.readiness || { score: null, aptitude: null, technical: null, ats: null };
}

export async function logoutApi(): Promise<void> {
  try {
    await authFetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
  } catch (e) {
    console.warn('Logout API error:', e);
  } finally {
    clearStoredToken();
  }
}

/**
 * Persist a roadmap milestone toggle to the backend database.
 * Called after the optimistic UI update in AppContext.toggleMilestone.
 */
export async function toggleMilestoneApi(
  moduleId: string,
  milestoneId: string,
  completed: boolean
): Promise<void> {
  const res = await authFetch(`${BASE_URL}/api/roadmap/toggle`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ moduleId, milestoneId, completed }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string })?.detail || `Failed to save milestone: ${res.status}`);
  }
}

/**
 * Fetch the authenticated student's personalized roadmap from Supabase via backend.
 */
export async function getRoadmapApi(): Promise<any> {
  const res = await authFetch(`${BASE_URL}/api/roadmap`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  return data.roadmap || null;
}

/**
 * Fetch authentic HR interview questions directly from Supabase hr_practice_questions table.
 */
export async function getHrQuestionsApi(companyTag: string = 'all'): Promise<any[]> {
  const res = await authFetch(`${BASE_URL}/api/ai/hr-questions?companyTag=${encodeURIComponent(companyTag)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return Array.isArray(data.questions) ? data.questions : [];
}

/**
 * Fetch active mentors directly from Supabase users table (where role == 'mentor').
 */
export async function getMentorsApi(): Promise<any[]> {
  const res = await authFetch(`${BASE_URL}/api/mentors`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return Array.isArray(data.mentors) ? data.mentors : [];
}

// ─── AI Suite: HR Interview Analysis ───────────────────────────────────────

export interface InterviewAnalysisRequest {
  question_id?: string;
  questionText: string;
  transcriptText?: string;
  audioBase64?: string;
  mimeType?: string;
  durationSeconds?: number;
}

export interface InterviewEvaluation {
  overallScore: number;       // 0-100
  confidenceScore: number;    // 0-100
  technicalAccuracy: number;  // 0-100
  wpm?: number;
  durationSeconds?: number;
  wordCount?: number;
  fillerCount?: number;
  fillerWords?: string[];
  tone?: string;
  transcript?: string;
  aiFeedback: {
    strengths: string[];
    areasForImprovement: string[];
    idealAnswerSnippet: string;
    structure?: string[];
  };
  betterAnswer?: {
    structure: string[];
    example: string;
  };
}

/**
 * Send a recorded audio answer to the backend Gemini AI for evaluation.
 * Falls back gracefully if the backend is unavailable.
 */
export async function analyzeInterview(
  req: InterviewAnalysisRequest
): Promise<InterviewEvaluation> {
  const res = await authFetch(`${BASE_URL}/api/ai/analyze-interview`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string })?.detail || `Backend error ${res.status}: ${res.statusText}`
    );
  }

  const data = await res.json();
  return data.evaluation as InterviewEvaluation;
}

export interface SpeechAnalyticsResponse {
  hasEvaluations: boolean;
  wpm: number | null;
  confidenceScore: number | null;
  starFramework: string | null;
  fillerCount: string | null;
  totalEvaluations: number;
  featuredPrompts: string[];
}

/**
 * Fetch real speech analytics metrics & practice prompts from the backend.
 * Throws on network errors so the caller can display an appropriate state.
 */
export async function getSpeechAnalyticsApi(): Promise<SpeechAnalyticsResponse> {
  const res = await authFetch(`${BASE_URL}/api/ai/speech-analytics`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch speech analytics: ${res.status}`);
  }

  return await res.json();
}

/**
 * Fetch HR practice questions dynamically from the backend Supabase database.
 */
export async function getHRQuestionsApi(companyTag: string = 'all'): Promise<Array<{
  id: string;
  companyTag: string;
  questionText: string;
  category: string;
  isFeatured?: boolean;
}>> {
  try {
    const res = await authFetch(`${BASE_URL}/api/ai/hr-questions?companyTag=${encodeURIComponent(companyTag)}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.questions || [];
  } catch (err) {
    console.warn('Failed to fetch HR questions from API:', err);
    return [];
  }
}

/**
 * Perform AI ATS Resume Review using the Gemini backend.
 */
export async function reviewResumeApi(payload: {
  resumeText: string;
  jobRole?: string;
}) {
  const res = await authFetch(`${BASE_URL}/api/ai/review-resume`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, `Failed to review resume (${res.status})`));
  }

  const data = await res.json();
  return data.review;
}

/**
 * Match a candidate resume against a Job Description (JD) using Gemini AI.
 */
export async function matchJDApi(payload: {
  jobTitle?: string;
  company?: string;
  jdText: string;
  resumeText: string;
}) {
  const res = await authFetch(`${BASE_URL}/api/ai/match-jd`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, `Failed to match JD (${res.status})`));
  }

  const data = await res.json();
  return data.match;
}

/**
 * Enhance a resume bullet point using the STAR method via Gemini AI.
 */
export async function enhanceBulletApi(payload: {
  bulletText: string;
  targetRole?: string;
}) {
  const res = await authFetch(`${BASE_URL}/api/ai/enhance-bullet`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, `Failed to enhance bullet (${res.status})`));
  }

  return await res.json();
}

/**
 * Parse an uploaded PDF file and return clean plain text from FastAPI backend.
 */
export async function parsePdfApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getStoredToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await authFetch(`${BASE_URL}/api/ai/parse-pdf`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Failed to parse PDF (${res.status})`);
  }

  const data = await res.json();
  return data.text || '';
}

/**
 * Fetch authenticated user's test history from FastAPI / Supabase backend.
 */
export async function getTestHistoryApi(category?: string): Promise<any[]> {
  try {
    const url = category && category !== 'all'
      ? `${BASE_URL}/api/tests/history/my?category=${encodeURIComponent(category)}`
      : `${BASE_URL}/api/tests/history/my`;
    const res = await authFetch(url, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.scores)) return [];
    return data.scores.map((s: any) => ({
      id: String(s.id),
      testId: String(s.test_id || s.testId || ''),
      testTitle: s.test_title || s.testTitle || 'Mock Assessment Drive',
      category: s.category || (s.test_type ? s.test_type.charAt(0).toUpperCase() + s.test_type.slice(1) : 'General'),
      test_type: s.test_type || s.testType || 'general',
      testType: s.test_type || s.testType || 'general',
      target_department_id: s.target_department_id || null,
      isDepartmental: Boolean(s.is_departmental || s.isDepartmental),
      is_departmental: Boolean(s.is_departmental || s.isDepartmental),
      score: Number(s.marks_obtained ?? s.score ?? 0),
      totalQuestions: Number(s.total_marks ?? s.totalQuestions ?? 0),
      accuracy: Number(s.score_percentage ?? s.percentage ?? s.accuracy ?? 0),
      percentage: Number(s.score_percentage ?? s.percentage ?? 0),
      status: s.status || 'submitted',
      passed: Boolean(s.passed ?? (s.score_percentage ? s.score_percentage > 65 : false)),
      timeSpentMinutes: Math.max(1, Math.round((s.timeTakenSec || 0) / 60)),
      date: s.submitted_at ? s.submitted_at.split('T')[0] : (s.submittedAt ? s.submittedAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      submitted_at: s.submitted_at || s.submittedAt,
      userAnswers: s.userAnswers || {},
    }));
  } catch (e) {
    console.warn('Failed to fetch test history from backend:', e);
    return [];
  }
}

export async function deleteTestHistoryApi(): Promise<void> {
  try {
    const res = await authFetch(`${BASE_URL}/api/tests/history/my`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) {
      console.warn('Failed to delete test history from backend');
    }
  } catch (e) {
    console.warn('Network error while deleting test history:', e);
  }
}

/**
 * Submit test attempt to FastAPI backend to persist in central database.
 */
export async function submitTestApi(
  testId: string,
  payload: {
    score: number;
    totalQuestions: number;
    timeTakenSec: number;
    userAnswers?: any;
    testTitle?: string;
    category?: string;
    passed?: boolean;
    percentage?: number;
  }
) {
  try {
    const res = await authFetch(`${BASE_URL}/api/tests/${testId}/submit`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        score: payload.score,
        totalQuestions: payload.totalQuestions,
        timeTakenSec: payload.timeTakenSec,
        testTitle: payload.testTitle,
        category: payload.category,
        passed: payload.passed,
        percentage: payload.percentage,
        userAnswers: Object.entries(payload.userAnswers || {}).map(([qId, opt]) => ({
          questionId: qId,
          selectedOption: Number(opt)
        }))
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Failed to submit test score to backend:', e);
    return null;
  }
}



export const getAdminDashboardStatsApi = async (year?: string, branch?: string) => {
  try {
    let url = BASE_URL + '/api/admin/dashboard-stats';
    const params = new URLSearchParams();
    if (year && year !== 'All Years') params.append('year', year);
    if (branch && branch !== 'All Departments') params.append('branch', branch);
    if (params.toString()) url += '?' + params.toString();
    
    const res = await authFetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return await res.json();
  } catch (error) {
    console.error('getAdminDashboardStatsApi Error:', error);
    return null;
  }
};

export const getAllUsersAdminApi = async () => {
  try {
    const res = await authFetch(`${BASE_URL}/api/admin/users`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch all users');
    return await res.json();
  } catch (error) {
    console.error('getAllUsersAdminApi Error:', error);
    return null;
  }
};

// ─── Quiz Assignment & Exam Hub API Methods ───

export interface MockDrivePracticeSummary {
  total_available: number;
  cleared: number;
}

export async function getMockDrivePracticeSummaryApi(): Promise<MockDrivePracticeSummary> {
  const res = await authFetch(`${BASE_URL}/api/tests/practice-summary`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    return { total_available: 0, cleared: 0 };
  }
  return res.json();
}

export async function getTests(): Promise<{ tests: any[] }> {
  const res = await authFetch(`${BASE_URL}/api/tests`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch tests');
  return res.json();
}

export async function uploadCSVTest(data: {
  title: string;
  duration: number;
  test_type?: string;
  target_dept?: string;
  target_department_code?: string;
  target_year?: any;
  questions: any[];
}): Promise<any> {
  const res = await authFetch(`${BASE_URL}/api/tests/upload-csv-test`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload CSV test' }));
    throw new Error(err.detail || 'Failed to upload CSV test');
  }
  return res.json();
}

export async function startTest(testId: string): Promise<any> {
  const res = await authFetch(`${BASE_URL}/api/tests/${testId}/start`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to start test' }));
    throw new Error(err.detail || 'Failed to start test');
  }
  return res.json();
}

export async function getTestDetails(testId: string): Promise<{ test: any; questions: any[] }> {
  const res = await authFetch(`${BASE_URL}/api/tests/${testId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch test details');
  return res.json();
}

export async function submitQuiz(
  testId: string,
  data: { answers: Record<string, any>; timeTakenSec: number }
): Promise<any> {
  const res = await authFetch(`${BASE_URL}/api/tests/${testId}/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit quiz' }));
    throw new Error(err.detail || 'Failed to submit quiz');
  }
  return res.json();
}

export async function getTestReview(testId: string, attemptId?: string): Promise<any> {
  const url = attemptId
    ? `${BASE_URL}/api/tests/${testId}/review?attempt_id=${encodeURIComponent(attemptId)}`
    : `${BASE_URL}/api/tests/${testId}/review`;
  const res = await authFetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch test review' }));
    throw new Error(err.detail || 'Failed to fetch test review');
  }
  return res.json();
}


// ─── Student Onboarding / Batch User Provisioning API ────────────────────────

export interface BatchCreateUsersPayload {
  emails: string[];
  names?: Record<string, string>;
  year?: string;
  branch?: string;
}

export interface BatchCreateUsersResponse {
  message: string;
  createdCount: number;
  skippedCount: number;
  defaultPassword: string;
  createdUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    year: string;
    branch: string;
    readinessScore?: number;
  }>;
}

export async function batchCreateUsers(
  payload: BatchCreateUsersPayload
): Promise<BatchCreateUsersResponse> {
  const res = await authFetch(`${BASE_URL}/api/admin/users/batch-create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      parseErrorMessage(
        err,
        `Failed to provision student accounts (${res.status})`
      )
    );
  }

  return res.json();
}

export interface BatchCSVUser {
  Name?: string;
  email_id: string;
  password?: string;
  dept: string;
  year?: string;
}

export interface BatchCSVCreateResponse {
  message: string;
  createdCount: number;
  skippedCount: number;
  createdUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    year: string;
    branch: string;
  }>;
}

export async function batchCSVCreateUsers(
  users: BatchCSVUser[]
): Promise<BatchCSVCreateResponse> {
  const res = await authFetch(`${BASE_URL}/api/admin/users/batch-csv-create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ users }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      parseErrorMessage(
        err,
        `Failed to provision CSV student batch (${res.status})`
      )
    );
  }

  return res.json();
}

export async function deleteMockTest(testId: string): Promise<any> {
  const res = await authFetch(`${BASE_URL}/api/tests/${testId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete mock test' }));
    throw new Error(err.detail || 'Failed to delete mock test');
  }
  return res.json();
}

/** Admin: Read current student self-registration setting from PostgreSQL. */
export async function getAdminRegistrationSettingApi(): Promise<RegistrationStatusResponse> {
  const res = await authFetch(`${BASE_URL}/api/admin/settings/registration`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, `Failed to load registration setting (${res.status})`));
  }
  return res.json();
}

/** Admin: Update student self-registration setting in PostgreSQL. */
export async function updateAdminRegistrationSettingApi(
  enabled: boolean
): Promise<{ message: string; student_self_registration_enabled: boolean }> {
  const res = await authFetch(`${BASE_URL}/api/admin/settings/registration`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, `Failed to update registration setting (${res.status})`));
  }
  return res.json();
}

export const api = {
  getTests,
  getMockDrivePracticeSummaryApi,
  uploadCSVTest,
  startTest,
  getTestDetails,
  submitQuiz,
  getTestReview,
  deleteMockTest,
};




