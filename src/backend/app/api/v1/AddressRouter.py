import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.dependencies import (
    require_client
)
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session
from src.backend.app.schemas.AddressSchema import AddressDto, AddressCreate
from src.backend.app.services.AddressService import AddressService

router = APIRouter(
    prefix="/address",
    tags=["Address"]
)

# ─────────────────────────────────────────
# CREATE ADDRESS
# ─────────────────────────────────────────

@router.post("/add/address", response_model=AddressDto)
async def create_address(
        data: AddressCreate,
        request: Request,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(require_client)
):
    item = await AddressService.create(
        session,
        current_user.id,
        data
    )

    return item


# ─────────────────────────────────────────
# GET USER ADDRESS
# ─────────────────────────────────────────

@router.get("/get/address", response_model=AddressDto)
async def get_address(
        request: Request,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(require_client)
):
    item = await AddressService.get_by_user_id(
        session,
        current_user.id
    )
    if not item:
        raise HTTPException(status_code=404, detail="Address not found")

    return item


# ─────────────────────────────────────────
# DELETE USER ADDRESS
# ─────────────────────────────────────────

@router.delete("/delete/address", response_model=dict[str, str])
async def delete_address(
        request: Request,
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(require_client)
):
    await AddressService.delete(session, current_user.id)
    return {"message": "Address deleted successfully"}