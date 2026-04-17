import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RateBase(BaseModel):
    rate: int = Field(ge=1, le=5)
    specialist_id: uuid.UUID

class RateCreate(RateBase):
    pass

class RateDto(RateBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    model_config = {"from_attributes": True}