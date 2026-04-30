from __future__ import annotations

from typing import Any


# ─────────────────────────────────────────────────────────
# BASE
# ─────────────────────────────────────────────────────────

class AppException(Exception):

    status_code: int = 500
    detail: Any = "Internal server error"

    def __init__(self, detail: Any = None) -> None:
        if detail is not None:
            self.detail = detail
        super().__init__(str(self.detail))

# ─────────────────────────────────────────────────────────
# 400-е — клиентские ошибки
# ─────────────────────────────────────────────────────────

class BadRequestException(AppException):
    """400 — некорректный запрос (общий случай)."""
    status_code = 400
    detail = "Bad request"


class ValidationException(AppException):
    """422 — доменная/бизнес-валидация не прошла."""
    status_code = 422
    def __init__(self, errors: list[str]) -> None:
        self.errors = errors
        super().__init__(detail=errors)


class ConflictException(AppException):
    """409 — ресурс уже существует (дубликат)."""
    status_code = 409
    detail = "Resource already exists"


class ForbiddenException(AppException):
    """403 — нет прав на выполнение операции."""
    status_code = 403
    detail = "Forbidden"


class UnauthorizedException(AppException):
    """401 — не аутентифицирован."""
    status_code = 401
    detail = "Unauthorized"


# ─────────────────────────────────────────────────────────
# 404
# ─────────────────────────────────────────────────────────

class NotFoundException(AppException):
    """404 — ресурс не найден."""
    status_code = 404
    detail = "Not found"


# ─────────────────────────────────────────────────────────
# 413
# ─────────────────────────────────────────────────────────

class FileTooLargeException(AppException):
    """413 — загружаемый файл превышает допустимый размер."""
    status_code = 413
    detail = "File too large"


class InvalidFileTypeException(BadRequestException):
    """400 — неподходящий тип файла."""
    detail = "Invalid file type"