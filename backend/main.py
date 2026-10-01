import os
from dotenv import load_dotenv

# Load environment variables from backend/.env or root .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

from backend.routers import auth, user, roadmap, tests, mentorship, ai_suite, admin
from backend.routers.onboarding_router import onboarding_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Impulse — UCEK Placement API",
    description="FastAPI backend for Impulse: Placement Prep, Roadmap Tracking, AI Resume Suite, and Mock Drive.",
    version="2.0.0"
)


def custom_rate_limit_handler(request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many attempts in a short time. Please wait a minute before trying again."}
    )


app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://impulse.uck.ac.in",
        "https://impulseucek.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from datetime import datetime


# ─── Health Check (supports HEAD, GET, POST for UptimeRobot) ──────────────────
@app.api_route("/api/health", methods=["GET", "HEAD", "POST"])
def health_check():
    return {"status": "ok", "backend": "Impulse FastAPI", "platform": "UCEK Unstop Igniters"}


# ─── Keep-Alive (UptimeRobot / Cron monitoring) ───────────────────────────────
@app.api_route("/api/keep-alive", methods=["GET", "HEAD", "POST"])
def keep_alive():
    db_status = "idle"
    try:
        from backend.database import supabase_client
        if supabase_client:
            supabase_client.table("users").select("id").limit(1).execute()
            db_status = "connected"
    except Exception as err:
        db_status = f"error: {str(err)[:80]}"

    return {
        "status": "alive",
        "service": "Impulse UCEK API",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.get("/api/domains")
def get_domains_root():
    from backend.database import db
    return {"domains": db.get_all_domains()}


@app.get("/api/departments")
def get_departments_root():
    from backend.database import db
    return {"departments": db.get_all_departments()}


# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(roadmap.router)
app.include_router(tests.router)
app.include_router(mentorship.router)
app.include_router(ai_suite.router)
app.include_router(admin.router)
app.include_router(onboarding_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("FASTAPI_PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
