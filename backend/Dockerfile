# ==============================================================================
# Production Dockerfile for FastAPI Backend — Impulse (UCEK Placement Suite)
# Deployed to Render as a Docker Web Service
# ==============================================================================

FROM python:3.12-slim AS base

# Environment flags for Python runtime & default port
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install curl for container health check
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Step 1: Copy dependency list first to leverage Docker layer caching
COPY requirements.txt .

# Step 2: Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Step 3: Copy only backend application code
# Note: .env, frontend, git, and local artifacts are strictly ignored via .dockerignore
COPY backend/ ./backend/

# Step 4: Run as non-root user for security
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Docker healthcheck pinging the existing /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Production WSGI/ASGI entrypoint:
# Gunicorn with UvicornWorker binding to 0.0.0.0 on Render's dynamic $PORT
CMD ["sh", "-c", "gunicorn backend.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT} --workers 2 --timeout 120 --access-logfile - --error-logfile -"]
