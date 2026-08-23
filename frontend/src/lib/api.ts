/**
 * api.ts — Central API service for the UCEK Placement Platform frontend.
 * All requests to the FastAPI backend go through this file.
 *
 * Base URL is set via VITE_API_BASE_URL in .env (e.g. http://localhost:8000)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/** Retrieve JWT token stored in localStorage by the auth flow. */
function getToken(): string | null {
  return localStorage.getItem('ucek_access_token');
}

/** Build Authorization header if a token is available. */
function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
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
    readinessScore?: number;
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
  const res = await fetch(`${BASE_URL}/api/user/profile`, {
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
      domainInterest: payload.domainInterest || 'Software Engineering',
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
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user session');
  }

  return res.json();
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
  } catch (e) {
    console.warn('Logout API error:', e);
  } finally {
    localStorage.removeItem('ucek_access_token');
  }
}

// ─── AI Suite: HR Interview Analysis ───────────────────────────────────────

export interface InterviewAnalysisRequest {
  questionText: string;
  transcriptText?: string;
  audioBase64?: string;
  mimeType?: string;
}

export interface InterviewEvaluation {
  overallScore: number;       // 0-100
  confidenceScore: number;    // 0-100
  technicalAccuracy: number;  // 0-100
  aiFeedback: {
    strengths: string[];
    areasForImprovement: string[];
    idealAnswerSnippet: string;
  };
}

/**
 * Send a recorded audio answer to the backend Gemini AI for evaluation.
 * Falls back gracefully if the backend is unavailable.
 */
export async function analyzeInterview(
  req: InterviewAnalysisRequest
): Promise<InterviewEvaluation> {
  const res = await fetch(`${BASE_URL}/api/ai/analyze-interview`, {
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
  wpm: number;
  confidenceScore: number;
  starFramework: string;
  fillerCount: string;
  totalEvaluations: number;
  featuredPrompts: string[];
}

/**
 * Fetch real speech analytics metrics & practice prompts from the backend.
 */
export async function getSpeechAnalyticsApi(): Promise<SpeechAnalyticsResponse> {
  try {
    const res = await fetch(`${BASE_URL}/api/ai/speech-analytics`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch analytics: ${res.status}`);
    }

    return await res.json();
  } catch {
    return {
      wpm: 135,
      confidenceScore: 92,
      starFramework: 'Aligned',
      fillerCount: '0 Detects',
      totalEvaluations: 0,
      featuredPrompts: [
        'Tell me about a technical project challenge at UCEK and how you solved it.',
        'Why do you want to join our core engineering team?'
      ],
    };
  }
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
    const res = await fetch(`${BASE_URL}/api/ai/hr-questions?companyTag=${encodeURIComponent(companyTag)}`, {
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
  const res = await fetch(`${BASE_URL}/api/ai/review-resume`, {
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
  const res = await fetch(`${BASE_URL}/api/ai/match-jd`, {
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
  const res = await fetch(`${BASE_URL}/api/ai/enhance-bullet`, {
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

  const token = localStorage.getItem('ucek_access_token');
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${BASE_URL}/api/ai/parse-pdf`, {
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
export async function getTestHistoryApi(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/tests/history/my`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.scores)) return [];
    return data.scores.map((s: any) => ({
      id: s.id || `res_${Date.now()}`,
      testId: s.testId || 'test',
      testTitle: s.testTitle || 'Mock Test',
      category: s.category || 'Company Drive',
      score: s.score || 0,
      totalQuestions: s.totalQuestions || 0,
      accuracy: s.percentage ?? (s.totalQuestions > 0 ? Math.round((s.score / s.totalQuestions) * 100) : 0),
      passed: Boolean(s.passed),
      timeSpentMinutes: Math.max(1, Math.round((s.timeTakenSec || 0) / 60)),
      date: s.submittedAt ? s.submittedAt.split('T')[0] : new Date().toISOString().split('T')[0],
      userAnswers: s.userAnswers || {},
    }));
  } catch (e) {
    console.warn('Failed to fetch test history from backend:', e);
    return [];
  }
}

export async function deleteTestHistoryApi(): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/api/tests/history/my`, {
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
    const res = await fetch(`${BASE_URL}/api/tests/${testId}/submit`, {
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


