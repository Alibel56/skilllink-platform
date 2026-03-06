from datetime import datetime, timezone
import uuid

from sqlalchemy import DateTime, func
from sqlmodel import SQLModel, Field


class H3ZoneStats(SQLModel, table=True):
    __tablename__ = "h3_zone_stats"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    h3_index: str = Field(index=True)
    total_orders: int = Field(default=0)
    completed_orders: int = Field(default=0)
    avg_price: float = Field(default=0)
    active_specialists: int = Field(default=0)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )
    updated_at: datetime = Field(
        sa_type=DateTime(timezone=True),
        nullable=False,
        sa_column_kwargs={
            "server_default": func.now(),
            "onupdate": func.now(),
        },
    )
