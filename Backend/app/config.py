from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DB_HOST: str = "db"
    DB_PORT: int = 5432
    DB_NAME: str = "mathmaster_db"
    DB_USER: str = "mathmaster"
    DB_PASSWORD: str = "mathmaster123"

    # JWT
    JWT_SECRET: str = "mathmaster-super-secret-jwt-key-2024"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_IN: int = 7  # días

    # Server
    PORT: int = 3000
    NODE_ENV: str = "development"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:8080"

    # Rate Limiting
    RATE_LIMIT_WINDOW_MS: int = 900000  # 15 minutos
    RATE_LIMIT_MAX_REQUESTS: int = 100

    # Email SMTP Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@mathmaster.com"
    SMTP_FROM_NAME: str = "MathMaster"

    # Frontend URL
    FRONTEND_URL: str = "http://localhost:8080"

    @property
    def EMAIL_CONFIGURED(self) -> bool:
        return bool(self.SMTP_USER and self.SMTP_PASSWORD)

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
