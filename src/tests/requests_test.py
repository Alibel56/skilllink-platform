

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from src.backend.app.core.dependencies import require_any, require_client
from src.backend.app.db.session import get_session
from .conftest import (
    make_session, make_user, make_order_request,
    FAKE_REQUEST_ID, FAKE_USER_ID,
)


class TestRequestsEndpoints:
    BASE = "/requests"

    def _make_app(self, user):
        from src.backend.app.api.v1 import RequestsRouter as mod
        app = FastAPI()
        app.include_router(mod.router)
        app.dependency_overrides[get_session]    = make_session
        app.dependency_overrides[require_client] = lambda: user
        app.dependency_overrides[require_any]    = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_get_all_requests_success(self):
        user    = make_user()
        request = make_order_request()
        app     = self._make_app(user)

        with patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_all_requests", new_callable=AsyncMock, return_value=[request]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/all")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_all_requests_empty(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_all_requests", new_callable=AsyncMock, return_value=[]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/all")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_approve_request_success(self):
        user    = make_user()
        request = make_order_request(user_id=FAKE_USER_ID, status="pending")
        app     = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_by_id", new_callable=AsyncMock, return_value=request),
            patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.approve", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/approve/{FAKE_REQUEST_ID}")
        assert resp.status_code == 200
        assert "approved" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_approve_request_not_found(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/approve/{FAKE_REQUEST_ID}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_approve_request_wrong_owner(self):
        user    = make_user()
        request = make_order_request(user_id=uuid.uuid4())
        app     = self._make_app(user)

        with patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_by_id", new_callable=AsyncMock, return_value=request):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/approve/{FAKE_REQUEST_ID}")
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_approve_request_already_accepted(self):
        user    = make_user()
        request = make_order_request(user_id=FAKE_USER_ID, status="accepted")
        app     = self._make_app(user)

        with patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_by_id", new_callable=AsyncMock, return_value=request):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/approve/{FAKE_REQUEST_ID}")
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_approve_request_rejected_status(self):
        user    = make_user()
        request = make_order_request(user_id=FAKE_USER_ID, status="rejected")
        app     = self._make_app(user)

        with patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_by_id", new_callable=AsyncMock, return_value=request):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/approve/{FAKE_REQUEST_ID}")
        assert resp.status_code == 400