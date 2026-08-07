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
    readinessScore?: number;
    avatar?: string;
    bio?: string;
  };
  accessToken: string;
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
