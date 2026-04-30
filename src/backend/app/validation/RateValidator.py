from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.dao.RateDao import RateDao
from src.backend.app.schemas.RateSchema import RateCreate
from src.backend.app.validation.Validators import _raise_if_errors


class RateValidator:

    @staticmethod
    async def ensure_can_rate(
        session: AsyncSession,
        user_id: uuid.UUID,
        data: RateCreate,
        has_completed_order: bool,
    ) -> None:
        """
        Оценить специалиста можно только после завершённого заказа
        и только один раз.
        """
        errors: list[str] = []

        if not has_completed_order:
            errors.append("You can only rate a specialist after a completed order")

        if await RateDao.get_user_rate(session, user_id, data.specialist_id):
            errors.append("You have already rated this specialist")

        _raise_if_errors(errors)