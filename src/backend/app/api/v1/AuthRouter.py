import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import secrets

from src.backend.app.exceptions.Base import UnauthorizedException, NotFoundException
from src.backend.app.tasks.email_tasks import send_password_reset
from src.backend.app.core.Redis import redis_client
from src.backend.app.core.Security import decode_token, hash_password
from src.backend.app.core.dependencies import bearer_scheme
from src.backend.app.core.dependencies import get_current_user
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session
from src.backend.app.schemas.LoginSchema import LoginRequest, ResetPasswordRequest
from src.backend.app.schemas.UserSchema import UserCreate
from src.backend.app.services.AuthService import AuthService
from src.backend.app.services.UserService import UserService
from src.backend.app.services.TokenBlocklistService import TokenBlocklistService
from src.backend.app.tasks.email_tasks import send_email_confirmation

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/register", response_model=dict[str, str])
async def register(
        data: UserCreate,
        session: AsyncSession = Depends(get_session),
):
    user = await AuthService.register(session, data)

    confirmation_token = secrets.token_urlsafe(32)
    await redis_client.setex(f"confirm:{confirmation_token}", 86400, str(user.id))
    send_email_confirmation.delay(
        user_email=user.email, user_name=user.name, token=confirmation_token
    )

    return {"message": "User created successfully", "user_id": str(user.id)}


@router.get("/confirm-email")
async def confirm_email(
        token: str,
        session: AsyncSession = Depends(get_session)
):
    user_id = await redis_client.get(f"confirm:{token}")
    if not user_id:
        raise UnauthorizedException("Invalid or expired confirmation token")

    user = await UserService.get_by_id(session, uuid.UUID(user_id))
    if not user:
        raise NotFoundException("User not found")

    user.is_verified = True
    await session.commit()
    await redis_client.delete(f"confirm:{token}")

    return {"message": "Email confirmed successfully"}


@router.post("/login", response_model=dict[str, str])
async def login(
        data: LoginRequest,
        session: AsyncSession = Depends(get_session)
):
    token = await AuthService.login(session, data.email, data.password)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/logout", response_model=dict[str, str])
async def logout(
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise UnauthorizedException("Invalid token")

    jti = payload.get("jti")
    exp = payload.get("exp")
    ttl = exp - int(datetime.now(tz=timezone.utc).timestamp())
    await TokenBlocklistService.add(jti, ttl)

    return {"message": "Successfully logged out"}


@router.post("/forgot-password")
async def forgot_password(
        email: str,
        session: AsyncSession = Depends(get_session)
):
    user = await UserService.get_by_email(session, email)
    if not user:
        return {"message": "If that email exists, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    await redis_client.setex(f"reset:{token}", 1800, str(user.id))
    send_password_reset.delay(user_email=user.email, user_name=user.name, token=token)

    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(
        data: ResetPasswordRequest,
        session: AsyncSession = Depends(get_session)
):
    user_id = await redis_client.get(f"reset:{data.token}")
    if not user_id:
        raise UnauthorizedException("Invalid or expired reset token")

    user = await UserService.get_by_id(session, uuid.UUID(user_id))
    if not user:
        raise NotFoundException("User not found")

    user.hashed_password = hash_password(data.new_password)
    await session.commit()
    await redis_client.delete(f"reset:{data.token}")

    return {"message": "Password reset successfully"}