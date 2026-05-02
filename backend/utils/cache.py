"""
Redis-backed cache with a thread-safe in-memory fallback.
Usage:
    cache = Cache()
    await cache.connect()
    await cache.set("key", "value", ttl=300)
    val = await cache.get("key")
"""

import json
import asyncio
import logging
from typing import Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class _MemoryBackend:
    """Simple in-process TTL cache used when Redis is unavailable."""

    def __init__(self):
        self._store: dict[str, tuple[Any, Optional[datetime]]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[str]:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires = entry
            if expires and datetime.utcnow() > expires:
                del self._store[key]
                return None
            return value

    async def set(self, key: str, value: str, ttl: Optional[int] = None):
        expires = datetime.utcnow() + timedelta(seconds=ttl) if ttl else None
        async with self._lock:
            self._store[key] = (value, expires)

    async def delete(self, key: str):
        async with self._lock:
            self._store.pop(key, None)

    async def close(self):
        pass


class Cache:
    def __init__(self, redis_url: Optional[str] = None):
        self._redis_url = redis_url
        self._backend = None

    async def connect(self):
        if self._redis_url:
            try:
                import redis.asyncio as aioredis
                client = aioredis.from_url(
                    self._redis_url, encoding="utf-8", decode_responses=True
                )
                await client.ping()
                self._backend = client
                logger.info("Cache: connected to Redis at %s", self._redis_url)
                return
            except Exception as exc:
                logger.warning("Cache: Redis unavailable (%s). Using in-memory fallback.", exc)

        self._backend = _MemoryBackend()
        logger.info("Cache: using in-memory backend.")

    async def get(self, key: str) -> Optional[Any]:
        raw = await self._backend.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return raw

    async def set(self, key: str, value: Any, ttl: int = 300):
        serialized = json.dumps(value) if not isinstance(value, str) else value
        await self._backend.set(key, serialized, ttl)  # type: ignore[arg-type]

    async def delete(self, key: str):
        await self._backend.delete(key)

    async def close(self):
        if self._backend:
            await self._backend.close()


# Singleton used across the app (initialised in main.py lifespan)
cache: Cache = Cache()
