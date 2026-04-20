import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from src.backend.app.db.models.enums import OrderStatus


class OrderBase(BaseModel):
    specialist_id: Optional[uuid.UUID] = None
    job_type: str
    description: Optional[str] = None
    price: float = Field(gt=0)

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    job_type: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    is_active: Optional[bool] = None

class OrderDto(OrderBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_active: bool
    status: OrderStatus
    created_at: datetime
    completed_at: Optional[datetime]
    model_config = {"from_attributes": True}