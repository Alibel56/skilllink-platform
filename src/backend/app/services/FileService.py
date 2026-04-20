import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.dao.FileDao import FileDao


class FileService:

    @staticmethod
    async def get_avatar(session: AsyncSession, specialist_id: uuid.UUID):
        result = await FileDao.get_avatar(session, specialist_id)
        return result

    @staticmethod
    async def get_accreditation(session: AsyncSession, specialist_id: uuid.UUID):
        result = await FileDao.get_accreditation(session, specialist_id)
        return result

    @staticmethod
    async def delete_avatar(session: AsyncSession, specialist_id: uuid.UUID):
        avatar = await FileDao.get_avatar(session, specialist_id)
        await FileDao.delete_avatar(session, avatar)

    @staticmethod
    async def delete_accreditation(session: AsyncSession, specialist_id: uuid.UUID):
        accreditation = await FileDao.get_accreditation(session, specialist_id)
        await FileDao.delete_accreditation(session, accreditation)

