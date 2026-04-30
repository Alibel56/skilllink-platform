import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.db.models.catalog import Catalog
from src.backend.app.schemas.CatalogSchema import CatalogCreate, CatalogUpdate, CatalogFilter
from src.backend.app.dao.CatalogDao import CatalogDao
from src.backend.app.validation.CatalogValidator import CatalogValidator

class CatalogService:


    @staticmethod
    async def create(
        session: AsyncSession,
        specialist_id: uuid.UUID,
        data: CatalogCreate
    ) -> Catalog:
        await CatalogValidator.ensure_can_create(session, specialist_id, data)

        item = Catalog(specialist_id=specialist_id, **data.model_dump())
        result = await CatalogDao.create(session, item)
        return result

    @staticmethod
    async def update(
        session: AsyncSession,
        item: Catalog,
        data: CatalogUpdate
    ) -> Catalog:

        update_data = data.model_dump(exclude_none=True)
        result = await CatalogDao.update(session, item, update_data)
        return result

    @staticmethod
    async def delete(session: AsyncSession, item: Catalog) -> None:
        await CatalogDao.delete(session, item)

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        catalog_id: uuid.UUID,
    ) -> Optional[Catalog]:
        return await CatalogDao.get_by_id(session, catalog_id)

    @staticmethod
    async def get_by_specialist_id(session: AsyncSession, specialist_id: uuid.UUID, filters: CatalogFilter) -> list[Catalog]:
        result = await CatalogDao.get_by_specialist_id(session, specialist_id, filters)
        return result

    @staticmethod
    async def get_all(
            session: AsyncSession,
            filters: CatalogFilter,
            limit: Optional[int] = None,
            offset: Optional[int] = None
    ) -> list[Catalog]:
        result = await CatalogDao.get_all(session, filters, limit, offset)
        return result