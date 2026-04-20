import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.dependencies import (
    require_specialist, require_client
)
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session

from src.backend.app.schemas.RateSchema import RateCreate, RateDto
from src.backend.app.services.RateService import RateService
from src.backend.app.services.SpecialistService import SpecialistService

router = APIRouter(
    prefix="/rate",
    tags=["Rate"]
)

# ─────────────────────────────────────────
# CREATE CATALOG ITEM
# ─────────────────────────────────────────

@router.post("/create", response_model=RateDto)
async def rate_specialist(
    data: RateCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client)
):

    specialist = await SpecialistService.get_by_user_id(session, current_user.id)

    if specialist and specialist.id == data.specialist_id:
        raise HTTPException(400, "You can't rate your own specialist")

    item = await RateService.create(
        session,
        current_user.id,
        data
    )

    return item

# ─────────────────────────────────────────
# GET SPECIALIST AVG RATE
# ─────────────────────────────────────────

@router.get("/get/rate/{specialist_id}", response_model=dict[str, str])
async def get_specialist_avg_rate(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client)
):

    item = await RateService.get_specialist_avg_rate(
        session,
        specialist_id
    )

    return {"message": f"Specialist AVG rate: {item}"}

# ─────────────────────────────────────────
# DELETE SPECIALIST RATE
# ─────────────────────────────────────────

@router.delete("/delete/{specialist_id}", response_model=dict[str, str])
async def delete_rate(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client)
):
    specialist = await SpecialistService.get_by_id(session, specialist_id)
    if not specialist:
        raise HTTPException(404, "Specialist not found")

    await RateService.delete(session, current_user.id, specialist_id)

    return {"message": "Rate deleted successfully"}