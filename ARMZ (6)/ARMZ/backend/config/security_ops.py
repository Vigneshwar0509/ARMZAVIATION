from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Optional

import redis

SECURITY_BLOCK_KEY_PREFIX = "security:block:ip:"
SECURITY_FAILURE_KEY_PREFIX = "security:failure:ip:"
DASHBOARD_CACHE_TTL_KEY = "security:cache:dashboard_ttl"


def _now_ts() -> float:
    return time.time()


def _utc_iso(ts: Optional[float] = None) -> str:
    return datetime.fromtimestamp(ts or _now_ts(), tz=timezone.utc).isoformat()


def get_client_ip(request_or_meta: Any) -> str:
    meta = getattr(request_or_meta, "META", request_or_meta) or {}
    forwarded = meta.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return meta.get("REMOTE_ADDR", "") or ""


class RedisStore:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "")
        self._client = None

    @property
    def client(self):
        if self._client is None and self.redis_url:
            self._client = redis.Redis.from_url(self.redis_url, decode_responses=True)
        return self._client

    def get_json(self, key: str, default: Any = None) -> Any:
        client = self.client
        if client is None:
            return default
        raw = client.get(key)
        if raw is None:
            return default
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return default

    def set_json(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        client = self.client
        if client is None:
            return
        payload = json.dumps(value, default=str)
        if ttl is None:
            client.set(key, payload)
        else:
            client.set(key, payload, ex=max(1, int(ttl)))

    def increment(self, key: str, ttl: Optional[int] = None) -> int:
        client = self.client
        if client is None:
            return 0
        value = int(client.incr(key))
        if ttl is not None:
            client.expire(key, max(1, int(ttl)))
        return value


def is_ip_blocked(ip: str) -> bool:
    if not ip:
        return False
    store = RedisStore()
    return store.get_json(f"{SECURITY_BLOCK_KEY_PREFIX}{ip}") is not None


def block_ip(ip: str, ttl: int = 1800) -> None:
    if not ip:
        return
    store = RedisStore()
    store.set_json(
        f"{SECURITY_BLOCK_KEY_PREFIX}{ip}",
        {"ip": ip, "blocked_at": _utc_iso(), "reason": "security response"},
        ttl=ttl,
    )


def record_security_failure(ip: str, ttl: int = 3600, threshold: int = 5, block_ttl: int = 1800) -> int:
    if not ip:
        return 0
    store = RedisStore()
    failures = store.increment(f"{SECURITY_FAILURE_KEY_PREFIX}{ip}", ttl=ttl)
    if failures >= threshold:
        block_ip(ip, ttl=block_ttl)
    return failures


def get_dashboard_cache_ttl(default: int = 60) -> int:
    store = RedisStore()
    payload = store.get_json(DASHBOARD_CACHE_TTL_KEY, default=None)
    if isinstance(payload, dict):
        try:
            return int(payload.get("ttl_seconds", default))
        except (TypeError, ValueError):
            return default
    return default


def set_dashboard_cache_ttl(ttl_seconds: int) -> None:
    store = RedisStore()
    store.set_json(
        DASHBOARD_CACHE_TTL_KEY,
        {"ttl_seconds": int(ttl_seconds), "updated_at": _utc_iso()},
        ttl=max(60, int(ttl_seconds)),
    )
