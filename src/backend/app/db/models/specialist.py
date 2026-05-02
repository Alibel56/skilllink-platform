from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import DateTime
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from src.backend.app.db.models.user import User
    from src.backend.app.db.models.catalog import Catalog
    from src.backend.app.db.models.accreditation import Accreditation
    from src.backend.app.db.models.orders import Order
    from src.backend.app.db.models.rate import Rate
    from src.backend.app.db.models.comment import Comment
    from src.backend.app.db.models.order_request import OrderRequest

class Specialist(SQLModel, table=True):
    __tablename__ = "specialist"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", unique=True)
    h3_index: Optional[str] = None
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships — без selectin. Подгружаются явно в DAO где нужно.
    # accreditations намеренно без eager load — содержат LargeBinary (PDF).
    # Используй FileDao.get_accreditation() напрямую.
    user: Optional["User"] = Relationship(back_populates="specialist")
    catalog: list["Catalog"] = Relationship(back_populates="specialist")
    accreditations: list["Accreditation"] = Relationship(back_populates="specialist")
    orders: list["Order"] = Relationship(back_populates="specialist")
    rates: list["Rate"] = Relationship(back_populates="specialist")
    comments: list["Comment"] = Relationship(back_populates="specialist")
    order_requests: list["OrderRequest"] = Relationship(back_populates="specialist")