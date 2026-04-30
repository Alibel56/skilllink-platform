from __future__ import annotations

from src.backend.app.exceptions.Base import ValidationException

# ─────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────

def _raise_if_errors(errors: list[str]) -> None:
    """Бросает ValidationException, если список ошибок не пуст."""
    if errors:
        raise ValidationException(errors)


