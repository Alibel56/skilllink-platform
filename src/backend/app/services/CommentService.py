import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.db.models.comment import Comment
from src.backend.app.exceptions.NotFoundException import NotFoundException
from src.backend.app.schemas.CommentSchema import CommentCreate, CommentFilter
from src.backend.app.dao.CommentDao import CommentDao
from src.backend.app.validation.CreateValidation import CreateValidation

class CommentService:

    @staticmethod
    async def create(
        session: AsyncSession,
        user_id: uuid.UUID,
        data: CommentCreate
    ) -> Comment:
        has_order = await CommentDao.check_completed_order(
            session, user_id, data.specialist_id
        )
        await CreateValidation.is_valid_comment(session, user_id, data, has_order)

        comment = Comment(user_id=user_id, **data.model_dump())
        result = await CommentDao.create(session, comment)
        return result

    @staticmethod
    async def get_user_comment(
        session: AsyncSession,
        user_id: uuid.UUID,
        specialist_id: uuid.UUID
    ) -> Optional[Comment]:
        result = await CommentDao.get_user_comment(session, user_id, specialist_id)
        return result

    @staticmethod
    async def get_all(
            session: AsyncSession,
            filters: CommentFilter,
            limit: Optional[int] = None,
            offset: Optional[int] = None
    ) -> list[Comment]:
        result = await CommentDao.get_all(session, filters,limit,offset)
        return result

    @staticmethod
    async def delete(
            session: AsyncSession,
            user_id: uuid.UUID,
            specialist_id: uuid.UUID
    ) -> None:
        comment = await CommentDao.get_user_comment(session, user_id, specialist_id)
        if comment is None:
            raise NotFoundException("Comment not found")
        await CommentDao.delete(session, comment)