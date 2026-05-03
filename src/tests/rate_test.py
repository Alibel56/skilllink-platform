

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from src.backend.app.core.dependencies import require_any, require_client
from src.backend.app.db.session import get_session
from .conftest import (
    make_session, make_user, make_specialist, make_rate,
    FAKE_SPECIALIST_ID, FAKE_USER_ID,
)


class TestRateEndpoints:
    BASE = "/rate"

    def _make_app(self, user):
        from src.backend.app.api.v1 import RateRouter as mod
        app = FastAPI()
        app.include_router(mod.router)
        app.dependency_overrides[get_session]    = make_session
        app.dependency_overrides[require_client] = lambda: user
        app.dependency_overrides[require_any]    = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_rate_specialist_success(self):
        user       = make_user("client")
        specialist = make_specialist(user_id=uuid.uuid4())
        rate       = make_rate(5)
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.RateRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.RateRouter.RateService.create", new_callable=AsyncMock, return_value=rate),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/create/{FAKE_SPECIALIST_ID}", json={"rate": 5})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_rate_own_specialist_forbidden(self):
        user       = make_user("client")
        specialist = make_specialist(user_id=FAKE_USER_ID)
        specialist.id = FAKE_SPECIALIST_ID
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.RateRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/create/{FAKE_SPECIALIST_ID}", json={"rate": 5})
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_rate_out_of_range(self):
        """Rate must be 1–5."""
        user = make_user()
        app  = self._make_app(user)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.post(f"{self.BASE}/create/{FAKE_SPECIALIST_ID}", json={"rate": 10})
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_list_specialist_rates(self):
        user = make_user()
        rate = make_rate(4)
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.RateRouter.RateService.list_for_specialist", new_callable=AsyncMock, return_value=[rate]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/rate/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.asyncio
    async def test_list_specialist_rates_empty(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.RateRouter.RateService.list_for_specialist", new_callable=AsyncMock, return_value=[]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/rate/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_delete_rate_success(self):
        user       = make_user()
        specialist = make_specialist()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.RateRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.RateRouter.RateService.delete", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_rate_specialist_not_found(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.RateRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 404