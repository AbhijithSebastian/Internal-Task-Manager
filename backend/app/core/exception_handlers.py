import logging
import traceback

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError

from app.core.config import settings

logger = logging.getLogger("exceptions")


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc)
    if settings.app_debug:
        tb = traceback.format_exc()
        logger.debug("Traceback:\n%s", tb)

    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )


async def http_exception_handler(request: Request, exc) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


async def validation_exception_handler(request: Request, exc) -> JSONResponse:
    try:
        errors = exc.errors() if hasattr(exc, "errors") else str(exc)
        safe_errors = _sanitize_errors(errors)
    except Exception:
        safe_errors = [{"msg": "Validation error", "type": "validation"}]
    return JSONResponse(
        status_code=422,
        content={"detail": safe_errors},
    )


def _sanitize_errors(errors: list) -> list:
    result = []
    for err in errors:
        safe = {}
        for k, v in err.items():
            if k == "ctx" and isinstance(v, dict):
                safe[k] = {str(kk): str(vv) for kk, vv in v.items()}
            elif k == "ctx":
                safe[k] = str(v)
            else:
                safe[k] = v
        result.append(safe)
    return result


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    logger.warning("IntegrityError on %s %s: %s", request.method, request.url.path, exc.orig)
    return JSONResponse(
        status_code=409,
        content={"detail": "A database integrity error occurred. The operation conflicts with existing data."},
    )


async def operational_error_handler(request: Request, exc: OperationalError) -> JSONResponse:
    logger.error("Database operational error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "Database service unavailable. Please try again later."},
    )
