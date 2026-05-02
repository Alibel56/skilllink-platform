import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, LargeBinary, Column
from sqlmodel import SQLModel, Field

class UserImage(SQLModel, table=True):
    __tablename__ = "user_images"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    image_data: bytes = Field(sa_column=Column(LargeBinary, nullable=True))
    content_type: str = Field(default="image/jpeg")
    original_size_bytes: int
    compressed_size_bytes: int
    uploaded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )
    # Relationship убран — BLOB грузится только через FileDao.get_avatar().
    # Для cascade delete используй ON DELETE CASCADE на уровне миграции.