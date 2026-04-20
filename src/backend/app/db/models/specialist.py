from datetime import datetime, date, timezone
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
    from src.backend.app.db.models.specialist_image import SpecialistImage

class Specialist(SQLModel, table=True):
    __tablename__ = "specialist"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", unique=True)
    h3_index: Optional[str] = None  # for search by location
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)  # ABAC: only verified specialist can take orders
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships
    user: Optional["User"] = Relationship(
        back_populates="specialist",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    catalog: list["Catalog"] = Relationship(
        back_populates="specialist",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    accreditations: list["Accreditation"] = Relationship(
        back_populates="specialist",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    orders: list["Order"] = Relationship(
        back_populates="specialist",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    rates: list["Rate"] = Relationship(
        back_populates="specialist",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    comments: list["Comment"] = Relationship(
        back_populates="specialist",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    order_requests: list["OrderRequest"] = Relationship(
        back_populates="specialist",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    images: list["SpecialistImage"] = Relationship(
        back_populates="specialist",
        sa_relationship_kwargs={"lazy": "selectin"}
    )