import uuid
from datetime import datetime

from pydantic import BaseModel

class AddressBase(BaseModel):
    country: str
    city: str
    street: str

class AddressCreate(AddressBase):
    lat: float
    lon: float

class AddressDto(AddressBase):
    id: uuid.UUID
    user_id: uuid.UUID
    h3_index: str
    created_at: datetime
    model_config = {"from_attributes": True}

