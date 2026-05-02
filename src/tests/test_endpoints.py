"""
Tests for: files, address, comment, message, rate, requests, users endpoints.

Положи в: src/tests/test_endpoints.py
Запуск:    python -m pytest src/tests/test_endpoints.py -v
"""

import io
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

# ──────────────────────────────────────────────────────────────────────────────
# Shared helpers
# ──────────────────────────────────────────────────────────────────────────────

FAKE_USER_ID = uuid.uuid4()
FAKE_SPECIALIST_ID = uuid.uuid4()
FAKE_ORDER_ID = uuid.uuid4()
FAKE_REQUEST_ID = uuid.uuid4()


def make_user(role="client"):
    user = MagicMock()
    user.id = FAKE_USER_ID
    user.role = role
    return user


def make_specialist():
    s = MagicMock()
    s.id = FAKE_SPECIALIST_ID
    return s


from src.backend.app.core.dependencies import (
    require_any, require_specialist, require_client, get_current_user
)
from src.backend.app.db.session import get_session


def make_session():
    return AsyncMock()


# ══════════════════════════════════════════════════════════════════════════════
# FILE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class TestFileEndpoints:
    BASE = "/files"

    def _make_app(self, user):
        from src.backend.app.api.v1 import FileRouter as fmod
        app = FastAPI()
        app.include_router(fmod.router)
        app.dependency_overrides[get_session] = make_session
        app.dependency_overrides[require_specialist] = lambda: user
        app.dependency_overrides[require_any] = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_upload_accreditation_specialist_not_found(self):
        user = make_user("specialist")
        app = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.FileRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=None),
            patch("src.backend.app.api.v1.FileRouter.FileValidator.ensure_pdf"),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(
                    f"{self.BASE}/upload/accreditation",
                    files={"file": ("test.pdf", io.BytesIO(b"%PDF fake"), "application/pdf")},
                )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_accreditation_not_found(self):
        user = make_user()
        specialist = make_specialist()
        app = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.FileRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=specialist),
            patch("src.backend.app.api.v1.FileRouter.FileService.get_accreditation", new_callable=AsyncMock, return_value=None),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/accreditation")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_accreditation_specialist_not_found(self):
        user = make_user()
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.FileRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/accreditation")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_accreditation_specialist_not_found(self):
        user = make_user("specialist")
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.FileRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/accreditation")
        assert resp.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# ADDRESS ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class TestAddressEndpoints:
    BASE = "/address"

    def _make_app(self, user):
        from src.backend.app.api.v1 import AddressRouter as amod
        app = FastAPI()
        app.include_router(amod.router)
        app.dependency_overrides[get_session] = make_session
        app.dependency_overrides[require_any] = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_get_address_not_found(self):
        user = make_user()
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.AddressRouter.AddressService.get_by_user_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/address")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_address_success(self):
        user = make_user()
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.AddressRouter.AddressService.delete", new_callable=AsyncMock):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/address")
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()


# ══════════════════════════════════════════════════════════════════════════════
# COMMENT ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class TestCommentEndpoints:
    BASE = "/comment"

    def _make_app(self, user):
        from src.backend.app.api.v1 import CommentRouter as cmod
        app = FastAPI()
        app.include_router(cmod.router)
        app.dependency_overrides[get_session] = make_session
        app.dependency_overrides[require_client] = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_get_specialist_comments_success(self):
        user = make_user()
        app = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.CommentRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=make_specialist()),
            patch("src.backend.app.api.v1.CommentRouter.CommentService.get_all", new_callable=AsyncMock, return_value=[]),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/comments/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_delete_comment_success(self):
        user = make_user()
        app = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.CommentRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=make_specialist()),
            patch("src.backend.app.api.v1.CommentRouter.CommentService.delete", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# MESSAGE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class TestMessageEndpoints:
    BASE = "/message"

    def _make_app(self, user):
        from src.backend.app.api.v1 import MessageRouter as mmod
        app = FastAPI()
        app.include_router(mmod.router)
        app.dependency_overrides[get_session] = make_session
        app.dependency_overrides[require_any] = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_get_chat_empty(self):
        user = make_user()
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.MessageRouter.MessageService.get_by_order_id", new_callable=AsyncMock, return_value=[]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/chat/{FAKE_ORDER_ID}")
        assert resp.status_code == 200
        assert resp.json() == []


# ══════════════════════════════════════════════════════════════════════════════
# RATE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class TestRateEndpoints:
    BASE = "/rate"

    def _make_app(self, user):
        from src.backend.app.api.v1 import RateRouter as rmod
        app = FastAPI()
        app.include_router(rmod.router)
        app.dependency_overrides[get_session] = make_session
        app.dependency_overrides[require_client] = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_get_specialist_avg_rate(self):
        user = make_user()
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.RateRouter.RateService.get_specialist_avg_rate", new_callable=AsyncMock, return_value=4.5):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/rate/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200
        assert "4.5" in resp.json()["message"]

    @pytest.mark.asyncio
    async def test_delete_rate_success(self):
        user = make_user()
        app = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.RateRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=make_specialist()),
            patch("src.backend.app.api.v1.RateRouter.RateService.delete", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_rate_specialist_not_found(self):
        user = make_user()
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.RateRouter.SpecialistService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/{FAKE_SPECIALIST_ID}")
        assert resp.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# REQUESTS ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class TestRequestsEndpoints:
    BASE = "/requests"

    def _make_app(self, user):
        from src.backend.app.api.v1 import RequestsRouter as reqmod
        app = FastAPI()
        app.include_router(reqmod.router)
        app.dependency_overrides[get_session] = make_session
        app.dependency_overrides[require_client] = lambda: user
        app.dependency_overrides[require_any] = lambda: user
        return app

    def _order_request(self, user_id=None, status="PENDING"):
        req = MagicMock()
        req.id = FAKE_REQUEST_ID
        req.user_id = user_id or FAKE_USER_ID
        req.specialist_id = FAKE_SPECIALIST_ID
        req.order_id = FAKE_ORDER_ID
        req.status = status
        return req

    @pytest.mark.asyncio
    async def test_get_all_requests(self):
        user = make_user()
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_all_requests", new_callable=AsyncMock, return_value=[]):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/all")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_approve_request_success(self):
        user = make_user()
        from src.backend.app.db.models.enums import RequestStatus
        order_req = self._order_request(user_id=FAKE_USER_ID, status=RequestStatus.PENDING)
        app = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_by_id", new_callable=AsyncMock, return_value=order_req),
            patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.approve", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/approve/{FAKE_REQUEST_ID}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_approve_request_not_found(self):
        user = make_user()
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/approve/{FAKE_REQUEST_ID}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_approve_request_wrong_owner(self):
        user = make_user()
        order_req = self._order_request(user_id=uuid.uuid4())
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_by_id", new_callable=AsyncMock, return_value=order_req):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/approve/{FAKE_REQUEST_ID}")
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_approve_request_not_pending(self):
        user = make_user()
        order_req = self._order_request(user_id=FAKE_USER_ID, status="APPROVED")
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.RequestsRouter.OrderRequestsService.get_by_id", new_callable=AsyncMock, return_value=order_req):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/approve/{FAKE_REQUEST_ID}")
        assert resp.status_code == 400


# ══════════════════════════════════════════════════════════════════════════════
# USER ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class TestUserEndpoints:
    BASE = "/users"

    def _make_app(self, user):
        from src.backend.app.api.v1 import UserRouter as umod
        app = FastAPI()
        app.include_router(umod.router)
        app.dependency_overrides[get_session] = make_session
        app.dependency_overrides[get_current_user] = lambda: user
        app.dependency_overrides[require_any] = lambda: user
        return app

    @pytest.mark.asyncio
    async def test_update_user_not_found(self):
        user = make_user()
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.UserRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.put(f"{self.BASE}/update", json={"first_name": "Jane"})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_user_success(self):
        user = make_user()
        app = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.UserRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=make_user()),
            patch("src.backend.app.api.v1.UserRouter.UserService.delete", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete")
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_delete_user_not_found(self):
        user = make_user()
        app = self._make_app(user)

        with patch("src.backend.app.api.v1.UserRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete")
        assert resp.status_code == 404