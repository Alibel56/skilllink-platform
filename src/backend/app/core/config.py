from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_URL_SYNC: str
    DEBUG: bool = False
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    REDIS_HOST: str
    REDIS_PORT: int = 6379
    PROFILING_ENABLED: bool = True
    SLOW_THRESHOLD_MS: float = 500.0
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    FROM_EMAIL: str = "noreply@skilllink.kz"

    # Used for email links; override in prod to the real domain
    BASE_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"

settings  = Settings()