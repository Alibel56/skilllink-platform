import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from src.backend.app.core.dependencies import get_current_user
from src.backend.app.db.session import get_session
from .conftest import make_session, make_user, FAKE_USER_ID


class TestAuthEndpoints:
    BASE = "/auth"

    def _make_app(self, user=None):
        from src.backend.app.api.v1 import AuthRouter as mod
        app = FastAPI()
        app.include_router(mod.router)
        app.dependency_overrides[get_session] = make_session
        if user:
            app.dependency_overrides[get_current_user] = lambda: user
        return app

    # ── register ─────────────────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_register_success(self):
        app  = self._make_app()
        user = make_user()

        with patch("src.backend.app.api.v1.AuthRouter.AuthService.register", new_callable=AsyncMock, return_value=user):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/register", json={
                    "name": "John", "surname": "Doe",
                    "birth_date": "1995-01-01", "phone": "77001234567",
                    "email": "john@example.com", "password": "secret123"
                })
        assert resp.status_code == 200
        assert "user_id" in resp.json()
        assert resp.json()["message"] == "User created successfully"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self):
        """AuthService raises exception on duplicate — endpoint must propagate it."""
        from fastapi import HTTPException
        app = self._make_app()

        with patch(
            "src.backend.app.api.v1.AuthRouter.AuthService.register",
            new_callable=AsyncMock,
            side_effect=HTTPException(status_code=400, detail="Email already registered"),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/register", json={
                    "name": "John", "surname": "Doe",
                    "birth_date": "1995-01-01", "phone": "77001234567",
                    "email": "john@example.com", "password": "secret123"
                })
        assert resp.status_code == 400

    # ── login ─────────────────────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_login_success(self):
        app = self._make_app()

        with patch("src.backend.app.api.v1.AuthRouter.AuthService.login", new_callable=AsyncMock, return_value="fake.jwt.token"):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/login", json={
                    "email": "john@example.com", "password": "secret123"
                })
        assert resp.status_code == 200
        data = resp.json()
        assert data["access_token"] == "fake.jwt.token"
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_credentials(self):
        from src.backend.app.exceptions.Base import UnauthorizedException
        app = self._make_app()

        with patch(
            "src.backend.app.api.v1.AuthRouter.AuthService.login",
            new_callable=AsyncMock,
            side_effect=UnauthorizedException("Invalid credentials"),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/login", json={
                    "email": "john@example.com", "password": "wrong"
                })
        assert resp.status_code in (401, 403)

    # ── logout ────────────────────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_logout_success(self):
        user = make_user()
        app  = self._make_app(user=user)

        fake_payload = {
            "jti": str(uuid.uuid4()),
            "exp": 9999999999,
            "sub": str(FAKE_USER_ID),
        }

        with (
            patch("src.backend.app.api.v1.AuthRouter.decode_token", return_value=fake_payload),
            patch("src.backend.app.api.v1.AuthRouter.TokenBlocklistService.add", new_callable=AsyncMock),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(
                    f"{self.BASE}/logout",
                    headers={"Authorization": "Bearer fake.jwt.token"}
                )
        assert resp.status_code == 200
        assert "logged out" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_logout_invalid_token(self):
        user = make_user()
        app  = self._make_app(user=user)

        with patch("src.backend.app.api.v1.AuthRouter.decode_token", return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(
                    f"{self.BASE}/logout",
                    headers={"Authorization": "Bearer bad.token"}
                )
        assert resp.status_code in (401, 403)

    # ── forgot-password ───────────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_forgot_password_existing_email(self):
        app  = self._make_app()
        user = make_user()

        with patch("src.backend.app.api.v1.AuthRouter.UserService.get_by_email", new_callable=AsyncMock, return_value=user):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/forgot-password", params={"email": "john@example.com"})
        assert resp.status_code == 200
        assert "reset link" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_forgot_password_unknown_email(self):
        """Must return the same message to avoid user enumeration."""
        app = self._make_app()

        with patch("src.backend.app.api.v1.AuthRouter.UserService.get_by_email", new_callable=AsyncMock, return_value=None):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/forgot-password", params={"email": "unknown@example.com"})
        assert resp.status_code == 200
        assert "reset link" in resp.json()["message"].lower()

    # ── reset-password ────────────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_reset_password_success(self):
        app  = self._make_app()
        user = make_user()

        with (
            patch("src.backend.app.api.v1.AuthRouter.redis_client") as mock_redis,
            patch("src.backend.app.api.v1.AuthRouter.UserService.get_by_id", new_callable=AsyncMock, return_value=user),
            patch("src.backend.app.api.v1.AuthRouter.hash_password", return_value="hashed"),
        ):
            mock_redis.get    = AsyncMock(return_value=str(FAKE_USER_ID))
            mock_redis.delete = AsyncMock()

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/reset-password", params={"token": "valid-token"}, json={
                    "new_password": "newpass123",
                    "confirm_password": "newpass123"
                })
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_reset_password_invalid_token(self):
        app = self._make_app()

        with patch("src.backend.app.api.v1.AuthRouter.redis_client") as mock_redis:
            mock_redis.get = AsyncMock(return_value=None)
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                resp = await ac.post(f"{self.BASE}/reset-password", params={"token": "bad-token"}, json={
                    "new_password": "newpass123",
                    "confirm_password": "newpass123"
                })
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_reset_password_mismatch(self):
        """Pydantic validator must reject mismatched passwords."""
        app = self._make_app()

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.post(f"{self.BASE}/reset-password", params={"token": "tok"}, json={
                "new_password": "abc123",
                "confirm_password": "xyz999"
            })
        assert resp.status_code == 422