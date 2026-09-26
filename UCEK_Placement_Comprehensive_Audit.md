# 📋 UCEK Placement Platform (Impulse) — Comprehensive System Audit & Codebase Report

> **Target Platform:** UCEK Unstop Igniters Placement & Career Suite  
> **Audit Scope:** Frontend (React + Vite + Tailwind), Backend (FastAPI + Supabase + Gemini AI), Storage, Security, Data Integrity, and API Architecture.  
> **Status:** Critical Performance & Architectural Bugs Detected

---

## 📊 1. Executive Summary & Scorecard

| Area | Status | Severity | Primary Findings |
| :--- | :---: | :---: | :--- |
| **`localStorage`** | ⚠️ Active | Moderate | Stores JWT token, target drive preference, and roadmap modal state. Plaintext tokens vulnerable to XSS. |
| **Cache Storage API** | ❌ None | Low | Neither Service Worker nor Browser Cache Storage (`window.caches`) is implemented. |
| **Mock Data & Hardcoded Suites** | ⚠️ Heavy | High | Hardcoded mentors, sample resume, question banks, static roadmaps, and synthetic/fake audio analytics. |
| **Mentorship Module** | 🛑 Mock / Facade | Critical | Frontend is a "Coming Soon!" card; backend endpoints have schema mismatch runtime errors (`KeyError: 'mentee'`). |
| **Domain Roadmaps** | ⚠️ In-Memory | High | Milestone checkboxes do not persist to backend database; resets on page reload. |
| **Database Performance** | 🚨 Catastrophic | Blocker | `db.save()` runs 500+ sequential, synchronous HTTP requests to Supabase per single save call. |
| **Security & Secrets** | 🚨 Insecure | Blocker | Hardcoded JWT secret, admin password (`admin`), Supabase anon key, and wildcard regex CORS. |

---

## 💾 2. Storage Audit: LocalStorage, SessionStorage & Cache Storage

### A. `localStorage` Inventory

The frontend explicitly reads and writes to `localStorage` across the following files:

| Key | File & Line Reference | Data Stored | Risk / Catch |
| :--- | :--- | :--- | :--- |
| `ucek_access_token` | `frontend/src/lib/api.ts:12`<br>`frontend/src/context/AppContext.tsx:110` | JWT Auth Bearer Token | Stored in plaintext. If any XSS vulnerability exists, session hijacking is possible. Cleared on logout (`api.ts:228`). |
| `ucek_selected_target_drive` | `frontend/src/context/AppContext.tsx:86-91` | String (e.g. `'TCS Ninja & Digital 2026'`) | User preference for company drive filter; falls back to default if absent. |
| `ucek_domain_confirmed_${userId}` | `frontend/src/pages/DomainRoadmap.tsx:129, 163` | Boolean string (`'true'`) | Suppresses domain selection popup after user chooses a domain. |
| `ucek-theme` | `frontend/src/context/AppContext.tsx:102` | String (`'dark'`) | Theme key; dark mode is hardcoded. |

### B. SessionStorage & Cache Storage API

* **`sessionStorage`**: **Not used** anywhere in the frontend or backend.
* **Browser Cache Storage API (`window.caches`)**: **Not used**. There are no Service Workers, PWA manifests, or offline Workbox caches.
* **Backend File Cache**: In `backend/database.py:101-105`, an old JSON file cache (`.data/db.json`) existed previously. On startup, `db.load()` explicitly deletes this file (`os.remove(DB_FILE)`) and loads state from Supabase.

---

## 🎭 3. Mock Data, Fallbacks & "Illusions"

### A. Hardcoded Frontend Suites

1. **Hardcoded Senior Mentors:**
   * **Location:** `frontend/src/data/mockData.ts:123-157`
   * **Data:** 3 static mentors: Devika Suresh (Google), Rahul Krishna (Texas Instruments), Ananya Pillai (Amazon).
2. **Hardcoded Mentorship Pair:**
   * **Location:** `frontend/src/data/mockData.ts:159-178`
   * **Data:** A fake pair between Devika Suresh & Anand Nair with a hardcoded meeting date (`2026-08-05 (Wed) @ 6:00 PM`) and mock meeting logs.
3. **Hardcoded Demo Users:**
   * **Location:** `frontend/src/data/mockData.ts:13-36`
   * **Data:** Anand Nair (`usr_mentee_1`) and Dr. Suresh Kumar (`usr_admin_1`).
4. **Hardcoded Student Resume Profile:**
   * **Location:** `frontend/src/data/mockData.ts:182-240`
   * **Data:** Complete pre-filled resume for Anand Nair (B.Tech CSE, CGPA 8.4) used as initial state in `AppContext`.
5. **Hardcoded Domain Roadmaps:**
   * **Location:** `frontend/src/data/roadmaps/`
   * **Data:** Static files containing milestone trees for SWE, Data Science & AI, Embedded Systems, Cybersecurity, VLSI, Management, and UI/UX.
6. **Hardcoded Interview Questions:**
   * **Location:** `frontend/src/data/mockData.ts:40-121` & `backend/mock_data.py:7-98`
   * **Data:** 10 static interview questions for TCS, Infosys, Wipro, and Accenture.
7. **Sample Resume & Target Job Descriptions:**
   * **Location:** `frontend/src/pages/AIResumeSuite.tsx:30-99`
   * **Data:** Hardcoded `SAMPLE_RESUME_TEXT` ("HITESH") and 5 static company job descriptions (TCS Digital, Infosys SP, Wipro Elite, Accenture Innovation, UST Global).

### B. Fabricated / Synthetic Metrics ("The Illusions")

1. **HR Interview Speech Analytics are Mathematical Fakes:**
   * **Location:** `frontend/src/pages/HRInterviewSimulator.tsx:180-194`
   * **The Reality:** The microphone audio is sent to Gemini, but the frontend calculates speech metrics using arbitrary math:
     * **WPM (Words Per Minute):** `Math.round(120 + (result.confidenceScore / 100) * 30)` — *Fake!*
     * **Filler Word Count:** `Math.max(0, Math.round((100 - result.confidenceScore) / 25))` — *Fake!*
     * **Filler Words List:** `result.confidenceScore < 70 ? ['um', 'like'] : []` — *Fake!*
     * **Transcript:** Hardcoded string `'AI-analyzed audio response.'` — *The audio is never actually transcribed!*
2. **Dashboard Default Speech Analytics:**
   * **Location:** `backend/routers/ai_suite.py:224-229`
   * **The Reality:** If a student has never attempted an interview, the backend returns fabricated baseline metrics (`wpm: 135, confidenceScore: 92, starFramework: 'Aligned', fillerCount: '0 Detects'`) instead of showing an unattempted/empty state.
3. **Silent Error Swallowing in API:**
   * **Location:** `frontend/src/lib/api.ts:299-311`
   * **The Reality:** `getSpeechAnalyticsApi()` catches all network or backend errors and quietly returns mock data, masking backend failures.
4. **Hardcoded ATS Score Fallback:**
   * **Location:** `backend/database.py:594-597`
   * **The Reality:** If a student has no uploaded resume, the readiness calculation automatically assigns a default ATS score of `82`.

---

## ⚡ 4. Architecture & Integration Disconnects

### 1. Mentorship is a Complete Facade on Frontend
* While `README.md` and `PRODUCT.md` tout a full "1-on-1 Alumni Mentorship" platform, `frontend/src/pages/Mentorship.tsx` is **literally a static "Coming Soon!" landing card**.
* The frontend never calls the backend `/api/mentors` or `/api/mentorship/*` endpoints.

### 2. Roadmap Milestone Progress is Never Saved to Backend
* In `frontend/src/context/AppContext.tsx:283-302`, `toggleMilestone` **only mutates local React state in memory**.
* The backend endpoint `POST /api/roadmap/toggle` in `backend/routers/roadmap.py` is never called.
* **Result:** Every browser refresh or logout wipes out all student roadmap progress.
* **Schema Mismatch:** Backend `DEFAULT_ROADMAPS` uses keys (`"Software Engineering"`) and module format `[{"id": "m1", ...}]`, while the frontend uses `{id: "swe", modules: [{id: "swe_year_1", ...}]}`.

### 3. Mentorship Schema Crash (`KeyError: 'mentee'`)
* In `backend/database.py:271-280`, mentorship records loaded from Supabase have flat keys: `mentorId`, `menteeId`.
* But in `backend/routers/mentorship.py:35`, `get_my_mentorship` checks `m["mentee"]["id"] == user_id`.
* **Result:** When fetching mentorship pairs loaded from Supabase, the backend crashes with an uncaught `KeyError: 'mentee'` (500 Error).

### 4. Non-Existent Gemini Models in AI Suite
* In `backend/ai.py:22`:
  ```python
  SUPPORTED_MODELS = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
  ```
* `gemini-3.6-flash` and `gemini-2.5-flash` **do not exist**. Every AI request fails twice with 404/NotFound errors on Google's API before falling back to `gemini-1.5-flash`, causing unnecessary latency.

### 5. Questions Table Missing from Supabase Sync
* In `backend/database.py`, tests are synced from `mock_tests`, but individual question definitions are never synced from a relational `questions` table in Supabase.
* Questions only exist in an unstructured JSON blob in `app_state`. If that blob desynchronizes, `get_test_details` returns empty quizzes.

---

## 🚨 5. Critical Performance Nightmare: `db.save()`

In `backend/database.py:344-510`:
Whenever **any write operation occurs** (submitting a single quiz score, updating profile, or registering), `db.save()` executes:

```python
for u in self.users: # 245 synchronous HTTP calls to Supabase!
    supabase_client.table("users").upsert(user_payload, on_conflict="email").execute()

for rm in self.userRoadmaps: # 237 synchronous HTTP calls!
    supabase_client.table("user_roadmaps").upsert(...).execute()

for score in self.testScores: # 73 synchronous HTTP calls!
    supabase_client.table("test_scores").upsert(...).execute()
```

> 🚨 **Critical Impact:** Over **550 sequential network requests** are sent to Supabase in a single synchronous FastAPI request. This causes massive request latency (10–30+ seconds), worker timeouts, and server freezes.

---

## 🔒 6. Security Vulnerabilities & Bugs

| Vulnerability | Location | Severity | Description |
| :--- | :--- | :---: | :--- |
| **Hardcoded Supabase Anon Key** | `backend/database.py:48` | **Critical** | A full JWT Supabase key is hardcoded directly in the source code as a fallback string. |
| **Default Admin Credentials** | `backend/database.py:534-551` | **Critical** | Default admin account `unstopignitersucek@gmail.com` is seeded with the hardcoded password `"admin"`. |
| **Hardcoded JWT Secret** | `backend/auth.py:15` | **High** | Defaults to `'ucek_unstop_igniters_placement_platform_secret_2026'`. Anyone knowing this can forge admin tokens. |
| **Hardcoded Admin Passcode** | `backend/routers/auth.py:39` | **High** | Admin signup passcode defaults to `'UCEK_ADMIN_FACULTY_2026'`. |
| **Overly Permissive CORS** | `backend/main.py:47` | **High** | `allow_origin_regex=r"https?://.*"` combined with `allow_credentials=True` allows **any website** to perform authenticated requests. |
| **Demo Login Account Hijacking** | `backend/routers/auth.py:209-210` | **High** | If demo accounts don't exist, `/demo-login` picks `db.users[0]`, logging in as a random real registered student from Supabase! |
| **Insecure Cookie Flag** | `backend/routers/auth.py:124` | **Medium** | Refresh token cookie is issued with `secure=False`, allowing interception over plaintext HTTP. |
| **The 422 Unprocessable Content Bug** | `backend/schemas.py:27` | **Medium** | `LoginRequest.email` uses Pydantic's `EmailStr`. If an admin types `"admin"` instead of a full email, FastAPI returns `422 Unprocessable Content` instead of a 401 error. |

---

## 🛠️ 7. Recommended Action Plan & Priority Fixes

- [ ] **Fix `db.save()` Performance:** Eliminate the full-table iteration loops in `database.py`. Only update the specific modified row directly in Supabase.
- [ ] **Remove Hardcoded Secrets:** Migrate `SUPABASE_KEY`, `JWT_SECRET`, `ADMIN_SECRET_KEY`, and default admin passwords strictly to `.env`.
- [ ] **Correct Gemini Model List:** Update `SUPPORTED_MODELS` in `ai.py` to `["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"]`.
- [ ] **Connect Roadmap Milestones to Backend:** Add `/api/roadmap` and `/api/roadmap/toggle` handlers in `api.ts` and sync checkbox state to `user_roadmaps`.
- [ ] **Fix Mentorship Backend Schema:** Unify flat keys (`mentorId`, `menteeId`) vs nested objects (`mentor: {id}`, `mentee: {id}`) in `mentorship.py`.
- [ ] **Lock Down CORS:** Remove `allow_origin_regex=r"https?://.*"` from `backend/main.py` and restrict strictly to verified frontend domains.
- [ ] **Authenticate Microphone Evaluation:** Provide real audio transcription (e.g. Whisper API or Gemini audio transcription) before displaying WPM, filler words, and speech metrics.
