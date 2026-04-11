from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import DateTime
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.app.db.models.orders import Order
    from backend.app.db.models.user import User

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    order_id: uuid.UUID = Field(foreign_key="orders.id")
    sender_id: uuid.UUID = Field(foreign_key="users.id")
    message: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships
    orders: Optional["Order"] = Relationship(
        back_populates="messages",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    sender: Optional["User"] = Relationship(
        back_populates="messages",
        sa_relationship_kwargs={"lazy": "selectin"}
    )