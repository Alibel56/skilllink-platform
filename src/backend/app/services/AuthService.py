from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.dao.UserDao import UserDao
from src.backend.app.db.models.user import User
from src.backend.app.core.Security import hash_password, verify_password, create_access_token
from src.backend.app.exceptions.Base import UnauthorizedException, ForbiddenException
from src.backend.app.schemas.UserSchema import UserCreate
from src.backend.app.services.UserService import UserService
from src.backend.app.validation.UserValidator import UserValidator


class AuthService:

    @staticmethod
    async def register(session: AsyncSession, data: UserCreate) -> User:
        # Валидация вынесена в валидатор — сервис не знает деталей проверки
        await UserValidator.ensure_can_register(session, data)

        user = User(
            **data.model_dump(exclude={"password"}),
            hashed_password=hash_password(data.password),
        )
        await UserDao.create(session, user)
        return user

    @staticmethod
    async def login(session: AsyncSession, email: str, password: str) -> str:
        """
        Возвращает JWT-токен.

        БЫЛО: возвращал None при неверных данных → роутер делал ручную проверку.
        СТАЛО: бросает UnauthorizedException/ForbiddenException → единый обработчик.
        """
        user = await UserService.get_by_email(session, email)

        # Не раскрываем, существует ли email (защита от перебора)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_verified:
            raise ForbiddenException("Email not confirmed. Please check your inbox.")

        return create_access_token({"sub": str(user.id)})