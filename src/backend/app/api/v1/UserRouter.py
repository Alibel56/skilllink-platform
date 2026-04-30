import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.dependencies import (
    get_current_user,
    require_any
)
from src.backend.app.db.models import OrderRequest
from src.backend.app.db.models.enums import ServiceType, LogType
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session
from src.backend.app.schemas.OrderRequestsSchema import OrderRequestCreate
from src.backend.app.schemas.UserSchema import UserUpdate, UserDto
from src.backend.app.services.OrderRequestsService import OrderRequestsService
from src.backend.app.services.UserService import UserService

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# =========================
# GET CURRENT USER
# =========================
@router.get("/profile", response_model=UserDto)
async def get_me(
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    user = await UserService.get_by_id(session, current_user.id)
    return user


# =========================
# UPDATE USER
# =========================
@router.put("/update", response_model=UserDto)
async def update_user(
    data: UserUpdate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any)
):
    user = await UserService.get_by_id(session, current_user.id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = await UserService.update(session, user, data)

    return updated_user


# =========================
# DELETE USER
# =========================
@router.delete("/delete", response_model=dict[str, str])
async def delete_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any)
):
    user = await UserService.get_by_id(session, current_user.id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await UserService.delete(session, user)

    return {"message": "User deleted"}