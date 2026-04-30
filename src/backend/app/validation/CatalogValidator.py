from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.dao.CatalogDao import CatalogDao
from src.backend.app.dao.SpecialistDao import SpecialistDao
from src.backend.app.schemas.CatalogSchema import CatalogCreate, CatalogFilter
from src.backend.app.validation.Validators import _raise_if_errors


class CatalogValidator:

    @staticmethod
    async def ensure_can_create(
        session: AsyncSession,
        specialist_id: uuid.UUID,
        data: CatalogCreate,
    ) -> None:
        """
        Специалист может иметь только один каталог на тип работы,
        и он должен быть верифицирован.
        """
        errors: list[str] = []

        filters = CatalogFilter(job_type=data.job_type)
        if await CatalogDao.get_by_specialist_id(session, specialist_id, filters):
            errors.append("Catalog entry for this job type already exists")

        specialist = await SpecialistDao.get_by_id(session, specialist_id)
        if specialist is None:
            errors.append("Specialist not found")
        elif not specialist.is_verified:
            errors.append("Specialist must be verified to create a catalog entry")

        _raise_if_errors(errors)