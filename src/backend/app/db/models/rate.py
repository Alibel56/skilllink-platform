from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import UniqueConstraint, DateTime
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from src.backend.app.db.models.user import User
    from src.backend.app.db.models.specialist import Specialist

class Rate(SQLModel, table=True):
    __tablename__ = "rate"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    specialist_id: uuid.UUID = Field(foreign_key="specialist.id")
    rate: int = Field(ge=1, le=5)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships
    user: Optional["User"] = Relationship(
        back_populates="rates",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    specialist: Optional["Specialist"] = Relationship(
        back_populates="rates",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    __table_args__ = (UniqueConstraint("user_id", "specialist_id"),)
