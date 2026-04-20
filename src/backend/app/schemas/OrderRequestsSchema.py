import uuid
from datetime import datetime

from pydantic import BaseModel

from src.backend.app.db.models.enums import RequestStatus


class OrderRequestsBase(BaseModel):
    user_id: uuid.UUID
    specialist_id: uuid.UUID
    order_id: uuid.UUID

class OrderRequestCreate(OrderRequestsBase):
    pass

class OrderRequestsDto(OrderRequestsBase):
    id: uuid.UUID
    status: RequestStatus
    created_at: datetime