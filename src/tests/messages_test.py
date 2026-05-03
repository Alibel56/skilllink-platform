

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from src.backend.app.core.dependencies import require_any
from src.backend.app.db.session import get_session
from .conftest import make_session, make_user, make_message, FAKE_ORDER_ID


class TestMessageEndpoints:
    BASE = "/message"

    def _make_app(self, user):
        from src.backend.app.api.v1 import MessageRouter as mod
        app = FastAPI()
        app.include_router(mod.router)
        app.dependency_overrides[get_session] = make_session
        app.dependency_overrides[require_any] = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_send_message_success(self):
        user    = make_user()
        message = make_message()
        app     = self._make_app(user)

        with patch("src.backend.app.api.v1.MessageRouter.MessageService.create", new_callable=AsyncMock, return_value=message):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(
                    f"{self.BASE}/write",
                    params={"order_id": str(FAKE_ORDER_ID)},
                    json={"message": "Hello!"}
                )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_send_message_empty_body(self):
        user = make_user()
        app  = self._make_app(user)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.post(
                f"{self.BASE}/write",
                params={"order_id": str(FAKE_ORDER_ID)},
                json={"message": ""}
            )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_get_chat_success(self):
        user    = make_user()
        message = make_message()
        app     = self._make_app(user)

        with patch("src.backend.app.api.v1.MessageRouter.MessageService.get_by_order_id", new_callable=AsyncMock, return_value=[message]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/chat/{FAKE_ORDER_ID}")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.asyncio
    async def test_get_chat_empty(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.MessageRouter.MessageService.get_by_order_id", new_callable=AsyncMock, return_value=[]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/chat/{FAKE_ORDER_ID}")
        assert resp.status_code == 200
        assert resp.json() == []