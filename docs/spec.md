# SkillLink Platform — Docker Specification

## Overview

SkillLink is a FastAPI-based backend platform connecting clients with specialists.
This document describes the Docker setup: how the application is containerized, what services are included, and the reasoning behind each decision.

---

## 1. Dockerfile — Small and Fast Container

The application is containerized using a **multi-stage Dockerfile** to minimize the final image size.

### Stages

**Stage 1 — Builder**
Installs system build dependencies (`gcc`, `libpq-dev`) and all Python packages into an isolated prefix directory (`/install`). These build tools are only needed during compilation and are never included in the final image.

**Stage 2 — Runtime**
Starts from a clean `python:3.12-slim` base image and copies only the compiled packages from the builder stage. No build tools are present in this image.

### Optimization Techniques

| Technique | Effect |
|-----------|--------|
| Multi-stage build | Build tools never reach the production image |
| `python:3.12-slim` base image | ~600MB smaller than the full Python image |
| `--no-cache-dir` on pip install | Pip cache is not stored inside the image |
| `--no-install-recommends` on apt-get | Installs only essential system packages |
| `.dockerignore` file | Excludes `venv/`, `__pycache__/`, `.git/`, logs from build context |
| Non-root user (`appuser`) | Improves security, follows least-privilege principle |

**Result:** final image size ~200MB vs ~800MB without these techniques.

---

## 2. Docker Compose — All Services

All services are defined in `docker-compose.yml` and communicate over Docker's internal network.

### Service Map

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `redis` | redis:7-alpine | 6379 | Message broker for Celery + application cache |
| `postgres` | postgres:16-alpine | 5432 | Local PostgreSQL instance (demonstrates volume persistence) |
| `api` | built from Dockerfile | 8000 | Main FastAPI application |
| `celery_worker` | built from Dockerfile | — | Processes background tasks (email, image, orders) |
| `celery_beat` | built from Dockerfile | — | Schedules periodic tasks (e.g. cancel expired orders) |
| `flower` | mher/flower:2.0 | 5555 | Web UI for monitoring Celery tasks |
| `redis_commander` | rediscommander/redis-commander | 8081 | Web UI for inspecting Redis keys and cache |
| `adminer` | adminer:latest | 8082 | Lightweight web UI for any PostgreSQL database |
| `nginx` | nginx:alpine | 80 | Reverse proxy in front of the FastAPI app |

### depends_on Strategy

Services wait for their dependencies to be **actually ready**, not just started, using `condition: service_healthy`:

```
redis + postgres  →  api, celery_worker, celery_beat
celery_worker     →  flower
api               →  nginx
```

Each dependency has a `healthcheck` defined (`pg_isready` for Postgres, `redis-cli ping` for Redis, HTTP check for the API) so Docker waits for genuine readiness before starting dependent services.

---

## 3. Database Persistence — Volumes

All stateful services use named Docker volumes so data survives container restarts and `docker compose down`.

```yaml
volumes:
  postgres_data:   # PostgreSQL data directory
  redis_data:      # Redis AOF (Append-Only File) persistence
  uploads_data:    # User-uploaded files served by the API
```

Redis is started with `--appendonly yes` to enable AOF persistence — every write is logged to disk, so no data is lost on restart.

To fully reset all data:
```bash
docker compose down -v   # -v removes named volumes
```

---

## 4. Database UI — Adminer

**Adminer** is included as a lightweight database viewer (~30MB image, single container).

- URL: http://localhost:8082
- Supports PostgreSQL, MySQL, SQLite, and others
- Can connect to any external database including a Supabase-hosted instance

To connect to Supabase via Adminer:

| Field | Value |
|-------|-------|
| System | PostgreSQL |
| Server | `aws-1-ap-south-1.pooler.supabase.com` |
| Username | `postgres.<project_ref>` |
| Password | your Supabase DB password |
| Database | `postgres` |

---

## 5. Flower and Redis Commander

### Flower — Celery Monitoring
- URL: http://localhost:5555
- Shows active workers, task queues, success/failure rates, task history
- Connects to Redis broker automatically via `CELERY_BROKER_URL`

### Redis Commander — Cache Inspector
- URL: http://localhost:8081
- Browse all Redis keys and values in real time
- Useful for inspecting rate-limit counters, JWT blocklist entries, and cached responses

---

## 6. Additional Service — Nginx Reverse Proxy

Nginx is added as a production-ready reverse proxy in front of the FastAPI application.

**Why it is useful:**
- Single entry point on port 80 — no need to expose port 8000 to clients
- Handles `proxy_set_header` for correct IP forwarding (works with `TrustedHostMiddleware` in the app)
- Enables gzip compression for JSON responses
- Easy to extend with SSL termination when deploying to a real server
- Can serve uploaded files directly without going through Python

Config: `./nginx/nginx.conf`

---

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Build and start all services
docker compose up -d --build

# 3. Check status
docker compose ps
```

### Service URLs

| URL | Service |
|-----|---------|
| http://localhost:8000/docs | FastAPI Swagger UI |
| http://localhost:80 | Nginx → API |
| http://localhost:5555 | Flower (Celery monitor) |
| http://localhost:8081 | Redis Commander |
| http://localhost:8082 | Adminer (DB viewer) |

### Useful Commands

```bash
# View logs
docker compose logs -f api
docker compose logs -f celery_worker

# Rebuild only the API after code changes
docker compose up -d --build api

# Stop everything (data is preserved)
docker compose down

# Stop and delete all data
docker compose down -v
```