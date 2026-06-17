import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

logger = logging.getLogger("health")
health_router = APIRouter(tags=["Health"])


@health_router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "ok"
    db_detail = None
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "error"
        db_detail = str(e)
        logger.error("Health check database failure: %s", e)

    result = {
        "status": "ok" if db_status == "ok" else "degraded",
        "app": settings.app_name,
        "version": "1.0.0",
        "environment": settings.app_env,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
    }
    if db_detail:
        result["database_detail"] = db_detail

    return result


@health_router.get("/health/ready")
def readiness_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.error("Readiness check failed: %s", e)
        return JSONResponse(
            status_code=503,
            content={"status": "not ready", "database": "disconnected"},
        )


@health_router.get("/health/live")
def liveness_check():
    return {"status": "alive"}
