from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from src.backend.app.dao.UserDao import UserDao
from src.backend.app.db.models.user import User
from src.backend.app.core.Security import hash_password, verify_password, create_access_token
from src.backend.app.schemas.UserSchema import UserCreate
from src.backend.app.services.UserService import UserService
from src.backend.app.validation.CreateValidation import CreateValidation


class AuthService:

    @staticmethod
    async def register(session: AsyncSession, data: UserCreate) -> User:
        await CreateValidation.is_valid_user(session, data)

        user = User(
            **data.model_dump(exclude={"password"}),
            hashed_password=hash_password(data.password)
        )

        await UserDao.create(session, user)
        return user

    @staticmethod
    async def login(session: AsyncSession, email: str, password: str):
        user = await UserService.get_by_email(session, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not confirmed. Please check your inbox.",
            )

        token = create_access_token({"sub": str(user.id)})
        return token