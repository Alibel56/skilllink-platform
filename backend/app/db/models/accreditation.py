from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import DateTime
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.app.db.models.specialist import Specialist

class Accreditation(SQLModel, table=True):
    __tablename__ = "accreditation"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    specialist_id: uuid.UUID = Field(foreign_key="specialist.id")
    file_url: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships
    specialist: Optional[Specialist] = Relationship(back_populates="accreditations", sa_relationship_kwargs={"lazy": "selectin"})
