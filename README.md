<div align="center">

# 🎓 Impulse

### Campus Placement Suite — University College of Engineering Kariavattom

[![Website](https://img.shields.io/badge/impulse.uck.ac.in-F97316?style=for-the-badge)](https://impulse.uck.ac.in/)
[![Backend API](https://img.shields.io/badge/⚡_API-Render.com-000000?style=for-the-badge&labelColor=46E3B7)](https://impulse-fw49.onrender.com/api/health)
[![GitHub](https://img.shields.io/badge/GitHub-Unstop--Igniters--UCEK-000000?style=for-the-badge&logo=github)](https://github.com/Unstop-Igniters-UCEK/UCEK_Placement)

**The official AI-powered placement preparation engine for UCEK engineering students.**
Built by the Unstop Igniters Club.

</div>

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **AI Resume Suite** | Upload your resume for instant ATS compliance scoring, section-by-section feedback, and AI-powered improvement suggestions using Gemini AI |
| **HR Interview Simulator** | Practice realistic HR interview rounds with AI-generated questions, real-time evaluation, and detailed performance analytics |
| **Mock Placement Tests** | Timed aptitude and domain-specific tests that simulate real campus recruitment drives with instant scoring |
| **Domain Roadmaps** | Structured, trackable learning paths for CSE, ECE, IT, and other branches — from fundamentals to placement-ready |
| **Alumni Mentorship** | Connect directly with verified UCEK alumni working in the industry for career guidance and mock interview practice |
| **Admin Dashboard** | Placement officers and faculty can manage drives, monitor student readiness, create tests, and track analytics |
| **Role-Based Auth** | Secure JWT authentication with three roles — Student, Alumni Mentor, and Placement Admin |

---

## 🏗️ Architecture

```
┌─────────────────────────────┐     HTTPS      ┌──────────────────────────────┐
│       FRONTEND (Vercel)     │ ◄────────────► │       BACKEND (Render)       │
│                             │                │                              │
│  React 19 + TypeScript      │    REST API    │  Python FastAPI + Uvicorn    │
│  Vite 8 + Tailwind CSS v4   │ ◄────────────► │  JWT Auth + SlowAPI Limiter  │
│  Framer Motion + GSAP       │                │  Gemini AI Integration       │
│  Lenis + OGL/WebGL Shaders  │                │  PyPDF2 Resume Parsing       │
│                             │                │                              │
└─────────────────────────────┘                └──────────┬───────────────────┘
                                                          │
                                                          │ Supabase SDK
                                                          ▼
                                               ┌──────────────────────┐
                                               │   SUPABASE (Cloud)   │
                                               │                      │
                                               │  PostgreSQL Database  │
                                               │  Row Level Security   │
                                               │  Auth + Storage       │
                                               └──────────────────────┘
```

---

## 📁 Project Structure

```
UCEK/
├── frontend/                  # Client Application
│   ├── src/
│   │   ├── components/        # Reusable UI components (Sidebar, Header, AuthModal...)
│   │   ├── pages/             # Route pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AIResumeSuite.tsx
│   │   │   ├── HRInterviewSimulator.tsx
│   │   │   ├── MockTests.tsx
│   │   │   ├── DomainRoadmap.tsx
│   │   │   ├── Mentorship.tsx
│   │   │   └── AdminPanel.tsx
│   │   ├── context/           # React Context (auth, app state)
│   │   └── lib/               # Utility functions
│   ├── public/                # Static assets (favicon, icons)
│   ├── index.html             # HTML entry point
│   ├── vercel.json            # Vercel SPA rewrite rules
│   └── package.json
│
├── backend/                   # API Server
│   ├── main.py                # FastAPI app entry point, CORS, keep-alive
│   ├── database.py            # Supabase client, data access layer
│   ├── mock_data.py           # Seed data for tests, questions, roadmaps
│   └── routers/
│       ├── auth.py            # Login, Signup, OTP, Password Reset
│       ├── user.py            # Profile management
│       ├── ai_suite.py        # Resume ATS analysis, AI feedback (Gemini)
│       ├── tests.py           # Mock test CRUD and scoring
│       ├── roadmap.py         # Domain roadmap progress tracking
│       ├── mentorship.py      # Alumni mentor matching
│       └── admin.py           # Admin dashboard, drive management
│
├── requirements.txt           # Python dependencies
├── PRODUCT.md                 # Product specification
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x & **npm** ≥ 9.x
- **Python** ≥ 3.10
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google Gemini API Key](https://aistudio.google.com/apikey) (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/Unstop-Igniters-UCEK/UCEK_Placement.git
cd UCEK_Placement
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

Create `backend/.env` with the following variables:

```env
FASTAPI_PORT=8000
JWT_SECRET=your_jwt_secret_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Admin Access
ADMIN_SECRET_KEY=your_admin_passcode
```

Start the backend server:

```bash
python -m backend.main
# API available at http://localhost:8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
# App available at http://localhost:5173
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/keep-alive` | UptimeRobot keep-alive ping (warms DB) |
| `POST` | `/api/auth/signup` | User registration |
| `POST` | `/api/auth/login` | User login (returns JWT) |
| `POST` | `/api/auth/send-otp` | Send password reset OTP |
| `POST` | `/api/auth/verify-otp-reset` | Verify OTP and reset password |
| `GET` | `/api/user/profile` | Get user profile |
| `PUT` | `/api/user/profile` | Update user profile |
| `POST` | `/api/ai/analyze-resume` | AI resume ATS analysis (Gemini) |
| `GET` | `/api/tests/` | List available mock tests |
| `POST` | `/api/tests/submit` | Submit test answers and get score |
| `GET` | `/api/roadmap/` | Get domain roadmaps |
| `PUT` | `/api/roadmap/progress` | Update roadmap progress |
| `GET` | `/api/mentorship/mentors` | List alumni mentors |
| `GET` | `/api/admin/analytics` | Admin placement analytics |

---

## 🌐 Deployment

### Frontend → Vercel

1. Import the GitHub repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `dist`
5. Add environment variable: `VITE_API_BASE_URL` = your Render backend URL

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `.` (root)
4. Set **Build Command** to `pip install -r requirements.txt`
5. Set **Start Command** to `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
6. Add all `backend/.env` variables in Render's Environment settings

### Keep-Alive (UptimeRobot)

Render's free tier sleeps after 15 minutes of inactivity. To prevent cold starts:

1. Create a free monitor on [UptimeRobot](https://uptimerobot.com)
2. Set **URL** to `https://your-backend.onrender.com/api/keep-alive`
3. Set **Interval** to every 5 minutes

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite 8 | Build tool & dev server |
| Tailwind CSS v4 | Utility-first styling |
| Framer Motion | Page transitions & animations |
| GSAP | Advanced motion choreography |
| Lenis | Smooth scrolling |
| OGL / WebGL | Shader-based background effects |
| Lucide React | Icon system |
| shadcn/ui | Accessible component primitives |

### Backend
| Technology | Purpose |
|-----------|---------|
| Python 3.10+ | Runtime |
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| Supabase (PostgreSQL) | Database & auth storage |
| Google Gemini AI | Resume analysis & interview AI |
| PyPDF2 / pypdf | Resume PDF parsing |
| SlowAPI | Rate limiting |
| Resend | Transactional emails (OTP) |
| python-multipart | File upload handling |

---

## 👥 Contributors

<table>
  <tr>
    <td align="center"><b>Karthik S</b><br/>Full-Stack Developer</td>
    <td align="center"><b>Theertha S Nair</b><br/>Developer</td>
    <td align="center"><b>Amarnath Sujith</b><br/>Developer</td>
    <td align="center"><b>Nimish M Biju</b><br/>Developer</td>
  </tr>
</table>

---

## 📄 License

This project is developed for **University College of Engineering Kariavattom (UCEK)** by the **Unstop Igniters Club**. All rights reserved.

---

<div align="center">
  <sub>Built with ❤️ by the Unstop Igniters Club, UCEK</sub>
</div>
