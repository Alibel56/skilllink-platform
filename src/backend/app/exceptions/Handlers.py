from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.backend.app.exceptions.Base import (
    AppException,
    BadRequestException,
    ConflictException,
    FileTooLargeException,
    ForbiddenException,
    InvalidFileTypeException,
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────
# Маппинг исключений → машиночитаемый код
# ─────────────────────────────────────────────────────────

_CODE_MAP: dict[type[AppException], str] = {
    ValidationException: "VALIDATION_ERROR",
    ConflictException: "CONFLICT",
    NotFoundException: "NOT_FOUND",
    ForbiddenException: "FORBIDDEN",
    UnauthorizedException: "UNAUTHORIZED",
    BadRequestException: "BAD_REQUEST",
    FileTooLargeException: "FILE_TOO_LARGE",
    InvalidFileTypeException: "INVALID_FILE_TYPE",
}


def _error_code(exc: AppException) -> str:
    return _CODE_MAP.get(type(exc), "INTERNAL_ERROR")


# ─────────────────────────────────────────────────────────
# Построитель ответа
# ─────────────────────────────────────────────────────────

def _make_response(
    status_code: int,
    code: str,
    message: str | list[str],
    details: list[str] | None = None,
) -> JSONResponse:
    content: dict = {
        "error": {
            "code": code,
            "message": message if isinstance(message, str) else "; ".join(message),
        }
    }
    if details:
        content["error"]["details"] = details

    return JSONResponse(status_code=status_code, content=content)


# ─────────────────────────────────────────────────────────
# Обработчики
# ─────────────────────────────────────────────────────────

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Единая точка обработки всех доменных исключений."""
    code = _error_code(exc)

    # ValidationException хранит список ошибок
    if isinstance(exc, ValidationException):
        return _make_response(
            status_code=exc.status_code,
            code=code,
            message="Validation failed",
            details=exc.errors,
        )

    # ConflictException может прийти со списком или строкой
    if isinstance(exc, ConflictException) and isinstance(exc.detail, list):
        return _make_response(
            status_code=exc.status_code,
            code=code,
            message="Conflict",
            details=exc.detail,
        )

    return _make_response(
        status_code=exc.status_code,
        code=code,
        message=str(exc.detail),
    )


async def request_validation_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Обрабатывает ошибки Pydantic/FastAPI-валидации (422 из схем).
    Приводит их к тому же формату, что и наши кастомные ошибки.
    """
    details = [
        f"{' → '.join(str(loc) for loc in err['loc'])}: {err['msg']}"
        for err in exc.errors()
    ]
    return _make_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code="REQUEST_VALIDATION_ERROR",
        message="Request validation failed",
        details=details,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Последний рубеж — ловим всё, что не поймали выше.
    Логируем полный traceback, клиенту возвращаем безопасный 500.
    """
    logger.exception(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
        exc_info=exc,
    )
    return _make_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_ERROR",
        message="An unexpected error occurred. Please try again later.",
    )


# ─────────────────────────────────────────────────────────
# Регистрация
# ─────────────────────────────────────────────────────────

def register_exception_handlers(app: FastAPI) -> None:
    """
    Подключает все обработчики к FastAPI-приложению.

    Вызвать один раз в main.py:
        register_exception_handlers(app)
    """
    app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, request_validation_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)