import uuid
from datetime import datetime

from pydantic import BaseModel


class AccreditationBase(BaseModel):
    file_url: str

class AccreditationCreate(AccreditationBase):
    pass

class AccreditationDto(AccreditationBase):
    id: uuid.UUID
    specialist_id: uuid.UUID
    created_at: datetime
    model_config = {"from_attributes": True}