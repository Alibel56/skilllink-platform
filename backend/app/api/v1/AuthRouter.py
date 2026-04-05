from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_current_user
from backend.app.db.models.user import User
from backend.app.schemas.UserSchema import UserCreate
from backend.app.schemas.LoginSchema import LoginRequest
from backend.app.services.AuthService import AuthService
from backend.app.services.a.AuditService import AuditService
from backend.app.db.session import get_session
from backend.app.db.models.enums import LogType, ServiceType
from backend.app.services.a.TokenBlocklistService import TokenBlocklistService
from backend.app.core.Security import decode_token
from backend.app.core.dependencies import bearer_scheme
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/register", response_model=dict[str, str])
async def register(
    request: Request,
    data: UserCreate,
    session: AsyncSession = Depends(get_session)
):
    user = await AuthService.register(session, data)

    await AuditService.log(
        session=session,
        log_type=LogType.INFO,
        service=ServiceType.AUTH,
        user_id=user.id,
        detail=f"{request.client.host} - POST - /register - 200"
    )

    return {
        "message": "User created successfully",
        "user_id": str(user.id)
    }


@router.post("/login", response_model=dict[str, str])
async def login(
    request: Request,
    data: LoginRequest,
    session: AsyncSession = Depends(get_session)
):
    token = await AuthService.login(
        session,
        data.email,
        data.password
    )

    if not token:
        await AuditService.log(
            session=session,
            log_type = LogType.ERROR,
            service=ServiceType.AUTH,
            detail=f"{request.client.host} - POST - /login - 401 - invalid email or password"
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    await AuditService.log(
        session=session,
        log_type=LogType.INFO,
        service=ServiceType.AUTH,
        detail=f"{request.client.host} - POST - /login - 200",
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/logout", response_model=dict[str, str])
async def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.AUTH,
            detail=f"{request.client.host} - POST - /logout - 401 - invalid token",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    jti = payload.get("jti")
    exp = payload.get("exp")

    now = int(datetime.now(tz=timezone.utc).timestamp())
    ttl = exp - now

    # Добавляем в blocklist только если токен ещё не истёк
    await TokenBlocklistService.add(jti, ttl)

    await AuditService.log(
        session=session,
        user_id=current_user.id,
        log_type=LogType.INFO,
        service=ServiceType.AUTH,
        detail=f"{request.client.host} - POST - /logout - 200",
    )

    return {"message": "Successfully logged out"}