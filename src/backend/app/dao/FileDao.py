import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


class FileDao:
    @staticmethod
    async def get_avatar(session: AsyncSession, user_id: uuid.UUID):
        result = await session.execute(
            text("""
                SELECT image_data, content_type
                FROM user_images
                WHERE user_id = :user_id
                ORDER BY uploaded_at DESC
                LIMIT 1
            """),
            {"user_id": str(user_id)}
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
    async def delete_avatar(session: AsyncSession, user_id: uuid.UUID) -> int:
        """Delete every avatar row for this user. Returns rows affected."""
        result = await session.execute(
            text("DELETE FROM user_images WHERE user_id = :uid"),
            {"uid": str(user_id)},
        )
        await session.flush()
        return result.rowcount or 0

    @staticmethod
    async def delete_accreditation(
        session: AsyncSession, specialist_id: uuid.UUID
    ) -> int:
        result = await session.execute(
            text("DELETE FROM accreditation WHERE specialist_id = :sid"),
            {"sid": str(specialist_id)},
        )
        await session.flush()
        return result.rowcount or 0
