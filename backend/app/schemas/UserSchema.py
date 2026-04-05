import uuid
from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field
from backend.app.db.models.enums import UserRole

class UserBase(BaseModel):
    name: str
    surname: str
    birth_date: date
    phone: str = Field(min_length=8)
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class UserDto(UserBase):
    id: uuid.UUID
    role: UserRole
    created_at: datetime
    model_config = {"from_attributes": True}