import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.dao.FileDao import FileDao


class FileService:

    @staticmethod
    async def get_avatar(session: AsyncSession, user_id: uuid.UUID):
        return await FileDao.get_avatar(session, user_id)

    @staticmethod
    async def get_accreditation(session: AsyncSession, specialist_id: uuid.UUID):
        return await FileDao.get_accreditation(session, specialist_id)

    @staticmethod
    async def delete_avatar(session: AsyncSession, user_id: uuid.UUID) -> int:
        return await FileDao.delete_avatar(session, user_id)

    @staticmethod
    async def delete_accreditation(
        session: AsyncSession, specialist_id: uuid.UUID
    ) -> int:
        return await FileDao.delete_accreditation(session, specialist_id)
