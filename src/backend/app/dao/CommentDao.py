import uuid
from typing import Optional, Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, Select

from src.backend.app.db.models.comment import Comment
from src.backend.app.db.models.enums import OrderStatus
from src.backend.app.db.models.orders import Order
from src.backend.app.schemas.CommentSchema import CommentFilter


class CommentDao:

    @staticmethod
    async def create(session: AsyncSession, comment: Comment) -> Comment:
        session.add(comment)
        await session.flush()
        return comment

    @staticmethod
    async def get_user_comment(
        session: AsyncSession,
        user_id: uuid.UUID,
        specialist_id: uuid.UUID
    ) -> Optional[Comment]:
        query = (
            select(Comment).where(
                Comment.specialist_id == specialist_id,
                Comment.user_id == user_id
            )
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all(
            session: AsyncSession,
            filters: CommentFilter,
            limit: Optional[int] = None,
            offset: Optional[int] = None
    ) -> Sequence[Comment]:
        query = (
            select(Comment)
        )
        query = CommentDao.apply_filters(query, filters)
        query = query.limit(limit or 50).offset(offset or 0)
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def delete(
        session: AsyncSession,
        comment: Comment
    ) -> None:
        await session.delete(comment)
        await session.flush()

    @staticmethod
    async def check_completed_order(
        session: AsyncSession,
        user_id: uuid.UUID,
        specialist_id: uuid.UUID
    ) -> bool:
        result = await session.execute(
            select(Order).where(
                Order.user_id == user_id,
                Order.specialist_id == specialist_id,
                Order.status == OrderStatus.completed
            )
        )
        return result.scalar_one_or_none() is not None

    @staticmethod
    def apply_filters(query: Select, filters: CommentFilter) -> Select:

        if filters.specialist_id:
            query = query.where(Comment.specialist_id == filters.specialist_id)

        if filters.date_from:
            query = query.where(Comment.created_at >= filters.date_from)

        if filters.date_to:
            query = query.where(Comment.created_at <= filters.date_to)

        return query