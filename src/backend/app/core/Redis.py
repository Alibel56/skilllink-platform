import redis.asyncio as redis
from src.backend.app.core.config import settings

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=settings.REDIS_PASSWORD or None,
    username=settings.REDIS_USER if settings.REDIS_PASSWORD else None,
    decode_responses=True,
)
