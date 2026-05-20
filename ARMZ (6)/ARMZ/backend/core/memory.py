"""
Memory layer for short-term and long-term AI context storage.
"""

import asyncio
from django.core.cache import cache
from django.utils import timezone
from core.models import MemoryRecord


class MemoryLayer:
    def __init__(self, tenant=None):
        self.tenant = tenant

    async def store(self, payload):
        raise NotImplementedError()

    async def recall(self, key: str):
        raise NotImplementedError()

    async def list_recent(self, limit: int = 10):
        raise NotImplementedError()


class RedisMemory(MemoryLayer):
    SHORT_TERM_PREFIX = "ai:memory:short:"
    SHORT_TERM_TTL = 300  # 5 minutes

    async def store(self, payload):
        key = f"{self.SHORT_TERM_PREFIX}{self.tenant.id if self.tenant else 'global'}"
        records = cache.get(key, [])
        records.append({"timestamp": timezone.now().isoformat(), **payload})
        cache.set(key, records[-50:], timeout=self.SHORT_TERM_TTL)
        return records[-1]

    async def recall(self, key: str):
        return cache.get(f"{self.SHORT_TERM_PREFIX}{key}", [])

    async def list_recent(self, limit: int = 10):
        key = f"{self.SHORT_TERM_PREFIX}{self.tenant.id if self.tenant else 'global'}"
        return cache.get(key, [])[-limit:]


class DBMemory(MemoryLayer):
    async def store(self, payload):
        record = MemoryRecord(
            tenant=self.tenant,
            event_type=payload.get("event_type", "memory"),
            data=payload,
        )
        await asyncio.get_event_loop().run_in_executor(None, record.save)
        return {"id": record.id}

    async def recall(self, key: str):
        return await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: list(MemoryRecord.objects.filter(event_type=key).order_by("-created_at")[:20].values("id", "data", "created_at"))
        )

    async def list_recent(self, limit: int = 10):
        return await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: list(MemoryRecord.objects.order_by("-created_at")[:limit].values("id", "event_type", "data", "created_at"))
        )
