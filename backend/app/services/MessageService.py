import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.models.message import Message
from backend.app.schemas.MessageSchema import MessageCreate
from backend.app.dao.MessageDao import MessageDao

class MessageService:

    @staticmethod
    async def create(
        session: AsyncSession,
        order_id: uuid.UUID,
        sender_id: uuid.UUID,
        data: MessageCreate
    ) -> Message:
        await MessageDao.check_order_participant(session, order_id, sender_id)

        message = Message(
            order_id=order_id,
            sender_id=sender_id,
            **data.model_dump()
        )
        result = await MessageDao.create(session, message)
        return result

    @staticmethod
    async def get_by_order_id(
        session: AsyncSession,
        order_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> list[Message]:
        await MessageDao.check_order_participant(session, order_id, user_id)

        result = await MessageDao.get_by_order_id(session, order_id)
        return result