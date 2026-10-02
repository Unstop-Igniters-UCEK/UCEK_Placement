# ─── Frontend Dockerfile ──────────────────────────────────────────────────────
# Impulse UCEK Placement -- React/Vite frontend
# Stage 1: Build Vite production bundle
# Stage 2: Serve with Nginx + reverse-proxy /api to backend
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source
COPY . .

# VITE_API_BASE_URL="" means same-origin: all /api/* calls go through Nginx to the backend.
# This is the correct value for the production Nginx reverse-proxy setup.
# Override at build time with --build-arg if you need a different URL.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=

# Build production bundle
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# gettext provides envsubst for runtime BACKEND_URL substitution in nginx.conf
RUN apk add --no-cache gettext

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config template (uses BACKEND_URL env var for the /api proxy)
COPY nginx.conf /etc/nginx/templates/impulse.conf.template

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Nginx healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

# envsubst replaces ${BACKEND_URL} in the config template at start time,
# then starts nginx. The template is written to conf.d/ as the real config.
CMD ["/bin/sh", "-c", "envsubst '' < /etc/nginx/templates/impulse.conf.template > /etc/nginx/conf.d/impulse.conf && nginx -g 'daemon off;'"]
