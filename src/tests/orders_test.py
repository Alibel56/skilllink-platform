
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from src.backend.app.core.dependencies import require_any, require_client, require_specialist
from src.backend.app.db.session import get_session
from .conftest import make_session, make_user, make_specialist, make_order, FAKE_ORDER_ID, FAKE_USER_ID


class TestOrderEndpoints:
    BASE = "/orders"

    def _make_app(self, user):
        from src.backend.app.api.v1 import OrderRouter as mod
        app = FastAPI()
        app.include_router(mod.router)
        app.dependency_overrides[get_session]        = make_session
        app.dependency_overrides[require_any]        = lambda: user
        app.dependency_overrides[require_client]     = lambda: user
        app.dependency_overrides[require_specialist] = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_create_order_success(self):
        user  = make_user()
        order = make_order()
        app   = self._make_app(user)

        with patch("src.backend.app.api.v1.OrderRouter.OrderService.create", new_callable=AsyncMock, return_value=order):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/create", json={
                    "job_type": "plumbing",
                    "description": "Fix pipe",
                    "price": 5000.0
                })
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_create_order_invalid_price(self):
        """price must be > 0."""
        user = make_user()
        app  = self._make_app(user)

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.post(f"{self.BASE}/create", json={
                "job_type": "plumbing",
                "price": -100.0
            })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_get_order_success(self):
        user  = make_user()
        order = make_order()
        app   = self._make_app(user)

        with patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=order):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/{FAKE_ORDER_ID}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_order_not_found(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/{FAKE_ORDER_ID}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_my_orders(self):
        user  = make_user()
        order = make_order()
        app   = self._make_app(user)

        with patch("src.backend.app.api.v1.OrderRouter.OrderService.get_user_orders", new_callable=AsyncMock, return_value=[order]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/my")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.asyncio
    async def test_get_active_orders(self):
        user  = make_user("specialist")
        order = make_order()
        app   = self._make_app(user)

        with patch("src.backend.app.api.v1.OrderRouter.OrderService.get_active_orders", new_callable=AsyncMock, return_value=[order]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/active")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_specialist_orders_success(self):
        user       = make_user("specialist")
        specialist = make_specialist()
        order      = make_order()
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.OrderRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.OrderRouter.OrderService.get_specialist_orders", new_callable=AsyncMock, return_value=[order]),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/specialist/my")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_specialist_orders_no_profile(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.OrderRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/specialist/my")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_order_success(self):
        user  = make_user()
        order = make_order(user_id=FAKE_USER_ID)
        app   = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=order),
            patch("src.backend.app.api.v1.OrderRouter.OrderService.update", new_callable=AsyncMock, return_value=order),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/update/{FAKE_ORDER_ID}", json={"job_type": "electrical"})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_order_forbidden(self):
        """User trying to update someone else's order."""
        user  = make_user()
        order = make_order(user_id=uuid.uuid4())
        app   = self._make_app(user)

        with patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=order):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/update/{FAKE_ORDER_ID}", json={"job_type": "electrical"})
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_take_order_success(self):
        user       = make_user("specialist")
        specialist = make_specialist(user_id=uuid.uuid4())
        order      = make_order(user_id=uuid.uuid4(), status="open")
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.OrderRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=order),
            patch("src.backend.app.api.v1.OrderRouter.OrderRequestsService.try_to_take_order", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/take/{FAKE_ORDER_ID}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_take_order_not_open(self):
        user       = make_user("specialist")
        specialist = make_specialist()
        order      = make_order(status="in_progress")
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.OrderRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=order),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/take/{FAKE_ORDER_ID}")
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_take_own_order_forbidden(self):
        """A specialist cannot take their own order."""
        user       = make_user("specialist")
        specialist = make_specialist(user_id=FAKE_USER_ID)
        order      = make_order(user_id=FAKE_USER_ID, status="open")
        app        = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.OrderRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=order),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/take/{FAKE_ORDER_ID}")
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_complete_order_success(self):
        user  = make_user()
        order = make_order(user_id=FAKE_USER_ID)
        order.completed_at = datetime.utcnow()
        app   = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=order),
            patch("src.backend.app.api.v1.OrderRouter.OrderService.complete_order", new_callable=AsyncMock, return_value=order),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/complete/{FAKE_ORDER_ID}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_complete_order_forbidden(self):
        user  = make_user()
        order = make_order(user_id=uuid.uuid4())
        app   = self._make_app(user)

        with patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=order):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/complete/{FAKE_ORDER_ID}")
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_cancel_order_success(self):
        user  = make_user()
        order = make_order(user_id=FAKE_USER_ID)
        app   = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=order),
            patch("src.backend.app.api.v1.OrderRouter.OrderService.cancel_order", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/cancel/{FAKE_ORDER_ID}")
        assert resp.status_code == 200
        assert "cancelled" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_cancel_order_not_found(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/cancel/{FAKE_ORDER_ID}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_order_success(self):
        user  = make_user()
        order = make_order(user_id=FAKE_USER_ID)
        app   = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=order),
            patch("src.backend.app.api.v1.OrderRouter.OrderService.delete", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/{FAKE_ORDER_ID}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_order_forbidden(self):
        user  = make_user()
        order = make_order(user_id=uuid.uuid4())
        app   = self._make_app(user)

        with patch("src.backend.app.api.v1.OrderRouter.OrderService.get_by_id", new_callable=AsyncMock, return_value=order):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/{FAKE_ORDER_ID}")
        assert resp.status_code == 403