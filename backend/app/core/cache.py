import json
import logging
from functools import wraps
from typing import Any, Callable, Optional

from app.core.config import settings

logger = logging.getLogger("cache")

try:
    import redis.asyncio as aioredis

    _redis_pool: Optional[aioredis.Redis] = None
    _redis_available = False
except ImportError:
    aioredis = None  # type: ignore
    _redis_pool = None
    _redis_available = False


async def get_redis() -> Optional["aioredis.Redis"]:
    global _redis_pool, _redis_available
    if _redis_available:
        return _redis_pool
    if not settings.redis_url:
        return None
    try:
        _redis_pool = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        await _redis_pool.ping()
        _redis_available = True
        logger.info("Redis connected at %s", settings.redis_url)
        return _redis_pool
    except Exception as e:
        logger.warning("Redis unavailable (%s). Caching disabled.", e)
        _redis_available = False
        return None


async def close_redis():
    global _redis_pool, _redis_available
    if _redis_pool:
        await _redis_pool.aclose()
        _redis_pool = None
        _redis_available = False


async def cache_get(key: str) -> Optional[Any]:
    r = await get_redis()
    if r is None:
        return None
    try:
        val = await r.get(key)
        if val is None:
            return None
        return json.loads(val)
    except Exception as e:
        logger.debug("Cache get error: %s", e)
        return None


async def cache_set(key: str, value: Any, ttl: int = 300):
    r = await get_redis()
    if r is None:
        return
    try:
        await r.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.debug("Cache set error: %s", e)


async def cache_delete(key: str):
    r = await get_redis()
    if r is None:
        return
    try:
        await r.delete(key)
    except Exception as e:
        logger.debug("Cache delete error: %s", e)


async def cache_delete_pattern(pattern: str):
    r = await get_redis()
    if r is None:
        return
    try:
        async for key in r.scan_iter(match=pattern):
            await r.delete(key)
    except Exception as e:
        logger.debug("Cache delete pattern error: %s", e)


def cached(ttl: int = 300):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = f"{func.__module__}:{func.__qualname__}:{hash(frozenset(kwargs.items()))}:{hash(tuple(args[1:] if args else ()))}"
            cached_val = await cache_get(key)
            if cached_val is not None:
                return cached_val
            result = await func(*args, **kwargs)
            await cache_set(key, result, ttl=ttl)
            return result

        return wrapper

    return decorator


def invalidates(pattern: str):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            await cache_delete_pattern(pattern)
            return result

        return wrapper

    return decorator
