from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.dao.UserDao import UserDao
from src.backend.app.exceptions.Base import (
    ConflictException,
)
from src.backend.app.schemas.UserSchema import UserCreate

class UserValidator:

    @staticmethod
    async def ensure_can_register(session: AsyncSession, data: UserCreate) -> None:
        """
        Проверяет уникальность email и телефона перед регистрацией.

        Использует ConflictException (409), а не ValidationException (422),
        потому что это семантически «конфликт ресурсов», а не «плохие данные».
        """
        errors: list[str] = []

        if await UserDao.get_by_email(session, data.email):
            errors.append("User with this email already exists")

        if await UserDao.get_by_phone(session, data.phone):
            errors.append("User with this phone already exists")

        if errors:
            raise ConflictException(errors)