import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.models.user import User
from backend.app.schemas.UserSchema import UserUpdate
from backend.app.dao.UserDao import UserDao
from backend.app.core.Security import hash_password


class UserService:

    @staticmethod
    async def get_by_id(session: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        result = await UserDao.get_by_id(session, user_id)
        return result

    @staticmethod
    async def get_by_email(session: AsyncSession, email: str) -> Optional[User]:
        result = await UserDao.get_by_email(session, email)
        return result

    @staticmethod
    async def update(session: AsyncSession, user: User, data: UserUpdate) -> User:
        update_data = data.model_dump(exclude_none=True)
        update_data.pop("role", None)

        if "password" in update_data:
            update_data["hashed_password"] = hash_password(update_data.pop("password"))

        result = await UserDao.update(session, user, update_data)
        return result

    @staticmethod
    async def delete(session: AsyncSession, user: User) -> None:
        await UserDao.delete(session, user)