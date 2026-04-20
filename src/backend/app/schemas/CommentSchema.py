import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CommentBase(BaseModel):
    comment: str = Field(min_length=1, max_length=1000)
    specialist_id: uuid.UUID

class CommentCreate(CommentBase):
    pass

class CommentDto(CommentBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    model_config = {"from_attributes": True}

class CommentFilter(BaseModel):
    specialist_id: uuid.UUID | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None