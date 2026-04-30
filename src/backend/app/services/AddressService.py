import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.db.models.address import Address
from src.backend.app.schemas.AddressSchema import AddressCreate
from src.backend.app.services.h3Service import H3Service
from src.backend.app.dao.AddressDao import AddressDao
from src.backend.app.validation.AddressValidator import AddressValidator

class AddressService:

    @staticmethod
    async def create(
        session: AsyncSession,
        user_id: uuid.UUID,
        data: AddressCreate,
    ) -> Address:
        await AddressValidator.ensure_can_create(session, user_id)

        h3_index = H3Service.geo_to_h3(data.lat, data.lon)

        address = Address(
            user_id=user_id,
            **data.model_dump(exclude={"lat", "lon"}),
            h3_index=h3_index
        )

        result = await AddressDao.create(session, address)
        return result

    @staticmethod
    async def get_by_user_id(
            session: AsyncSession,
            user_id: uuid.UUID
    ) -> Optional[Address]:
        result = await AddressDao.get_by_user_id(session, user_id)
        return result


    @staticmethod
    async def delete(
            session: AsyncSession,
            user_id: uuid.UUID
    ) -> None:
        address = await AddressDao.get_by_user_id(session, user_id)
        await AddressDao.delete(session, address)