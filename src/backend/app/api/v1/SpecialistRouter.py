import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.dependencies import (
    require_admin,
    require_specialist,
    require_client,
    require_any,
)
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session
from src.backend.app.schemas.SpecialistSchema import SpecialistCreate, SpecialistUpdate, SpecialistDto
from src.backend.app.services.SpecialistService import SpecialistService
from src.backend.app.services.UserService import UserService


async def _to_dto(session: AsyncSession, specialist) -> SpecialistDto:
    """SpecialistDto + owner's name/surname pulled from the User row."""
    dto = SpecialistDto.model_validate(specialist, from_attributes=True)
    user = await UserService.get_by_id(session, specialist.user_id)
    if user:
        dto.name = user.name
        dto.surname = user.surname
    return dto

router = APIRouter(
    prefix="/specialists",
    tags=["Specialists"]
)

@router.post("/create", response_model=SpecialistDto)
async def create_specialist(
    request: Request,
    data: SpecialistCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client)
):
    specialist = await SpecialistService.create(
        session=session,
        user_id=current_user.id,
        data=data
    )
    # Promote the user to 'specialist' so RoleChecker on /catalog/*,
    # /accreditation/* and other specialist-only endpoints lets them through
    # without re-login.
    current_user.role = "specialist"
    await session.commit()
    return await _to_dto(session, specialist)


@router.get("/me", response_model=SpecialistDto)
async def get_my_specialist(
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_specialist),
):
    """Returns the specialist row owned by the current user."""
    specialist = await SpecialistService.get_by_user_id(session, current_user.id)
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist profile not found")
    return await _to_dto(session, specialist)


@router.get("/get/{specialist_id}", response_model=SpecialistDto)
async def get_specialist(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any),
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    return await _to_dto(session, specialist)


@router.put("/update", response_model=SpecialistDto)
async def update_specialist(
    data: SpecialistUpdate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_specialist)
):
    specialist = await SpecialistService.get_by_user_id(session, current_user.id)
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    return await SpecialistService.update(session, specialist, data)


@router.patch("/deactivate/{specialist_id}", response_model=SpecialistDto)
async def deactivate_specialist(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    return await SpecialistService.deactivate(session, specialist)


@router.delete("/delete", response_model=dict[str, str])
async def delete_specialist(
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_specialist)
):
    specialist = await SpecialistService.get_by_user_id(session, current_user.id)
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    await SpecialistService.delete(session, specialist)
    return {"message": "Specialist deleted"}


@router.patch("/verify/{specialist_id}", response_model=SpecialistDto)
async def verify_specialist(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    return await SpecialistService.verify(session, specialist)


@router.get("/list", response_model=list[SpecialistDto])
async def list_all_specialists(
    request: Request,
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    """Admin-only: list every specialist with the owner's name + verify/active flags."""
    items = await SpecialistService.get_all(session, limit=limit, offset=offset)
    return [await _to_dto(session, s) for s in items]


@router.patch("/activate/{specialist_id}", response_model=SpecialistDto)
async def activate_specialist(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin),
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    updated = await SpecialistService.update(
        session, specialist, SpecialistUpdate(is_active=True)
    )
    return await _to_dto(session, updated)


@router.get("/search", response_model=list[SpecialistDto])
async def find_specialists_nearby(
    lat: float,
    lon: float,
    k: int = 1,
    job_type: Optional[str] = None,
    max_price: Optional[int] = None,
    request: Request = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any),
):
    specialists = await SpecialistService.find_specialists_nearby(
        session=session,
        lat=lat,
        lon=lon,
        k=k,
        job_type=job_type,
        max_price=max_price
    )
    return [await _to_dto(session, s) for s in specialists]