import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.dependencies import (
    require_specialist, require_client
)
from src.backend.app.db.models.user import User
from src.backend.app.db.session import get_session
from src.backend.app.schemas.CatalogSchema import CatalogCreate, CatalogUpdate, CatalogFilter, CatalogDto
from src.backend.app.services.CatalogService import CatalogService
from src.backend.app.services.SpecialistService import SpecialistService

router = APIRouter(
    prefix="/catalog",
    tags=["Catalog"]
)

# ─────────────────────────────────────────
# CREATE CATALOG ITEM
# ─────────────────────────────────────────

@router.post("/add/item", response_model=CatalogDto)
async def create_catalog_item(
    data: CatalogCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_specialist)
):

    specialist = await SpecialistService.get_by_user_id(session, current_user.id)

    if not specialist:
        raise HTTPException(404, "Specialist profile not found")

    item = await CatalogService.create(
        session,
        specialist.id,
        data
    )

    return item

# ─────────────────────────────────────────
# GET SPECIALIST CATALOG
# ─────────────────────────────────────────

@router.get("/get/catalog/{specialist_id}", response_model=list[CatalogDto])
async def get_specialist_catalog(
    specialist_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    filters: CatalogFilter = Depends(),
    current_user: User = Depends(require_client)
):

    items = await CatalogService.get_by_specialist_id(
        session,
        specialist_id,
        filters
    )

    return items


# ─────────────────────────────────────────
# UPDATE CATALOG ITEM
# ─────────────────────────────────────────

@router.put("/update/{catalog_id}", response_model=CatalogDto)
async def update_catalog_item(
    catalog_id: uuid.UUID,
    data: CatalogUpdate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_specialist)
):
    item = await CatalogService.get_by_id(session, catalog_id)
    if not item:
        raise HTTPException(404, f"Catalog item {catalog_id} not found")

    specialist = await SpecialistService.get_by_user_id(session, current_user.id)
    if not specialist or item.specialist_id != specialist.id:
        raise HTTPException(403, "Not allowed to update this catalog item")

    return await CatalogService.update(session, item, data)


# ─────────────────────────────────────────
# DELETE CATALOG ITEM
# ─────────────────────────────────────────

@router.delete("/delete/{catalog_id}", response_model=dict[str, str])
async def delete_catalog_item(
    catalog_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_specialist)
):
    item = await CatalogService.get_by_id(session, catalog_id)
    if not item:
        raise HTTPException(404, "Catalog item not found")

    specialist = await SpecialistService.get_by_user_id(session, current_user.id)
    if not specialist or item.specialist_id != specialist.id:
        raise HTTPException(403, "Not allowed to delete this catalog item")

    await CatalogService.delete(session, item)
    return {"message": "Catalog item deleted"}