import time
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.backend.app.db.session import AsyncSessionFactory
from src.backend.app.db.models.enums import LogType, ServiceType
from src.backend.app.services.AuditService import AuditService
from src.backend.app.core.Security import decode_token

_TRUSTED_PROXIES = {"127.0.0.1", "::1"}

def _classify(status_code: int) -> LogType:
    if status_code >= 500:
        return LogType.ERROR
    if status_code >= 400:
        return LogType.DEBUG
    return LogType.INFO


def _detect_service(path: str) -> ServiceType:
    if "/files" in path:
        return ServiceType.FILE
    if "/address" in path:
        return ServiceType.ADDRESS
    if "/comment" in path:
        return ServiceType.COMMENT
    if "/message" in path:
        return ServiceType.MESSAGE
    if "/rate" in path:
        return ServiceType.RATE
    if "/auth" in path:
        return ServiceType.AUTH
    if "/specialists" in path:
        return ServiceType.SPECIALIST
    if "/orders" in path:
        return ServiceType.ORDER
    if "/users" in path:
        return ServiceType.USER
    if "/catalog" in path:
        return ServiceType.CATALOG
    if "/requests" in path:
        return ServiceType.REQUEST
    return ServiceType.HTTP

def _get_client_ip(request: Request) -> str:
    direct_ip = request.client.host if request.client else "unknown"

    if direct_ip in _TRUSTED_PROXIES:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

    return direct_ip

def _extract_user_id(request: Request) -> uuid.UUID | None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.removeprefix("Bearer ")
    payload = decode_token(token)
    if not payload:
        return None
    try:
        return uuid.UUID(payload.get("sub"))
    except Exception:
        return None

class LoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        user_id = _extract_user_id(request)
        client_ip = _get_client_ip(request)
        method = request.method
        url = request.url.path
        if request.url.query:
            url += f"?{request.url.query}"

        try:
            response: Response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000
            detail = f"{client_ip} - {method} - {url} - 500 - {elapsed_ms:.2f}ms"
            async with AsyncSessionFactory() as session:
                await AuditService.log(
                    session=session,
                    log_type=LogType.ERROR,
                    service=_detect_service(url),
                    user_id=user_id,
                    detail=detail,
                )
                await session.commit()
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        detail = f"{client_ip} - {method} - {url} - {status_code} - {elapsed_ms:.2f}ms"

        async with AsyncSessionFactory() as session:
            await AuditService.log(
                session=session,
                log_type=_classify(status_code),
                service=_detect_service(url),
                user_id=user_id,
                detail=detail,
            )
            await session.commit()

        return response

