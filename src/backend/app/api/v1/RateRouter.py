import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.dependencies import require_client, require_any
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session
from src.backend.app.schemas.RateSchema import RateCreate, RateDto
from src.backend.app.services.RateService import RateService
from src.backend.app.services.SpecialistService import SpecialistService

router = APIRouter(prefix="/rate", tags=["Rate"])


@router.post("/create/{specialist_id}", response_model=RateDto)
async def rate_specialist(
    specialist_id: uuid.UUID,
    data: RateCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_client)
):
    specialist = await SpecialistService.get_by_user_id(session, current_user.id)
    if specialist and specialist.id == specialist_id:
        raise HTTPException(400, "You can't rate your own specialist")
    return await RateService.create(session, current_user.id, specialist_id, data)


@router.get("/get/rate/{specialist_id}", response_model=list[RateDto])
async def list_specialist_rates(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_any),
):
    """Returns all individual rates for a specialist; the frontend computes
    the average. require_any so a specialist can also view another specialist's
    profile."""
    return await RateService.list_for_specialist(session, specialist_id)


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