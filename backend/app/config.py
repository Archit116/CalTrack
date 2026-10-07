from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Turso database settings - try multiple env var names for compatibility
    turso_database_url: str = ""
    turso_auth_token: str = ""

    # JWT settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"

    def get_db_url(self) -> str:
        """Get database URL from various possible env var names"""
        return (
            self.turso_database_url
            or os.environ.get("TURSO_DATABASE_URL", "")
            or os.environ.get("DATABASE_URL", "")
        )

    def get_db_token(self) -> str:
        """Get auth token from various possible env var names"""
        return (
            self.turso_auth_token
            or os.environ.get("TURSO_AUTH_TOKEN", "")
            or os.environ.get("DATABASE_AUTH_TOKEN", "")
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
