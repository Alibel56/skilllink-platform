from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.db.models.auditLog import AuditLog


class AuditDao:

    @staticmethod
    async def log(session: AsyncSession, entry: AuditLog):
        session.add(entry)
        await session.flush()
        return entry

