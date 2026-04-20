from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import DateTime, LargeBinary
from sqlmodel import SQLModel, Field, Relationship, Column

if TYPE_CHECKING:
    from src.backend.app.db.models import Specialist

class Accreditation(SQLModel, table=True):
    __tablename__ = "accreditation"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    specialist_id: uuid.UUID = Field(foreign_key="specialist.id")
    pdf_data: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    content_type: str = Field(default="application/pdf")
    original_size_bytes: int
    compressed_size_bytes: int
    uploaded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships
    specialist: Optional["Specialist"] = Relationship(
        back_populates="accreditations",
        sa_relationship_kwargs={"lazy": "selectin"}
    )