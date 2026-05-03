

import io
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from src.backend.app.core.dependencies import require_any, require_specialist
from src.backend.app.db.session import get_session
from .conftest import make_session, make_user, make_specialist, FAKE_USER_ID


class TestFileEndpoints:
    BASE = "/files"

    def _make_app(self, user):
        from src.backend.app.api.v1 import FileRouter as mod
        app = FastAPI()
        app.include_router(mod.router)
        app.dependency_overrides[get_session]        = make_session
        app.dependency_overrides[require_any]        = lambda: user
        app.dependency_overrides[require_specialist] = lambda: user
        return app

    # ── avatar ────────────────────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_upload_avatar_success(self):
        user = make_user()
        app  = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.FileRouter.FileValidator.ensure_image"),
            patch("src.backend.app.api.v1.FileRouter.compress_and_store_image.delay"),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(
                    f"{self.BASE}/upload/avatar",
                    files={"file": ("avatar.jpg", io.BytesIO(b"fake-image-bytes"), "image/jpeg")}
                )
        assert resp.status_code == 200
        assert "queued" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_get_avatar_success(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.FileRouter.FileService.get_avatar", new_callable=AsyncMock, return_value=(b"img_bytes", "image/jpeg")):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/avatar/{FAKE_USER_ID}")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "image/jpeg"

    @pytest.mark.asyncio
    async def test_get_avatar_not_found(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.FileRouter.FileService.get_avatar", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/avatar/{FAKE_USER_ID}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_avatar_success(self):
        user = make_user()
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.FileRouter.FileService.delete_avatar", new_callable=AsyncMock):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/avatar/{FAKE_USER_ID}")
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()

    # ── accreditation ─────────────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_upload_accreditation_specialist_not_found(self):
        user = make_user("specialist")
        app  = self._make_app(user)

        with (
            patch("src.backend.app.api.v1.FileRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=None),
            patch("src.backend.app.api.v1.FileRouter.FileValidator.ensure_pdf"),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(
                    f"{self.BASE}/upload/accreditation",
                    files={"file": ("cert.pdf", io.BytesIO(b"%PDF fake"), "application/pdf")}
                )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_accreditation_not_found(self):
        user       = make_user()
        specialist = make_specialist()
        app        = self._make_app(user)

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
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.FileRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.get(f"{self.BASE}/get/accreditation")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_accreditation_specialist_not_found(self):
        user = make_user("specialist")
        app  = self._make_app(user)

        with patch("src.backend.app.api.v1.FileRouter.SpecialistService.get_by_user_id", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.delete(f"{self.BASE}/delete/accreditation")
        assert resp.status_code == 404