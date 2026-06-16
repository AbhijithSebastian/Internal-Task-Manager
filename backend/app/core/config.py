from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    app_name: str = "Internal Task Manager"
    app_debug: bool = True
    app_env: str = "development"

    database_url: str = "postgresql://taskmanager:taskmanager@postgres:5432/taskmanager"

    jwt_secret_key: str = "change-me-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    upload_dir: str = "/app/uploads"
    max_upload_size_mb: int = 50

    redis_url: str = ""

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
