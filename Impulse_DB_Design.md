# Impulse — Database Design

## 1. Purpose

This document defines the database design for the Impulse — UCEK Placement Suite.

The database is the **single source of truth** for all dynamic application data.

### Non-negotiable data rules

- No mock data as a source of truth.
- No hardcoded application records.
- No local JSON/database replacement.
- No `localStorage` or `sessionStorage` as a substitute for database persistence.
- No fabricated fallback values when a database/API request fails.
- No frontend in-memory data as the authoritative source for persisted application state.
- All dynamic data must be fetched from and persisted through the backend/database.
- API failures must surface as real errors or unavailable states rather than silently returning fake data.

The intended architecture is:

`React Frontend → FastAPI Backend → Supabase/PostgreSQL`

Supabase Storage is used for uploaded files such as resumes/photos; PostgreSQL stores the corresponding storage paths.

---

## 2. User Roles

There are currently two user types:

- `student`
- `admin`

Mentor functionality is deferred and is not included in this schema.

---

## 3. Core Tables

The database contains the following primary areas:

1. Users and student profiles
2. Departments and domains
3. Domain roadmaps and roadmap progress
4. Mock tests, questions, attempts, and answers
5. Student resumes and resume sections
6. AI resume reviews
7. HR practice questions and interview attempts

---

# 4. Table: `users`

Stores authentication and account-level information for all users.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | TEXT | Required |
| `email` | CITEXT / TEXT | Required, unique case-insensitively |
| `password_hash` | TEXT | Required; never store plaintext passwords |
| `role` | ENUM / TEXT | `student` or `admin` |
| `is_active` | BOOLEAN | Default `true` |
| `must_change_password` | BOOLEAN | Default `false`; admin-onboarded students start as `true` |
| `password_changed_at` | TIMESTAMPTZ | Nullable |
| `created_at` | TIMESTAMPTZ | Required, default current timestamp |
| `updated_at` | TIMESTAMPTZ | Required, auto-updated |

### Constraints

- Email must be unique regardless of letter casing.
- Role must be one of `student`, `admin`.
- Password is stored only as a secure hash.

### Indexes

- Unique index on normalized/case-insensitive email.
- Index on `(role, is_active)`.

---

# 5. Table: `departments`

Stores academic departments.

Current departments:

- CSE
- IT
- ECE

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `code` | TEXT | Required, unique |
| `name` | TEXT | Required |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` | TIMESTAMPTZ | Required |
| `updated_at` | TIMESTAMPTZ | Required |

The table is intentionally separate so department names/codes can be changed later without redesigning the student table.

### Indexes

- Unique index on `code`.
- Index on `is_active`.

---

# 6. Table: `domains`

Stores the career/preparation domains available to students.

Current domains:

- Software Engineering
- Backend Engineering
- UI/UX
- Video Editing
- Graphics Designing
- Cybersecurity

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | TEXT | Required, unique |
| `slug` | TEXT | Required, unique |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` | TIMESTAMPTZ | Required |
| `updated_at` | TIMESTAMPTZ | Required |

### Indexes

- Unique index on `name`.
- Unique index on `slug`.
- Index on `is_active`.

---

# 7. Table: `student_profiles`

Stores student-specific academic and placement information.

| Column | Type | Constraints / Notes |
|---|---|---|
| `user_id` | UUID | Primary key + FK → `users.id` |
| `department_id` | UUID | Required; FK → `departments.id` |
| `year` | SMALLINT | Required; must be 1, 2, 3, or 4 |
| `domain_id` | UUID | Nullable; FK → `domains.id` |
| `readiness_score` | NUMERIC(5,2) | Backend-calculated snapshot, 0–100 |
| `readiness_calculated_at` | TIMESTAMPTZ | Nullable |
| `onboarding_source` | ENUM / TEXT | `admin` or `self` |
| `onboarded_by` | UUID | Nullable; FK → `users.id` (admin) |
| `last_mock_test_notifications_seen_at` | TIMESTAMPTZ | Nullable; timestamp when student last consumed mock test notifications |
| `created_at` | TIMESTAMPTZ | Required |
| `updated_at` | TIMESTAMPTZ | Required |

### Important behavior

- Student can edit `name`, department, and year.
- Email and role are read-only for the student.
- Department/year changes affect current profile and future test targeting, but do **not** modify historical attempts, interview records, or resume reviews.
- `domain_id` can initially be `NULL` until a student selects a domain.
- `readiness_score` is a **derived snapshot**, not the source of truth.
- The backend recalculates readiness whenever a relevant aptitude attempt, technical attempt, or current-domain ATS review changes.
- Admin student lists can read this snapshot directly without recalculating readiness per row.

### Indexes

- Index on `department_id`.
- Index on `domain_id`.
- Index on `readiness_score`.

---

# 8. Readiness Calculation

Readiness consists of three components:

- Aptitude
- Technical
- ATS

## 8.1 Aptitude Score

```text
AVG(score_percentage)
```

where all **submitted aptitude attempts** are included.

Retakes are included as separate attempts.

Example:

```text
Attempt 1 = 60%
Attempt 2 = 70%
Attempt 3 = 80%

Aptitude = (60 + 70 + 80) / 3 = 70%
```

## 8.2 Technical Score

```text
AVG(score_percentage)
```

where all **submitted technical attempts** are included.

## 8.3 ATS Score

Uses the student's latest applicable AI resume review score.

If no applicable review exists:

```text
ATS = 0
```

## 8.4 Overall Readiness

Simple average:

```text
Readiness = (Aptitude + Technical + ATS) / 3
```

Missing components are treated as `0`.

Therefore, a new student with no test or resume-review data has:

```text
Readiness = 0
```

The resulting value is stored in `student_profiles.readiness_score` as a backend-maintained snapshot.

---

# 9. Domain Roadmap

Roadmap definitions are permanent product data but must still be stored in PostgreSQL rather than being treated as frontend static/mock data.

## Table: `roadmap_items`

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `domain_id` | UUID | Required; FK → `domains.id` |
| `parent_id` | UUID | Nullable; self-FK → `roadmap_items.id` |
| `title` | TEXT | Required |
| `description` | TEXT | Nullable |
| `item_type` | ENUM / TEXT | `pathway`, `level`, or `objective` |
| `sort_order` | INTEGER | Required |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` | TIMESTAMPTZ | Required |
| `updated_at` | TIMESTAMPTZ | Required |

The self-referencing `parent_id` supports hierarchical roadmap structures.

### Indexes

- Index on `domain_id`.
- Index on `(domain_id, parent_id, sort_order)`.

---

# 10. Table: `student_roadmap_progress`

Stores completion state for roadmap items.

| Column | Type | Constraints / Notes |
|---|---|---|
| `student_id` | UUID | FK → `student_profiles.user_id` |
| `roadmap_item_id` | UUID | FK → `roadmap_items.id` |
| `completed` | BOOLEAN | Default `false` |
| `completed_at` | TIMESTAMPTZ | Nullable |
| `updated_at` | TIMESTAMPTZ | Required |

### Primary key

```text
(student_id, roadmap_item_id)
```

### Domain switch behavior

A student selects one active domain.

When the student changes domain:

1. Warn the user in the UI before switching.
2. Backend updates the student's `domain_id`.
3. Old roadmap progress for the previous domain is deleted in the same transaction.
4. New-domain roadmap progress starts fresh.

No client-side storage is used to preserve the selected domain.

---

# 11. Mock Tests

Mock tests are administered by an admin.

Each test contains questions uploaded using CSV with the exact structure:

```text
question, option_a, option_b, option_c, option_d, correct_option, explanation
```

### Rules

- Exactly four options per question.
- Exactly one correct option.
- `correct_option` must be one of `A`, `B`, `C`, `D`.
- Every question is worth 1 mark.
- No negative marking.
- Test types:
  - `aptitude`
  - `technical`
  - `general`

A test targets either:

- one specific department/year, or
- all departments/year combinations through nullable targeting fields.

---

# 12. Table: `mock_tests`

Stores mock-test metadata and publishing state.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `title` | TEXT | Required |
| `duration_minutes` | INTEGER | Required, must be > 0 |
| `target_department_id` | UUID | Nullable; FK → `departments.id` |
| `target_year` | SMALLINT | Nullable; 1–4 |
| `test_type` | ENUM / TEXT | `aptitude`, `technical`, `general` |
| `status` | ENUM / TEXT | `draft`, `published`, `unpublished`, `deleted` |
| `created_by` | UUID | Required; FK → `users.id` (admin) |
| `published_at` | TIMESTAMPTZ | Nullable |
| `unpublished_at` | TIMESTAMPTZ | Nullable |
| `deleted_at` | TIMESTAMPTZ | Nullable |
| `created_at` | TIMESTAMPTZ | Required |
| `updated_at` | TIMESTAMPTZ | Required |

### Publishing rules

Before publication, admin can edit the test.

After publication:

- duration cannot be changed;
- target department/year cannot be changed;
- test type cannot be changed;
- question content cannot be changed.

Admin may later unpublish or soft-delete the test.

Historical attempts must remain in the database.

### Targeting logic

- `target_department_id = NULL` → all departments.
- `target_year = NULL` → all years.

### Indexes

- Index on `status`.
- Index on `(status, target_department_id, target_year)`.
- Index on `(status, test_type)`.

---

# 13. Table: `mock_test_questions`

Stores immutable test questions.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `test_id` | UUID | Required; FK → `mock_tests.id` |
| `question_text` | TEXT | Required |
| `option_a` | TEXT | Required |
| `option_b` | TEXT | Required |
| `option_c` | TEXT | Required |
| `option_d` | TEXT | Required |
| `correct_option` | CHAR(1) | Required; A/B/C/D |
| `explanation` | TEXT | Nullable |
| `question_order` | INTEGER | Required |
| `created_at` | TIMESTAMPTZ | Required |

### Constraints

- `correct_option` must be one of `A`, `B`, `C`, `D`.
- `question_order` is unique within a test.

### Indexes

- Index/unique index on `(test_id, question_order)`.

Published questions are treated as immutable.

---

# 14. Table: `mock_test_attempts`

Stores every student attempt.

Retakes are never overwritten.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `student_id` | UUID | Required; FK → `student_profiles.user_id` |
| `test_id` | UUID | Required; FK → `mock_tests.id` |
| `attempt_number` | INTEGER | Required, starts at 1 |
| `marks_obtained` | INTEGER / NUMERIC | Required |
| `total_marks` | INTEGER / NUMERIC | Required |
| `score_percentage` | NUMERIC(5,2) | Required, 0–100 |
| `status` | ENUM / TEXT | `in_progress`, `submitted`, `expired`, `abandoned` |
| `started_at` | TIMESTAMPTZ | Required |
| `expires_at` | TIMESTAMPTZ | Required |
| `submitted_at` | TIMESTAMPTZ | Nullable |
| `created_at` | TIMESTAMPTZ | Required |

### Constraints

- `attempt_number > 0`.
- `score_percentage` must be between 0 and 100.
- `marks_obtained >= 0`.
- `total_marks > 0`.
- Unique `(student_id, test_id, attempt_number)`.

Only one active/in-progress attempt should exist for a student/test at a time.

### Indexes

- Index on `(student_id, submitted_at)`.
- Index on `(test_id, submitted_at)`.
- Index on `(student_id, test_id)`.

---

# 15. Table: `mock_test_attempt_answers`

Stores the student's answer history for every attempt.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `attempt_id` | UUID | Required; FK → `mock_test_attempts.id` |
| `question_id` | UUID | Required; FK → `mock_test_questions.id` |
| `selected_option` | CHAR(1) | Nullable; A/B/C/D |
| `is_correct` | BOOLEAN | Required |
| `created_at` | TIMESTAMPTZ | Required |

### Constraints

- Unique `(attempt_id, question_id)`.
- `selected_option` is either `NULL` or A/B/C/D.

The table lets students view their answers and question explanations after an attempt.

Because published questions are immutable, the stored correctness result remains consistent with the attempt.

---

# 16. Mock-Test Readiness Rules

## 16.1 Aptitude readiness

Average all submitted attempts whose test type is `aptitude`.

## 16.2 Technical readiness

Average all submitted attempts whose test type is `technical`.

## 16.3 Cleared test rule

A test is considered **cleared only when**:

```text
score_percentage > 65
```

Exactly `65%` is **not** cleared.

Retakes do not create additional cleared tests.

Example:

```text
Student A:
Test 1 → 70%
Test 1 → 80%
Test 2 → 50%

Cleared tests = 1
```

## 16.4 Student Mock Drive card

`Total Available` is the number of currently published tests that match the student's department/year.

A published test matches when:

```text
(target_department_id IS NULL OR target_department_id = student's department)
AND
(target_year IS NULL OR target_year = student's year)
```

`Cleared` is the number of distinct matching test IDs for which the student has at least one submitted attempt with `score_percentage > 65`.

Historical attempts remain even if a test is later unpublished/deleted.

---

# 17. Admin Mock-Test Metrics

### Total mock tests taken

This is **not** the total attempt count.

It is the count of distinct `(student_id, test_id)` combinations across submitted/recorded attempts.

Example:

```text
Student A:
Test 1 × 2 attempts
Test 2 × 1 attempt

Student B:
Test 1 × 1 attempt
Test 3 × 1 attempt

Total mock tests taken = 4
```

This metric therefore counts unique student/test participation, while readiness still uses every attempt.

---

# 18. Recent Mock Drive Performances

No extra table is necessary.

Use `mock_test_attempts` joined with `mock_tests`, ordered by `submitted_at DESC`.

Typical information shown:

- test title
- test type
- score percentage
- submitted time
- attempt information

---

# 19. Student Resume

Each student has one persistent resume record.

The resume builder must survive logout and browser-window close through database persistence.

## Table: `student_resumes`

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `student_id` | UUID | Required; unique; FK → `student_profiles.user_id` |
| `summary` | TEXT | Nullable |
| `phone` | TEXT | Nullable |
| `location` | TEXT | Nullable |
| `linkedin_url` | TEXT | Nullable |
| `github_url` | TEXT | Nullable |
| `portfolio_url` | TEXT | Nullable |
| `photo_storage_path` | TEXT | Nullable; Supabase Storage path |
| `template_type` | ENUM / TEXT | `ats` or `modern_executive` |
| `source_type` | ENUM / TEXT | `builder` or `uploaded` |
| `uploaded_file_path` | TEXT | Nullable; future uploaded-resume storage path |
| `created_at` | TIMESTAMPTZ | Required |
| `updated_at` | TIMESTAMPTZ | Required |

### Resume Builder sections

The persistent resume consists of:

- Personal header information / summary
- Technical skills
- Technical projects
- Experience and leadership
- Education
- Certifications
- Key achievements

---

# 20. Table: `resume_skills`

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `resume_id` | UUID | FK → `student_resumes.id` |
| `skill` | TEXT | Required |
| `category` | TEXT | Nullable |
| `sort_order` | INTEGER | Required |

Index on `resume_id`.

---

# 21. Table: `resume_projects`

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `resume_id` | UUID | FK → `student_resumes.id` |
| `title` | TEXT | Required |
| `description` | TEXT | Nullable |
| `technologies` | TEXT | Nullable |
| `project_url` | TEXT | Nullable |
| `sort_order` | INTEGER | Required |

Index on `resume_id`.

---

# 22. Table: `resume_experience`

Stores professional experience and leadership entries.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `resume_id` | UUID | FK → `student_resumes.id` |
| `entry_type` | ENUM / TEXT | `experience` or `leadership` |
| `organization` | TEXT | Required |
| `role` | TEXT | Required |
| `description` | TEXT | Nullable |
| `start_date` | DATE | Nullable |
| `end_date` | DATE | Nullable |
| `is_current` | BOOLEAN | Default `false` |
| `sort_order` | INTEGER | Required |

Index on `resume_id`.

---

# 23. Table: `resume_education`

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `resume_id` | UUID | FK → `student_resumes.id` |
| `institution` | TEXT | Required |
| `degree` | TEXT | Required |
| `field_of_study` | TEXT | Nullable |
| `start_year` | SMALLINT | Nullable |
| `end_year` | SMALLINT | Nullable |
| `grade` | TEXT | Nullable |
| `sort_order` | INTEGER | Required |

Index on `resume_id`.

---

# 24. Table: `resume_certifications`

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `resume_id` | UUID | FK → `student_resumes.id` |
| `name` | TEXT | Required |
| `issuer` | TEXT | Nullable |
| `issue_date` | DATE | Nullable |
| `credential_url` | TEXT | Nullable |
| `sort_order` | INTEGER | Required |

Index on `resume_id`.

---

# 25. Table: `resume_achievements`

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `resume_id` | UUID | FK → `student_resumes.id` |
| `title` | TEXT | Required |
| `description` | TEXT | Nullable |
| `sort_order` | INTEGER | Required |

Index on `resume_id`.

---

# 26. AI Resume Review

The AI Resume Suite has three parts:

1. AI Reviewer
2. Resume Builder
3. JD Matcher

Only the AI Reviewer result is stored.

JD Matcher results do not need persistence.

## Table: `resume_reviews`

Only the latest review per student is stored.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `student_id` | UUID | Required, unique; FK → `student_profiles.user_id` |
| `resume_id` | UUID | Required; FK → `student_resumes.id` |
| `domain_id` | UUID | Required; FK → `domains.id` |
| `ats_score` | NUMERIC(5,2) | Required, 0–100 |
| `improvement_points` | JSONB | Required |
| `resume_revision` | INTEGER | Required; increments when the stored review is replaced |
| `reviewed_at` | TIMESTAMPTZ | Required |
| `updated_at` | TIMESTAMPTZ | Required |

### Rules

- One current row per student.
- New review replaces the previous row rather than creating review history.
- ATS score is part of readiness calculation.
- A review is applicable to the domain for which it was generated.
- When a student changes domain, the existing review may remain stored, but it should not be treated as the current applicable ATS score for the new domain until a new review is generated for that domain.

### Admin metric

`Total resumes reviewed` = number of unique students with a stored resume review.

It is **not** the number of review operations performed over time.

### Indexes

- Unique index on `student_id`.
- Index on `domain_id`.

---

# 27. HR Practice Questions

HR questions are permanent developer-managed product data.

Admins do not manage the question catalog through the application.

## Table: `hr_practice_questions`

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `question` | TEXT | Required |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` | TIMESTAMPTZ | Required |
| `updated_at` | TIMESTAMPTZ | Required |

Index on `is_active`.

Question definitions must live in the database rather than frontend hardcoded arrays.

---

# 28. Table: `hr_interview_attempts`

Stores each completed HR interview practice attempt.

Only the requested quantitative results are persisted.

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `student_id` | UUID | Required; FK → `student_profiles.user_id` |
| `question_id` | UUID | Required; FK → `hr_practice_questions.id` |
| `score` | NUMERIC(5,2) | Required, 0–100 |
| `pace_wpm` | NUMERIC(6,2) | Required |
| `confidence_score` | NUMERIC(5,2) | Required, 0–100 |
| `completed_at` | TIMESTAMPTZ | Required |
| `created_at` | TIMESTAMPTZ | Required |

### Stored data

Only these interview results are persisted:

- Pace
- Confidence
- Score

No transcript/audio/feedback history is required in the current design.

### Student dashboard

The HR Interview dashboard card can show the latest completed attempt for the student.

If no attempt exists, the UI must show an unattempted/empty state rather than fabricated values.

### Admin metric

`Total interview practices` = number of recorded interview attempts.

### Indexes

- Index on `(student_id, completed_at)`.
- Index on `question_id`.

---

# 29. Admin Dashboard Metrics

The admin dashboard contains four primary metrics.

## 29.1 Total onboarded students

Count active student users.

Conceptually:

```sql
COUNT(*)
FROM users
WHERE role = 'student'
  AND is_active = true;
```

## 29.2 Total mock tests taken

Count distinct `(student_id, test_id)` combinations from mock test attempts.

Retakes do not increase this metric.

## 29.3 Total resumes reviewed

Count students with a current row in `resume_reviews`.

## 29.4 Total interview practices

Count rows in `hr_interview_attempts`.

---

# 30. Admin Student List

The admin student table should contain at least:

- Name
- Email
- Department
- Year
- Readiness score

Tests/interviews done do not need to be fetched for every student row because that would create unnecessary heavy queries.

The student list must be paginated.

Readiness is read from `student_profiles.readiness_score` rather than recalculated individually for every row.

---

# 31. Student Onboarding

## 31.1 Admin onboarding

Admin can create an individual student with:

- Name
- Email
- Department
- Year
- Generic password

The system creates the `users` and `student_profiles` records transactionally.

Recommended values:

```text
onboarding_source = 'admin'
readiness_score = 0
must_change_password = true
```

`onboarded_by` stores the admin who created the student.

## 31.2 Bulk CSV onboarding

CSV contains the same student fields.

Rules:

- Valid rows are processed and saved.
- Duplicate emails are reported.
- One duplicate must not stop other valid rows from being created.
- After processing, the UI shows a result popup/report for the rows that were skipped or failed.

## 31.3 Student self-registration

Self-registration also creates both `users` and `student_profiles` transactionally.

Recommended values:

```text
onboarding_source = 'self'
must_change_password = false
readiness_score = 0
```

Department and year are explicitly selected; no default department/year should be silently inserted.

Google authentication is deferred.

---

# 32. Student Profile Updates

Students can edit:

- Name
- Department
- Year

Students cannot edit:

- Email
- Role

The backend must identify the authenticated student from the auth context/token rather than trusting a user ID supplied by the frontend.

Profile changes must update PostgreSQL.

They must not be persisted only in browser state.

---

# 33. Supabase Storage

Files are stored in Supabase Storage.

The database stores only file references/paths such as:

- `photo_storage_path`
- `uploaded_file_path`

The frontend/backend must not treat a local filesystem path as the persistent source of truth.

---

# 34. Authentication and Security Principles

- Frontend must not have direct access to privileged database/service credentials.
- All application database operations should pass through FastAPI.
- Passwords are hashed before storage.
- Secrets such as JWT secrets, Supabase service credentials, admin credentials, and AI provider credentials must come from environment configuration/secret management.
- Do not hardcode production secrets in source files.
- CORS should allow only intended application origins.
- Authentication failures must not silently log the user in as a random/demo account.
- Database failures must not return fabricated successful data.

---

# 35. Historical Data Rules

Historical records must remain valid when a student's current profile changes.

Changing:

- department
- year
- current domain

must not rewrite historical:

- mock test attempts
- mock test answers
- HR interview attempts
- prior resume-review records stored as the current/latest review row until it is replaced

The current student profile represents current state; historical records retain the facts associated with the event that happened at that time.

---

# 36. Recommended Foreign-Key Relationships

```text
users
 ├── student_profiles
 │    ├── departments
 │    ├── domains
 │    ├── student_roadmap_progress
 │    ├── mock_test_attempts
 │    ├── student_resumes
 │    ├── resume_reviews
 │    └── hr_interview_attempts
 │
 └── admin-created records
      └── mock_tests.created_by

departments
 ├── student_profiles
 └── mock_tests.target_department_id

domains
 ├── student_profiles
 ├── roadmap_items
 └── resume_reviews

roadmap_items
 ├── roadmap_items.parent_id
 └── student_roadmap_progress

mock_tests
 ├── mock_test_questions
 └── mock_test_attempts
      └── mock_test_attempt_answers

student_resumes
 ├── resume_skills
 ├── resume_projects
 ├── resume_experience
 ├── resume_education
 ├── resume_certifications
 ├── resume_achievements
 └── resume_reviews

hr_practice_questions
 └── hr_interview_attempts
```

---

# 37. Important Database Constraints Summary

At minimum, enforce the following in PostgreSQL:

```text
users.email                         UNIQUE, case-insensitive
users.role                          student/admin
student_profiles.year               1..4
student_profiles.onboarding_source  admin/self
mock_tests.duration_minutes         > 0
mock_tests.target_year              NULL or 1..4
mock_tests.test_type                aptitude/technical/general
mock_tests.status                   draft/published/unpublished/deleted
mock_test_questions.correct_option  A/B/C/D
mock_test_questions.question_order  unique per test
mock_test_attempts.attempt_number   > 0
mock_test_attempts.score_percentage 0..100
mock_test_attempt_answers           unique per attempt/question
student_resumes.student_id          UNIQUE
resume_reviews.student_id           UNIQUE
resume_reviews.ats_score            0..100
hr_interview_attempts.score         0..100
hr_interview_attempts.confidence    0..100
student_roadmap_progress            PK(student_id, roadmap_item_id)
```

---

# 38. Required Query/Performance Principles

The backend should query the database according to the shape of the feature instead of repeatedly loading large catalogs into memory.

Avoid N+1 patterns such as:

```text
fetch students
→ fetch readiness for student 1
→ fetch readiness for student 2
→ fetch readiness for student 3
→ ...
```

Prefer set-based queries, joins, aggregates, pagination, and targeted endpoints.

For admin dashboard statistics, use aggregate database queries rather than loading every related row into application memory.

For student readiness, maintain the backend-calculated snapshot in `student_profiles` and update it when an input changes.

For mock-test pages, fetch the required test/questions in focused queries rather than repeatedly calling the same test endpoint.

The database remains the source of truth even when caching is later added for performance.

A cache may optimize reads, but it must never replace PostgreSQL as the authoritative source for dynamic application data.

---

# 39. Data That Is Intentionally Not Stored

The current design intentionally does **not** create tables for:

- Google authentication data
- Mentor accounts/relationships
- JD Matcher results
- HR audio files
- HR transcripts
- HR AI feedback history
- Historical AI resume-review versions
- Browser-selected domain state
- Target Drive state
- Fabricated/demo analytics

These may be introduced later only through an explicit schema change.

---

# 40. Removed / Deprecated Concepts

The following concepts are removed from the new architecture:

### Target Drive

Target Drive is removed completely.

It must not exist as:

- a database field,
- a localStorage key,
- a frontend mock state,
- a backend fallback,
- or another persistence mechanism.

### Mock application data

Frontend/backend mock arrays and demo records are not accepted as runtime application data.

### Fake analytics

Analytics such as pace, confidence, WPM, ATS scores, readiness scores, or test statistics must never be fabricated simply because real data is unavailable.

### Local persistence as database substitute

`localStorage`, `sessionStorage`, local JSON files, or in-memory dictionaries cannot substitute for PostgreSQL persistence.

---

# 41. Current Source-of-Truth Rules

| Data | Source of Truth |
|---|---|
| Authentication/account | PostgreSQL via FastAPI |
| Student profile | PostgreSQL via FastAPI |
| Department catalog | PostgreSQL |
| Domain catalog | PostgreSQL |
| Roadmap definitions | PostgreSQL |
| Roadmap progress | PostgreSQL |
| Mock tests | PostgreSQL |
| Mock questions | PostgreSQL |
| Mock attempts | PostgreSQL |
| Mock answers | PostgreSQL |
| Resume | PostgreSQL |
| Resume files/photos | Supabase Storage + PostgreSQL path |
| AI resume review | PostgreSQL |
| HR questions | PostgreSQL |
| HR interview attempts | PostgreSQL |
| Readiness snapshot | PostgreSQL, derived by backend |

---

# 42. Final Architecture Principle

The application should follow this rule:

> **Store facts in PostgreSQL, derive metrics in the backend, and let the frontend display the real results.**

For AI-powered features:

> **The backend computes/validates factual metrics; the AI narrates or analyzes only the real data supplied to it.**

The AI must never invent missing statistics, scores, test results, speech analytics, resume scores, readiness values, or user activity.

The database design is intended to make that architecture enforceable rather than dependent on frontend assumptions or mock data.
