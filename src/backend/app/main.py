from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Все модели должны быть импортированы ДО вызова create_all
from src.backend.app.api.v1.AuthRouter import router as auth_router
from src.backend.app.api.v1.CatalogRouter import router as catalog_router
from src.backend.app.api.v1.OrderRouter import router as order_router
from src.backend.app.api.v1.SpecialistRouter import router as specialist_router
from src.backend.app.api.v1.UserRouter import router as user_router
from src.backend.app.api.v1.RequestsRouter import router as request_router
from src.backend.app.api.v1.FileRouter import router as file_router
from src.backend.app.api.v1.AccreditationRouter import router as accreditation_router
from src.backend.app.api.v1.AddressRouter import router as address_router
from src.backend.app.api.v1.CommentRouter import router as comment_router
from src.backend.app.api.v1.MessageRouter import router as message_router
from src.backend.app.api.v1.RateRouter import router as rate_router

from src.backend.app.core.Redis import redis_client
from src.backend.app.core.dependencies import require_admin
from src.backend.app.db.models import User
from src.backend.app.db.session import engine
from src.backend.app.exceptions.Handlers import register_exception_handlers
from src.backend.app.middleware.middleware import LoggingMiddleware
from src.backend.app.middleware.rate_limit_middleware import RateLimitMiddleware
from src.backend.app.middleware.profiling_middleware import ProfilingMiddleware, get_latency_report


# -------------------------
# Lifespan FastAPI
# -------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await redis_client.ping()
        print("Redis connected ✅")
    except Exception as e:
        print(f"Couldn't connect to Redis ❌: {e}")

    yield

    await engine.dispose()
    await redis_client.aclose()


# -------------------------
# FASTAPI
# -------------------------
app = FastAPI(
    title="SkillLink API",
    description="Platform connecting clients with specialists",
    version="1.0.0",
    lifespan=lifespan
)

# ─────────────────────────────────────────────────────────
# Exception handlers
# ─────────────────────────────────────────────────────────
register_exception_handlers(app)


# -------------------------
# MIDDLEWARE
# -------------------------

# 1a. CORS
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(ProfilingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://skilllink.kz",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1a. TrustedHost
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "skilllink.kz",
        "*.skilllink.kz",
    ],
)

# -------------------------
# ROUTERS
# -------------------------
_V1 = "/api/v1"

app.include_router(auth_router,           prefix=_V1)
app.include_router(user_router,           prefix=_V1)
app.include_router(specialist_router,     prefix=_V1)
app.include_router(order_router,          prefix=_V1)
app.include_router(catalog_router,        prefix=_V1)
app.include_router(request_router,        prefix=_V1)
app.include_router(file_router,          prefix=_V1)
app.include_router(accreditation_router, prefix=_V1)
app.include_router(address_router,       prefix=_V1)
app.include_router(comment_router,       prefix=_V1)
app.include_router(message_router,       prefix=_V1)
app.include_router(rate_router,          prefix=_V1)



# -------------------------
# Health Check
# -------------------------
@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": "SkillLink API"}

@app.get("/api/v1/admin/profiling", tags=["Admin"])
async def profiling_report(current_user: User = Depends(require_admin)):
    return get_latency_report()