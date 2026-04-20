import logging

from src.backend.app.core.Redis import redis_client

logger = logging.getLogger(__name__)


class TokenBlocklistService:

    @staticmethod
    async def add(jti: str, exp_seconds: int) -> None:
        if exp_seconds <= 0:
            # Токен уже истёк — добавлять в blocklist нет смысла
            return
        try:
            await redis_client.setex(
                f"blocklist:{jti}",
                exp_seconds,
                "true"
            )
        except Exception as e:
            logger.error("Redis error on blocklist add (jti=%s): %s", jti, e)
            raise

    @staticmethod
    async def is_blocked(jti: str) -> bool:
        try:
            value = await redis_client.get(f"blocklist:{jti}")
            return value is not None
        except Exception as e:
            logger.error("Redis error on blocklist check (jti=%s): %s", jti, e)
            # При недоступном Redis не блокируем запросы,
            # но логируем инцидент. Смените на `raise` если нужна строгая политика.
            return False