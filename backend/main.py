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
from backend.routers import auth, user, roadmap, tests, mentorship, ai_suite, admin

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="UCEK Unstop Igniters Placement API",
    description="Python FastAPI backend powering Placement Prep, Roadmap Tracking, AI Resume Audit, and Mentorship.",
    version="1.0.0"
)

from fastapi.responses import JSONResponse

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

# Healthcheck
@app.get("/api/health")
def health_check():
    return {"status": "ok", "backend": "Python FastAPI", "platform": "UCEK Unstop Igniters"}

# Include Routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(roadmap.router)
app.include_router(tests.router)
app.include_router(mentorship.router)
app.include_router(ai_suite.router)
app.include_router(admin.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("FASTAPI_PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
