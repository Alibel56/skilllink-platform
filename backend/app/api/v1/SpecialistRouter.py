import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import (
    require_admin,
    require_specialist,
    require_client
)
from backend.app.db.models.enums import ServiceType,LogType
from backend.app.db.models.user import User
from backend.app.db.session import get_session
from backend.app.schemas.SpecialistSchema import SpecialistCreate, SpecialistUpdate, SpecialistDto
from backend.app.services.a.AuditService import AuditService
from backend.app.services.SpecialistService import SpecialistService

router = APIRouter(
    prefix="/specialists",
    tags=["Specialists"]
)

# =========================
# CREATE SPECIALIST
# =========================
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

    await AuditService.log(
        session=session,
        user_id=current_user.id,
        log_type=LogType.INFO,
        service=ServiceType.SPECIALIST,
        detail=f"{request.client.host} - POST - /create - 200"
    )

    return specialist

# =========================
# GET SPECIALIST BY ID
# =========================
@router.get("/get/{specialist_id}", response_model=SpecialistDto)
async def get_specialist(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client)
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)

    if not specialist:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.SPECIALIST,
            detail=f"{request.client.host} - GET - /get/{specialist_id} - 404 - specialist not found"
        )
        raise HTTPException(status_code=404, detail="Specialist not found")

    await AuditService.log(
        session=session,
        user_id=current_user.id,
        log_type=LogType.INFO,
        service=ServiceType.SPECIALIST,
        detail=f"{request.client.host} - GET - /get/{specialist_id} - 200"
    )

    return specialist


# =========================
# UPDATE SPECIALIST
# =========================
@router.put("/update/{specialist_id}", response_model=SpecialistDto)
async def update_specialist(
    specialist_id: uuid.UUID,
    data: SpecialistUpdate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_specialist)
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)

    if not specialist:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.SPECIALIST,
            detail=f"{request.client.host} - PUT - /update/{specialist_id} - 404 - specialist not found"
        )
        raise HTTPException(status_code=404, detail="Specialist not found")

    if specialist.user_id != current_user.id:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.SPECIALIST,
            detail=f"{request.client.host} - PUT - /update/{specialist_id} - 403 - not allowed to update"
        )
        raise HTTPException(status_code=403, detail="Not allowed to update")

    updated_specialist = await SpecialistService.update(session, specialist, data)

    await AuditService.log(
        session=session,
        user_id=current_user.id,
        log_type=LogType.INFO,
        service=ServiceType.SPECIALIST,
        detail=f"{request.client.host} - PUT - /update/{specialist_id} - 200"
    )

    return updated_specialist


# =========================
# DEACTIVATE SPECIALIST
# =========================
@router.patch("/deactivate/{specialist_id}", response_model=SpecialistDto)
async def deactivate_specialist(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)

    if not specialist:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.SPECIALIST,
            detail=f"{request.client.host} - PATCH - /deactivate/{specialist_id} - 404 - specialist not found"
        )
        raise HTTPException(status_code=404, detail="Specialist not found")

    if specialist.user_id != current_user.id:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.SPECIALIST,
            detail=f"{request.client.host} - PATCH - /deactivate/{specialist_id} - 403 - not allowed to deactivate"
        )
        raise HTTPException(status_code=403, detail="Not allowed to deactivate")

    result = await SpecialistService.deactivate(session, specialist)

    await AuditService.log(
        session=session,
        user_id=current_user.id,
        log_type=LogType.INFO,
        service=ServiceType.SPECIALIST,
        detail=f"{request.client.host} - PATCH - /deactivate/{specialist_id} - 200"
    )

    return result


# =========================
# DELETE SPECIALIST
# =========================
@router.delete("/delete/{specialist_id}", response_model=dict[str, str])
async def delete_specialist(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_specialist)
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)

    if not specialist:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.SPECIALIST,
            detail=f"{request.client.host} - DELETE - /delete/{specialist_id} - 404 - specialist not found"
        )
        raise HTTPException(status_code=404, detail="Specialist not found")
    if specialist.user_id != current_user.id:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.SPECIALIST,
            detail=f"{request.client.host} - DELETE - /delete/{specialist_id} - 403 - not allowed to delete"
        )
        raise HTTPException(status_code=403, detail="Not allowed to delete")

    await SpecialistService.delete(session, specialist)

    await AuditService.log(
        session=session,
        user_id=current_user.id,
        log_type=LogType.INFO,
        service=ServiceType.SPECIALIST,
        detail=f"{request.client.host} - DELETE - /delete/{specialist_id} - 200"
    )

    return {"message": "Specialist deleted"}


# =========================
# VERIFY SPECIALIST
# =========================
@router.patch("/verify/{specialist_id}", response_model=SpecialistDto)
async def verify_specialist(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)

    if not specialist:
        await AuditService.log(
            session=session,
            user_id=current_user.id,
            log_type=LogType.ERROR,
            service=ServiceType.SPECIALIST,
            detail=f"{request.client.host} - PATCH - /verify/{specialist_id} - 404 - specialist not found"
        )
        raise HTTPException(status_code=404, detail="Specialist not found")

    result = await SpecialistService.verify(session, specialist)

    await AuditService.log(
        session=session,
        user_id=current_user.id,
        log_type=LogType.INFO,
        service=ServiceType.SPECIALIST,
        detail=f"{request.client.host} - PATCH - /verify/{specialist_id} - 200"
    )

    return result


# =========================
# FIND SPECIALISTS NEARBY
# =========================
@router.get("/search", response_model=list[SpecialistDto])
async def find_specialists_nearby(
    lat: float,
    lon: float,
    k: int = 1,
    job_type: Optional[str] = None,
    max_price: Optional[int] = None,
    request: Request = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    specialists = await SpecialistService.find_specialists_nearby(
        session=session,
        lat=lat,
        lon=lon,
        k=k,
        job_type=job_type,
        max_price=max_price
    )

    await AuditService.log(
        session=session,
        user_id=current_user.id,
        log_type=LogType.INFO,
        service=ServiceType.SPECIALIST,
        detail=f"{request.client.host} - GET - /search - 200"
    )

    return specialists