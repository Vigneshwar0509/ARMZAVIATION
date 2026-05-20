"""
Background tasks for AI decision processing and platform automation.
"""

from celery import shared_task
from django.conf import settings
from django.utils import timezone
from core.decision_engine import decision_engine
from tenants.services import update_tenant_usage
from core.services import log_tool_execution, store_memory_event


@shared_task(bind=True)
def process_ai_request(self, tenant_id, request_data):
    """Process long-running AI decision requests asynchronously."""
    from tenants.models import Tenant
    tenant = Tenant.objects.filter(id=tenant_id).first() if tenant_id else None
    decision = self._analyze_request_sync(request_data, tenant)
    result = self._execute_decision_sync(decision, tenant)
    if tenant:
        update_tenant_usage(tenant, api_calls=1)
    return result


def _ensure_engine():
    return decision_engine


def _execute_decision_sync(decision, tenant=None):
    engine = _ensure_engine()
    return _run_async(engine.execute_decision(decision, tenant))


def _analyze_request_sync(request_data, tenant=None):
    engine = _ensure_engine()
    return engine._make_decision(request_data)


def _run_async(coro):
    import asyncio

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    return loop.run_until_complete(coro)


@shared_task(bind=True)
def send_daily_digest(self):
    """Periodic task to generate platform health summaries."""
    return {
        "status": "digest_generated",
        "timestamp": timezone.now().isoformat(),
    }
