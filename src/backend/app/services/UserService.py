import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.db.models.user import User
from src.backend.app.schemas.UserSchema import UserUpdate
from src.backend.app.dao.UserDao import UserDao
from src.backend.app.core.Security import hash_password


class UserService:

    @staticmethod
    async def get_by_id(session: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        result = await UserDao.get_by_id(session, user_id)
        return result

    @staticmethod
    async def get_by_email(session: AsyncSession, email: str) -> Optional[User]:
        result = await UserDao.get_by_email(session, email)
        return result

    @staticmethod
    async def update(session: AsyncSession, user: User, data: UserUpdate) -> User:
        update_data = data.model_dump(exclude_none=True)
        update_data.pop("role", None)

        if "password" in update_data:
            update_data["hashed_password"] = hash_password(update_data.pop("password"))

        result = await UserDao.update(session, user, update_data)
        return result

    @staticmethod
    async def delete(session: AsyncSession, user: User) -> None:
        # Cascade-delete every row that has an FK pointing at this user.
        # Without this Postgres rejects the DELETE because of the FKs.
        from sqlalchemy import text

        uid = str(user.id)

        # 1. Find owned specialist row (if any) and clean its dependents first.
        sp_rows = await session.execute(
            text("SELECT id FROM specialist WHERE user_id = :uid"), {"uid": uid}
        )
        specialist_ids = [str(r[0]) for r in sp_rows.fetchall()]

        if specialist_ids:
            sids = list(specialist_ids)
            for table in (
                "accreditation",
                "catalog",
                "rate",
                "comments",
                "order_requests",
            ):
                await session.execute(
                    text(f"DELETE FROM {table} WHERE specialist_id = ANY(:sids)"),
                    {"sids": sids},
                )
            # Detach orders that this user took as a specialist (preserve client history).
            await session.execute(
                text("UPDATE orders SET specialist_id = NULL WHERE specialist_id = ANY(:sids)"),
                {"sids": sids},
            )
            await session.execute(
                text("DELETE FROM specialist WHERE id = ANY(:sids)"), {"sids": sids}
            )

        # 2. Clean rows that hang directly off the user.
        for table, col in (
            ("audit_log", "user_id"),
            ("rate", "user_id"),
            ("comments", "user_id"),
            ("address", "user_id"),
            ("user_images", "user_id"),
            ("order_requests", "user_id"),
            ("messages", "sender_id"),
            ("orders", "user_id"),
        ):
            await session.execute(
                text(f"DELETE FROM {table} WHERE {col} = :uid"), {"uid": uid}
            )

        # 3. Finally — the user.
        await session.execute(
            text("DELETE FROM users WHERE id = :uid"), {"uid": uid}
        )
        await session.flush()