import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.models.auditLog import AuditLog
from backend.app.db.models.enums import AuditAction
from backend.app.dao.AuditDao import AuditDao

class AuditService:

    @staticmethod
    async def log(
        session: AsyncSession,
        action: AuditAction,
        user_id: Optional[uuid.UUID] = None,
        detail: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            detail=detail,
            ip_address=ip_address
        )
        result = await AuditDao.log(session, entry)
        return result

    @staticmethod
    async def get_all(
        session: AsyncSession,
        user_id: uuid.UUID | None = None,
        action: AuditAction | None = None,
        ip_address: str | None = None,
        dat_from: datetime | None = None,
        dat_to: datetime | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[AuditLog]:
        result = await AuditDao.get_all(
            session, user_id, action, ip_address, dat_from, dat_to, limit, offset
        )
        return result