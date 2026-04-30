from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.dao.SpecialistDao import SpecialistDao
from src.backend.app.db.models.specialist import Specialist
from src.backend.app.exceptions.Base import (
    ConflictException,
    ForbiddenException,
    NotFoundException
)

class SpecialistValidator:

    @staticmethod
    async def ensure_can_create(session: AsyncSession, user_id: uuid.UUID) -> None:
        """Пользователь не может иметь больше одного профиля специалиста."""
        if await SpecialistDao.get_by_user_id(session, user_id):
            raise ConflictException("Specialist profile already exists for this user")

    @staticmethod
    async def ensure_verified(specialist: Specialist | None) -> None:
        """
        Гарантирует, что специалист существует и верифицирован.

        Используется перед операциями, которые требуют верификации
        (создание каталога, взятие заказа).
        """
        if specialist is None:
            raise NotFoundException("Specialist not found")
        if not specialist.is_verified:
            raise ForbiddenException("Specialist is not verified")
        if not specialist.is_active:
            raise ForbiddenException("Specialist profile is not active")
