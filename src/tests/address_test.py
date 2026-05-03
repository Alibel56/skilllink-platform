

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from src.backend.app.core.dependencies import require_any
from src.backend.app.db.session import get_session
from .conftest import make_session, make_user, make_address


class TestAddressEndpoints:
    BASE = "/address"

    def _make_app(self, user):
        from src.backend.app.api.v1 import AddressRouter as mod
        app = FastAPI()
        app.include_router(mod.router)
        app.dependency_overrides[get_session] = make_session
        app.dependency_overrides[require_any] = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_create_address_success(self):
        user    = make_user()
        address = make_address()
        app     = self._make_app(user)

        with patch("src.backend.app.api.v1.AddressRouter.AddressService.create", new_callable=AsyncMock, return_value=address):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/add/address", json={
                    "country": "Kazakhstan", "city": "Almaty",
                    "street": "Abay 1", "lat": 43.2, "lon": 76.9
                })
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_address_success(self):
        user    = make_user()
        address = make_address()
        app     = self._make_app(user)

        with patch("src.backend.app.api.v1.AddressRouter.AddressService.get_by_user_id", new_callable=AsyncMock, return_value=address):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/address")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_address_not_found(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.AddressRouter.AddressService.get_by_user_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/address")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_address_success(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.AddressRouter.AddressService.delete", new_callable=AsyncMock):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/address")
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()