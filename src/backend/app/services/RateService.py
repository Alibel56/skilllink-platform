import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.db.models.rate import Rate
from src.backend.app.exceptions.NotFoundException import NotFoundException
from src.backend.app.schemas.RateSchema import RateCreate
from src.backend.app.dao.RateDao import RateDao
from src.backend.app.validation.CreateValidation import CreateValidation

class RateService:

    @staticmethod
    async def create(
        session: AsyncSession,
        user_id: uuid.UUID,
        data: RateCreate
    ) -> Rate:
        has_order = await RateDao.check_completed_order(
            session, user_id, data.specialist_id
        )
        await CreateValidation.is_valid_rate(session, user_id, data, has_order)

        rate = Rate(user_id=user_id, **data.model_dump())
        result = await RateDao.create(session, rate)
        return result

    @staticmethod
    async def delete(
            session: AsyncSession,
            user_id: uuid.UUID,
            specialist_id: uuid.UUID
    ) -> None:
        rate = await RateDao.get_user_rate(session, user_id, specialist_id)
        if rate is None:
            raise NotFoundException("Rate not found")
        await RateDao.delete(session, rate)

    @staticmethod
    async def get_specialist_avg_rate(
        session: AsyncSession,
        specialist_id: uuid.UUID
    ) -> float:
        result = await RateDao.get_specialist_rates(session, specialist_id)
        return round(float(result), 2) if result is not None else 0.0

    @staticmethod
    async def get_user_rate(
        session: AsyncSession,
        user_id: uuid.UUID,
        specialist_id: uuid.UUID
    ) -> Rate | None:
        result = await RateDao.get_user_rate(session, user_id, specialist_id)
        return result

