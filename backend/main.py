import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.cache import close_redis
from app.core.config import settings, ensure_validated
from app.core.logging import setup_logging
from app.core.middleware import RequestLogMiddleware, RateLimitMiddleware, SecurityHeadersMiddleware
from app.core.exception_handlers import (
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    integrity_error_handler,
    operational_error_handler,
)
from app.api.v1.router import api_router
from app.core.health import health_router
from sqlalchemy.exc import IntegrityError, OperationalError

setup_logging()
logger = logging.getLogger("main")

ensure_validated()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Starting %s v%s (env=%s debug=%s)",
        settings.app_name, "1.0.0", settings.app_env, settings.app_debug,
    )
    yield
    await close_redis()
    logger.info("Application shutting down")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    lifespan=lifespan,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestLogMiddleware)
if settings.rate_limit_per_minute > 0:
    app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.rate_limit_per_minute)

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(OperationalError, operational_error_handler)
app.add_exception_handler(Exception, global_exception_handler)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(health_router)
app.include_router(api_router, prefix="/api/v1")
