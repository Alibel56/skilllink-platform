import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from src.backend.app.db.models import SpecialistImage, Accreditation


class FileDao:
    @staticmethod
    async def get_avatar(session: AsyncSession, specialist_id: uuid.UUID):
        result = await session.execute(
            text("""
                SELECT image_data, content_type
                FROM specialist_images
                WHERE specialist_id = :specialist_id
                ORDER BY uploaded_at DESC
                LIMIT 1
            """),
            {"specialist_id": str(specialist_id)}
        )
        return result.first()

    @staticmethod
    async def get_accreditation(session: AsyncSession, specialist_id: uuid.UUID):
        result = await session.execute(
            text("""
                 SELECT pdf_data, content_type
                 FROM accreditation
                 WHERE specialist_id = :specialist_id
                 ORDER BY uploaded_at DESC LIMIT 1
                 """),
            {"specialist_id": str(specialist_id)}
        )
        return result.first()

    @staticmethod
    async def delete_avatar(session: AsyncSession, avatar: SpecialistImage):
        await session.delete(avatar)
        await session.flush()

    @staticmethod
    async def delete_accreditation(session: AsyncSession, accreditation: Accreditation):
        await session.delete(accreditation)
        await session.flush()
