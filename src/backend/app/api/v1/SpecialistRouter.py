import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.dependencies import (
    require_admin,
    require_specialist,
    require_client,
)
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session
from src.backend.app.schemas.SpecialistSchema import SpecialistCreate, SpecialistUpdate, SpecialistDto
from src.backend.app.services.SpecialistService import SpecialistService

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
    return specialist


@router.get("/get/{specialist_id}", response_model=SpecialistDto)
async def get_specialist(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client)
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    return specialist


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


@router.get("/search", response_model=list[SpecialistDto])
async def find_specialists_nearby(
    lat: float,
    lon: float,
    k: int = 1,
    job_type: Optional[str] = None,
    max_price: Optional[int] = None,
    request: Request = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client)
):
    specialists = await SpecialistService.find_specialists_nearby(
        session=session,
        lat=lat,
        lon=lon,
        k=k,
        job_type=job_type,
        max_price=max_price
    )
    return specialists