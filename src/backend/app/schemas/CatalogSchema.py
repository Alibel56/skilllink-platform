import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CatalogBase(BaseModel):
    job_type: str
    price: float

class CatalogCreate(CatalogBase):
    pass

class CatalogUpdate(BaseModel):
    job_type: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)

class CatalogDto(CatalogBase):
    id: uuid.UUID
    specialist_id: uuid.UUID
    created_at: datetime
    model_config = {"from_attributes": True}

class CatalogFilter(BaseModel):
    job_type: str | None = None
    price_from: float | None = Field(default=None, ge=0)
    price_to: float | None = Field(default=None, ge=0)