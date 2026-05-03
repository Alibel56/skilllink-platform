

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from src.backend.app.core.dependencies import require_any, require_specialist
from src.backend.app.db.session import get_session
from .conftest import (
    make_session, make_user, make_specialist, make_catalog_item,
    FAKE_SPECIALIST_ID, FAKE_CATALOG_ID,
)


class TestCatalogEndpoints:
    BASE = "/catalog"

    def _make_app(self, user):
        from src.backend.app.api.v1 import CatalogRouter as mod
        app = FastAPI()
        app.include_router(mod.router)
        app.dependency_overrides[get_session]        = make_session
        app.dependency_overrides[require_specialist] = lambda: user
        app.dependency_overrides[require_any]        = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_create_catalog_item_success(self):
        user       = make_user("specialist")
        specialist = make_specialist()
        item       = make_catalog_item()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.CatalogRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.CatalogRouter.CatalogService.create", new_callable=AsyncMock, return_value=item),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/add/item", json={"job_type": "plumbing", "price": 3000.0})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_create_catalog_item_no_specialist(self):
        user = make_user("specialist")
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.CatalogRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/add/item", json={"job_type": "plumbing", "price": 3000.0})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_specialist_catalog(self):
        user = make_user()
        item = make_catalog_item()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.CatalogRouter.CatalogService.get_by_specialist_id", new_callable=AsyncMock, return_value=[item]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/catalog/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.asyncio
    async def test_get_specialist_catalog_empty(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.CatalogRouter.CatalogService.get_by_specialist_id", new_callable=AsyncMock, return_value=[]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/catalog/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_update_catalog_item_success(self):
        user       = make_user("specialist")
        specialist = make_specialist()
        item       = make_catalog_item(specialist_id=FAKE_SPECIALIST_ID)
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.CatalogRouter.CatalogService.get_by_id", new_callable=AsyncMock, return_value=item),
            patch("src.backend.app.api.v1.CatalogRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.CatalogRouter.CatalogService.update", new_callable=AsyncMock, return_value=item),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/update/{FAKE_CATALOG_ID}", json={"price": 5000.0})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_catalog_item_not_found(self):
        user = make_user("specialist")
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.CatalogRouter.CatalogService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/update/{FAKE_CATALOG_ID}", json={"price": 5000.0})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_catalog_item_wrong_specialist(self):
        """Specialist trying to update another specialist's item."""
        user       = make_user("specialist")
        specialist = make_specialist()
        item       = make_catalog_item(specialist_id=uuid.uuid4())
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.CatalogRouter.CatalogService.get_by_id", new_callable=AsyncMock, return_value=item),
            patch("src.backend.app.api.v1.CatalogRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/update/{FAKE_CATALOG_ID}", json={"price": 5000.0})
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_catalog_item_success(self):
        user       = make_user("specialist")
        specialist = make_specialist()
        item       = make_catalog_item(specialist_id=FAKE_SPECIALIST_ID)
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.CatalogRouter.CatalogService.get_by_id", new_callable=AsyncMock, return_value=item),
            patch("src.backend.app.api.v1.CatalogRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.CatalogRouter.CatalogService.delete", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/{FAKE_CATALOG_ID}")
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_delete_catalog_item_forbidden(self):
        user       = make_user("specialist")
        specialist = make_specialist()
        item       = make_catalog_item(specialist_id=uuid.uuid4())
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.CatalogRouter.CatalogService.get_by_id", new_callable=AsyncMock, return_value=item),
            patch("src.backend.app.api.v1.CatalogRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/{FAKE_CATALOG_ID}")
        assert resp.status_code == 403