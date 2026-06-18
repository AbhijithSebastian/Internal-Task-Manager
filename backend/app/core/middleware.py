import time
import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

logger = logging.getLogger("middleware")


class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - start

        logger.info(
            "%s %s %s %.4fs",
            request.method,
            request.url.path,
            response.status_code,
            elapsed,
        )
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60, whitelist_paths: set | None = None):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.whitelist_paths = whitelist_paths or {"/health", "/api/v1/docs", "/api/v1/openapi.json", "/api/v1/redoc"}
        self._buckets: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        rps = getattr(settings, "rate_limit_per_minute", self.requests_per_minute)
        if rps <= 0:
            return await call_next(request)
        if request.url.path in self.whitelist_paths:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        cutoff = now - 60

        self._buckets[client_ip] = [t for t in self._buckets[client_ip] if t > cutoff]

        if len(self._buckets[client_ip]) >= self.requests_per_minute:
            logger.warning("Rate limit exceeded for %s", client_ip)
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
            )

        self._buckets[client_ip].append(now)
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
