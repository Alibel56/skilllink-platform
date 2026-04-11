from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import DateTime
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.app.db.models.user import User

class Address(SQLModel, table=True):
    __tablename__ = "address"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", unique=True)
    country: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    h3_index: Optional[str] = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships
    user: Optional["User"] = Relationship(
        back_populates="address",
        sa_relationship_kwargs={"lazy": "selectin"}
    )