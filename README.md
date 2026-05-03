# SkillLink — Smart Skilled Services Marketplace

> A web-based marketplace that connects clients with verified skilled professionals: electricians, plumbers, repair specialists, and more.

**Live Demo:** [skilllink-frontend-production.up.railway.app](https://skilllink-frontend-production.up.railway.app/login)

---

## Table of Contents

- [About the Project](#about-the-project)
- [Problem Statement](#problem-statement)
- [Technology Stack](#technology-stack)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Docker Services](#docker-services)
- [Available URLs After Launch](#available-urls-after-launch)
- [API Overview](#api-overview)
- [Team](#team)

---

## About the Project

SkillLink is a full-stack marketplace platform where customers can discover and hire trusted skilled professionals in their area, while specialists get a centralized workspace to manage their profile, services, and orders.

The system supports three distinct roles — **Client**, **Specialist**, and **Admin** — each with their own dashboard, capabilities, and access controls.

---

## Problem Statement

- Finding reliable and verified skilled workers (electricians, plumbers, etc.) is difficult and time-consuming.
- There is no transparent system for evaluating qualifications and service quality.
- Customers face risks related to pricing, reliability, and service guarantees.
- Skilled professionals lack a centralized platform to connect with clients and grow their business.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Query, Zustand, React Hook Form, Zod, Framer Motion |
| **Backend** | FastAPI, Python 3.12, Pydantic, SQLModel, Alembic |
| **Database** | PostgreSQL (Supabase in production, local container for dev) |
| **Cache / Queue** | Redis 7, Celery (worker + beat scheduler) |
| **Auth** | JWT (access + refresh tokens), bcrypt, email confirmation |
| **File Storage** | Local filesystem (Docker volume), pikepdf for accreditation PDF processing |
| **Geo** | H3 geospatial indexing for location-based specialist search |
| **Proxy** | Nginx (frontend static serving + reverse proxy) |
| **Testing** | Playwright (E2E), pytest |
| **DevOps** | Docker, Docker Compose, Railway (cloud hosting) |
| **Tooling** | Notion, Confluence, Figma, Jira, Postman |

---

## Key Features

- **Authentication & Authorization** — registration with email confirmation, login/logout, password reset, JWT refresh tokens
- **Role-Based Access Control** — separate flows for Client, Specialist, and Admin
- **Specialist Profiles** — skills, experience, hourly rate, portfolio gallery, accreditation documents (PDF)
- **Service Catalog** — specialists manage their list of offered services with prices
- **Order Lifecycle** — full tracking from creation through `Pending → Accepted → In Progress → Completed` (or `Cancelled`)
- **Location-Based Search** — find nearby specialists using H3 geospatial indexing
- **Rating & Review System** — star ratings and comments on completed orders
- **In-Order Messaging** — per-order chat between client and specialist
- **Admin Panel** — manage specialist verification/activation, view all requests and users
- **File Uploads** — avatar photos and accreditation PDF upload with compression
- **Real-Time Notifications** — toast alerts on order status changes
- **Responsive Design** — works on both mobile and desktop
- **Background Tasks** — Celery worker + beat for async email sending and scheduled jobs
- **Rate Limiting & Profiling** — request rate limiter and latency profiling middleware
- **Audit Logging** — system-level audit trail for key operations

---

## Architecture

```
┌────────────────────────────────────────────────┐
│                   Browser                       │
│           React SPA (Vite + Nginx)              │
└─────────────────────┬──────────────────────────┘
                      │ HTTP / REST
┌─────────────────────▼──────────────────────────┐
│              FastAPI Backend                    │
│  /api/v1/{auth, users, specialists, orders,    │
│           catalog, files, comments, ...}        │
└──────┬──────────────┬──────────────────────────┘
       │              │
┌──────▼──────┐ ┌─────▼──────────────────────────┐
│  PostgreSQL  │ │  Redis                          │
│  (Supabase) │ │  • JWT blocklist (token revoke) │
│             │ │  • Celery broker & result store  │
└─────────────┘ └─────────────────────────────────┘
                      │
               ┌──────▼──────────────────────────┐
               │  Celery Worker + Beat            │
               │  • Email sending                 │
               │  • Scheduled cleanup tasks       │
               └─────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Alibel56/skilllink-platform.git
cd skilllink-platform
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Key variables to set in `.env`:

```env
# Database (Supabase or local postgres)
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>:<port>/<db>
DATABASE_URL_SYNC=postgresql://<user>:<password>@<host>:<port>/<db>

# Security
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# Redis (matches docker-compose service name)
REDIS_HOST=redis
REDIS_PORT=6379

# Email (SMTP for confirmation emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your@gmail.com
```

### 3. Start all services

```bash
docker compose up --build
```

On first run, the `migrate` container will automatically apply all Alembic database migrations before the API starts.

To run in detached (background) mode:

```bash
docker compose up --build -d
```

### 4. Stop services

```bash
docker compose down
```

To also remove persistent volumes (database data, uploads):

```bash
docker compose down -v
```

---

## Docker Services

| Service | Image | Port | Purpose |
|---|---|---|---|
| `api` | Custom (Python 3.12-slim) | `8000` | FastAPI backend application |
| `postgres` | `postgres:16-alpine` | `5432` | Local PostgreSQL database with persistent volume |
| `redis` | `redis:7-alpine` | `6379` | Cache, JWT blocklist, Celery message broker |
| `celery_worker` | Custom (same as api) | — | Async task worker (emails, background jobs) |
| `celery_beat` | Custom (same as api) | — | Periodic task scheduler |
| `flower` | `mher/flower:2.0` | `5555` | Celery task monitoring UI |
| `adminer` | `adminer:latest` | `8082` | Web UI for database management |
| `redis_commander` | `rediscommander/redis-commander` | `8081` | Web UI for Redis inspection |
| `migrate` | Custom (same as api) | — | One-shot container that runs `alembic upgrade head` on startup |

All persistent data is stored in named Docker volumes:
- `postgres_data` — database files
- `redis_data` — Redis AOF persistence
- `uploads_data` — user-uploaded files (avatars, accreditation PDFs)

---

## Available URLs After Launch

### Local Development

| URL | Description |
|---|---|
| `http://localhost:8000` | Backend API — health check (`{"status": "ok"}`) |
| `http://localhost:8000/docs` | Interactive Swagger UI (API documentation) |
| `http://localhost:8000/redoc` | ReDoc API documentation |
| `http://localhost:5173` | Frontend dev server (if running `npm run dev` locally) |
| `http://localhost:8082` | Adminer — database management UI |
| `http://localhost:8081` | Redis Commander — Redis inspection UI |
| `http://localhost:5555` | Flower — Celery task monitoring |

### Production (Railway)

| URL | Description |
|---|---|
| [skilllink-frontend-production.up.railway.app](https://skilllink-frontend-production.up.railway.app/login) | Live frontend application |

---

## API Overview

All endpoints are prefixed with `/api/v1`. Full interactive documentation is available at `/docs` after starting the backend.

| Group | Key Endpoints |
|---|---|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| **Users** | `GET /users/profile`, `PUT /users/update`, `DELETE /users/delete` |
| **Specialists** | `POST /specialists/create`, `GET /specialists/me`, `GET /specialists/get/{id}`, `GET /specialists/search` (geo-based) |
| **Orders** | `POST /orders/create`, `GET /orders/my`, `POST /orders/take/{id}`, `POST /orders/complete/{id}`, `POST /orders/cancel/{id}` |
| **Catalog** | `POST /catalog/add/item`, `GET /catalog/get/catalog/{specialist_id}`, `PUT /catalog/update/{id}` |
| **Files** | `POST /files/upload/avatar`, `POST /files/upload/accreditation`, `GET /files/get/avatar/{user_id}` |
| **Comments & Ratings** | `POST /comment/write/{specialist_id}`, `POST /rate/create/{specialist_id}` |
| **Messages** | `POST /message/write`, `GET /message/get/chat/{order_id}` |
| **Requests** | `GET /requests/get/all`, `PUT /requests/approve/{request_id}` |
| **Admin** | `PATCH /specialists/verify/{id}`, `PATCH /specialists/activate/{id}`, `GET /specialists/list` |

---

## Team

| Name | Student ID | Role |
|---|---|---|
| Alibek Aglanov | 230103228 | Backend Developer |
| Danial Kaltay | 230103193 | Project Manager / QA |
| Ainat Yermurat | 230103161 | Frontend Developer |
| Sauytbek Beksultan | 220103118 | Frontend Developer |

---

## License

This project was created as a final academic project. See [LICENSE](./LICENSE) for details.