

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from src.backend.app.core.dependencies import require_any, get_current_user
from src.backend.app.db.session import get_session
from .conftest import make_session, make_user


class TestUserEndpoints:
    BASE = "/users"

    def _make_app(self, user):
        from src.backend.app.api.v1 import UserRouter as mod
        app = FastAPI()
        app.include_router(mod.router)
        app.dependency_overrides[get_session]      = make_session
        app.dependency_overrides[get_current_user] = lambda: user
        app.dependency_overrides[require_any]      = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_get_profile_success(self):
        user = make_user()
        app  = self._make_app(user)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get(f"{self.BASE}/profile")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_user_success(self):
        user         = make_user()
        updated_user = make_user()
        updated_user.name = "Jane"
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.UserRouter.UserService.update", new_callable=AsyncMock, return_value=updated_user):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/update", json={"name": "Jane"})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_user_partial_fields(self):
        """Only one optional field — update still works."""
        user         = make_user()
        updated_user = make_user()
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.UserRouter.UserService.update", new_callable=AsyncMock, return_value=updated_user):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/update", json={"phone": "77009998877"})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_user_success(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.UserRouter.UserService.delete", new_callable=AsyncMock):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete")
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()