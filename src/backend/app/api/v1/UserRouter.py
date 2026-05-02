from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.dependencies import get_current_user, require_any
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session
from src.backend.app.schemas.UserSchema import UserUpdate, UserDto
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
    current_user: User = Depends(get_current_user)
):
    # current_user уже загружен в get_current_user — не делаем второй запрос
    return current_user


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
    # current_user уже загружен — передаём напрямую, не перезагружаем по id
    updated_user = await UserService.update(session, current_user, data)
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
    await UserService.delete(session, current_user)
    return {"message": "User deleted"}