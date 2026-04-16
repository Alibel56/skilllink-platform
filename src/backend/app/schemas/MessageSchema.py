import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    message: str = Field(min_length=1, max_length=2000)

class MessageCreate(MessageBase):
    pass

class MessageDto(MessageBase):
    id: uuid.UUID
    order_id: uuid.UUID
    sender_id: uuid.UUID
    created_at: datetime
    model_config = {"from_attributes": True}