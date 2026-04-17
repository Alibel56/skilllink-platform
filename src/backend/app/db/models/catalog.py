from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import DateTime
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.app.db.models.specialist import Specialist

class Catalog(SQLModel, table=True):
    __tablename__ = "catalog"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    specialist_id: uuid.UUID = Field(foreign_key="specialist.id")
    job_type: str
    price: float
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships
    specialist: Optional["Specialist"] = Relationship(
        back_populates="catalog",
        sa_relationship_kwargs={"lazy": "selectin"}
    )