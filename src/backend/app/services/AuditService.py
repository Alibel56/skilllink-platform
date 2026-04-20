import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.db.models.auditLog import AuditLog
from src.backend.app.db.models.enums import LogType, ServiceType
from src.backend.app.dao.AuditDao import AuditDao

class AuditService:

    @staticmethod
    async def log(
        session: AsyncSession,
        log_type: LogType,
        service: ServiceType,
        user_id: Optional[uuid.UUID] = None,
        detail: Optional[str] = None
    ) -> AuditLog:
        entry = AuditLog(
            user_id=user_id,
            log_type=log_type,
            detail=detail,
            service=service
        )
        result = await AuditDao.log(session, entry)
        return result