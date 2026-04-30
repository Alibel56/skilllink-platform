from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.dao.AddressDao import AddressDao
from src.backend.app.exceptions.Base import (
    ConflictException,
)

class AddressValidator:

    @staticmethod
    async def ensure_can_create(session: AsyncSession, user_id: uuid.UUID) -> None:
        """У пользователя может быть только один адрес."""
        if await AddressDao.get_by_user_id(session, user_id):
            raise ConflictException("Address already exists for this user")