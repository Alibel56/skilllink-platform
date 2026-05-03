import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from src.backend.app.core.dependencies import (
    require_any, require_specialist, require_client, require_admin,
)
from src.backend.app.db.session import get_session
from .conftest import make_session, make_user, make_specialist, FAKE_SPECIALIST_ID


class TestSpecialistEndpoints:
    BASE = "/specialists"

    def _make_app(self, user):
        from src.backend.app.api.v1 import SpecialistRouter as mod
        app = FastAPI()
        app.include_router(mod.router)
        app.dependency_overrides[get_session]        = make_session
        app.dependency_overrides[require_any]        = lambda: user
        app.dependency_overrides[require_client]     = lambda: user
        app.dependency_overrides[require_specialist] = lambda: user
        app.dependency_overrides[require_admin]      = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_create_specialist_success(self):
        user       = make_user("client")
        specialist = make_specialist()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.create", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=user),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/create", json={"lat": 43.2, "lon": 76.9})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_my_specialist_success(self):
        user       = make_user("specialist")
        specialist = make_specialist()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=user),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/me")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_my_specialist_not_found(self):
        user = make_user("specialist")
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/me")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_specialist_by_id_success(self):
        user       = make_user()
        specialist = make_specialist()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=user),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_specialist_by_id_not_found(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_specialist_success(self):
        user       = make_user("specialist")
        specialist = make_specialist()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.update", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=user),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/update", json={"lat": 43.3, "lon": 77.0})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_specialist_not_found(self):
        user = make_user("specialist")
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/update", json={"lat": 43.3})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_specialist_success(self):
        user       = make_user("specialist")
        specialist = make_specialist()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.delete", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete")
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_delete_specialist_not_found(self):
        user = make_user("specialist")
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_deactivate_specialist_success(self):
        user       = make_user("admin")
        specialist = make_specialist()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.deactivate", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=user),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.patch(f"{self.BASE}/deactivate/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_deactivate_specialist_not_found(self):
        user = make_user("admin")
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.patch(f"{self.BASE}/deactivate/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_verify_specialist_success(self):
        user       = make_user("admin")
        specialist = make_specialist()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.verify", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=user),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.patch(f"{self.BASE}/verify/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_verify_specialist_not_found(self):
        user = make_user("admin")
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.patch(f"{self.BASE}/verify/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_activate_specialist_success(self):
        user       = make_user("admin")
        specialist = make_specialist()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.update", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.SpecialistRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=user),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.patch(f"{self.BASE}/activate/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_activate_specialist_not_found(self):
        user = make_user("admin")
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.patch(f"{self.BASE}/activate/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_list_all_specialists(self):
        user = make_user("admin")
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.get_all", new_callable=AsyncMock, return_value=[]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/list")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_search_specialists(self):
        user       = make_user()
        specialist = make_specialist()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.find_specialists_nearby", new_callable=AsyncMock, return_value=[specialist]),
            patch("src.backend.app.api.v1.SpecialistRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=user),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/search", params={"lat": 43.2, "lon": 76.9})
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.asyncio
    async def test_search_specialists_empty(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.SpecialistRouter.SpecialistService.find_specialists_nearby", new_callable=AsyncMock, return_value=[]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/search", params={"lat": 0.0, "lon": 0.0})
        assert resp.status_code == 200
        assert resp.json() == []