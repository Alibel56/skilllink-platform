from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import DateTime
from sqlmodel import SQLModel, Field, Relationship

from backend.app.db.models.enums import LogType, ServiceType

if TYPE_CHECKING:
    from backend.app.db.models.user import User

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_log"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    log_type: LogType
    detail: Optional[str] = None
    service: ServiceType
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships
    user: Optional["User"] = Relationship(
        back_populates="audit_logs",
        sa_relationship_kwargs={"lazy": "selectin"}
    )
