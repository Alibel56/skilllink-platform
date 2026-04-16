from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import DateTime
from sqlmodel import SQLModel, Field, Relationship

from backend.app.db.models.enums import OrderStatus
if TYPE_CHECKING:
    from backend.app.db.models.user import User
    from backend.app.db.models.specialist import Specialist
    from backend.app.db.models.message import Message
    from backend.app.db.models.order_request import OrderRequest

class Order(SQLModel, table=True):
    __tablename__ = "orders"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    specialist_id: Optional[uuid.UUID] = Field(default=None, foreign_key="specialist.id")  # nullable, clients create order by themselves
    job_type: str
    description: Optional[str] = None
    price: float
    is_active: bool = Field(default=True)
    status: OrderStatus = Field(default=OrderStatus.open)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )
    completed_at: Optional[datetime] = None

    # Relationships
    user: Optional["User"] = Relationship(
        back_populates="orders",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    specialist: Optional["Specialist"] = Relationship(
        back_populates="orders",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    messages: list["Message"] = Relationship(
        back_populates="orders",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    order_requests: list["OrderRequest"] = Relationship(
        back_populates="orders",
        sa_relationship_kwargs={"lazy": "selectin"}
    )