import uuid
from typing import Optional, Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.db.models.message import Message
from backend.app.db.models.order import Order
from backend.app.db.models.specialist import Specialist

class MessageDao:

    @staticmethod
    async def create(
        session: AsyncSession,
        message: Message,
    ) -> Message:

        session.add(message)
        await session.flush()
        return message

    @staticmethod
    async def get_by_order_id(
        session: AsyncSession,
        order_id: uuid.UUID
    ) -> Sequence[Message]:

        result = await session.execute(
            select(Message)
            .where(Message.order_id == order_id)
            .order_by(Message.created_at.asc())
        )
        return result.scalars().all()


    @staticmethod
    async def check_order_participant(
        session: AsyncSession,
        order_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Order:

        result = await session.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()

        if not order:
            raise ValueError("Order not found")

        specialist_result = await session.execute(
            select(Specialist).where(Specialist.id == order.specialist_id)
        )
        specialist = specialist_result.scalar_one_or_none()
        specialist_user_id = specialist.user_id if specialist else None

        if order.user_id != user_id and specialist_user_id != user_id:
            raise ValueError("You are not a participant of this order")

        return order