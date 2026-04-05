from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import SQLModel, Field, Relationship

from backend.app.db.models.enums import RequestStatus

if TYPE_CHECKING:
    from backend.app.db.models.user import User
    from backend.app.db.models.specialist import Specialist
    from backend.app.db.models.orders import Order

class OrderRequest(SQLModel, table=True):
    __tablename__ = "order_requests"

    __table_args__ = (
        UniqueConstraint("order_id", "specialist_id"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    specialist_id: uuid.UUID = Field(foreign_key="specialist.id")
    order_id: uuid.UUID = Field(foreign_key="orders.id")
    status: RequestStatus = Field(default=RequestStatus.PENDING)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships
    user: Optional[User] = Relationship(back_populates="order_requests", sa_relationship_kwargs={"lazy": "selectin"})
    specialist: Optional[Specialist] = Relationship(back_populates="order_requests", sa_relationship_kwargs={"lazy": "selectin"})
    orders: Optional["Order"] = Relationship(back_populates="order_requests", sa_relationship_kwargs={"lazy": "selectin"})