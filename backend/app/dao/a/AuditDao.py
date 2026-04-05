import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from backend.app.db.models.auditLog import AuditLog
from backend.app.db.models.enums import AuditAction


class AuditDao:

    @staticmethod
    async def log(session: AsyncSession, entry: AuditLog):
        session.add(entry)
        await session.flush()
        return entry

    @staticmethod
    async def get_all(
            session: AsyncSession,
            user_id: uuid.UUID | None = None,
            action: AuditAction | None = None,
            ip_address: str | None = None,
            dat_from: datetime | None = None,
            dat_to: datetime | None = None,
            limit: int | None  = 50,
            offset: int | None = 0
    ) -> list[AuditLog]:

        query = select(AuditLog)
        if limit is None:
            limit = 50
        if offset is None:
            offset = 0
        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        if action:
            query = query.where(AuditLog.action == action)
        if ip_address:
            query = query.where(AuditLog.ip_address == ip_address)
        if dat_from:
            query = query.where(AuditLog.created_at >= dat_from)
        if dat_to:
            query = query.where(AuditLog.created_at <= dat_to)
        query = (
            query
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

        result = await session.execute(query)
        return result.scalars().all()

