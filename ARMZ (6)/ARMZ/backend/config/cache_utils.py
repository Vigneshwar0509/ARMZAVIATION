import time
from typing import Optional, Tuple

from django.core.cache import cache

from config.security_ops import get_dashboard_cache_ttl, is_ip_blocked, record_security_failure, set_dashboard_cache_ttl

DEFAULT_TIMEOUT = 60  # seconds for dashboard caching
GLOBAL_DASHBOARD_VERSION_KEY = "dashboard:version:global"


def _user_dashboard_version_key(user_id: int) -> str:
    return f"dashboard:version:user:{user_id}"


def cache_get(key: str):
    try:
        return cache.get(key)
    except Exception:
        return None


def cache_set(key: str, value, timeout: Optional[int] = None):
    try:
        cache.set(key, value, timeout if timeout is not None else get_dashboard_cache_ttl(DEFAULT_TIMEOUT))
    except Exception:
        pass


def get_dashboard_cache_versions(user_id: int) -> Tuple[str, str]:
    try:
        global_version = str(cache.get(GLOBAL_DASHBOARD_VERSION_KEY) or "0")
        user_version = str(cache.get(_user_dashboard_version_key(user_id)) or "0")
        return global_version, user_version
    except Exception:
        return "0", "0"


def invalidate_dashboard_cache(user_id: Optional[int] = None):
    """Invalidate dashboard cache for a specific user or globally."""
    try:
        version = str(time.time_ns())
        if user_id is not None:
            cache.set(_user_dashboard_version_key(user_id), version, timeout=None)
        else:
            cache.set(GLOBAL_DASHBOARD_VERSION_KEY, version, timeout=None)
    except Exception:
        pass


def security_block_key(ip_address: str) -> str:
    return f"security:block:ip:{ip_address}"


def is_security_blocked(ip_address: str) -> bool:
    return is_ip_blocked(ip_address)


def record_security_failure_event(ip_address: str, *, threshold: int = 5, block_ttl: int = 1800) -> int:
    return record_security_failure(ip_address, threshold=threshold, block_ttl=block_ttl)


def update_dashboard_cache_ttl(ttl_seconds: int) -> None:
    set_dashboard_cache_ttl(ttl_seconds)
