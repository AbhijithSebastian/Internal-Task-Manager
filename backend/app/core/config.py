import logging
from typing import List, Set
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("config")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    app_name: str = "Internal Task Manager"
    app_debug: bool = True
    app_env: str = "development"

    database_url: str = "postgresql+psycopg://taskmanager:taskmanager@postgres:5432/taskmanager"

    jwt_secret_key: str = "change-me-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    upload_dir: str = "uploads"
    max_upload_size_mb: int = 50
    allowed_upload_extensions: str = "jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,csv,txt,zip"

    redis_url: str = ""

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@internaltool.com"
    smtp_from_name: str = "Internal Task Manager"

    password_reset_token_expire_minutes: int = 60

    frontend_url: str = "http://localhost:5173"

    rate_limit_per_minute: int = 60

    db_pool_size: int = 10
    db_max_overflow: int = 20

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_upload_extension_set(self) -> Set[str]:
        return {e.strip().lower() for e in self.allowed_upload_extensions.split(",") if e.strip()}

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() in ("development", "dev", "local")

    def validate(self) -> list[str]:
        warnings: list[str] = []
        if self.jwt_secret_key == "change-me-to-a-long-random-string":
            warnings.append("JWT_SECRET_KEY is still set to the default value. Change it in production.")
        if not self.database_url or "postgres" not in self.database_url:
            warnings.append("DATABASE_URL is not configured or not pointing to a PostgreSQL database.")
        if self.is_production:
            if self.app_debug:
                warnings.append("APP_DEBUG is True in production. Set it to False.")
            if "localhost" in self.cors_origins or "127.0.0.1" in self.cors_origins:
                warnings.append("CORS_ORIGINS contains localhost references in production.")
            if self.rate_limit_per_minute > 120:
                warnings.append("RATE_LIMIT_PER_MINUTE is set very high (%s).", self.rate_limit_per_minute)
        return warnings


settings = Settings()

_validated = False


def ensure_validated():
    global _validated
    if not _validated:
        warnings = settings.validate()
        for w in warnings:
            logger.warning("Configuration warning: %s", w)
        _validated = True
