from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.dao.CommentDao import CommentDao
from src.backend.app.schemas.CommentSchema import CommentCreate
from src.backend.app.validation.Validators import _raise_if_errors


class CommentValidator:

    @staticmethod
    async def ensure_can_comment(
        session: AsyncSession,
        user_id: uuid.UUID,
        data: CommentCreate,
        has_completed_order: bool,
    ) -> None:
        """
        Оставить комментарий можно только после завершённого заказа
        и только один раз.
        """
        errors: list[str] = []

        if not has_completed_order:
            errors.append("You can only comment a specialist after a completed order")

        if await CommentDao.get_user_comment(session, user_id, data.specialist_id):
            errors.append("You have already commented on this specialist")

        _raise_if_errors(errors)