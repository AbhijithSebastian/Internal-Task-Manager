from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.deps import get_current_user, require_permissions
from app.users.models import User

router = APIRouter()


@router.get("/settings")
def get_admin_settings(current_user: User = require_permissions(["users.view"])):
    return {
        "data": {
            "app_name": settings.app_name,
            "app_url": settings.frontend_url,
            "timezone": "UTC",
            "locale": "en",
            "mail_from_address": settings.smtp_from_email,
            "mail_from_name": settings.smtp_from_name,
            "mail_driver": "smtp",
            "password_min_length": 8,
            "session_lifetime": settings.jwt_access_token_expire_minutes,
            "two_factor_enabled": False,
            "lockout_threshold": 5,
            "api_rate_limit": settings.rate_limit_per_minute,
            "api_version": "1.0.0",
        }
    }
