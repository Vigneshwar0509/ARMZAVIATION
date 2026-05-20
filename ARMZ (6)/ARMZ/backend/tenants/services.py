from datetime import date
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from tenants.models import Tenant, TenantUsage


def get_tenant_by_api_key(api_key: str) -> Tenant:
    return Tenant.objects.get(api_key=api_key, is_active=True)


def create_tenant(name: str, api_key: str, config: dict = None) -> Tenant:
    config = config or {}
    return Tenant.objects.create(name=name, api_key=api_key, config=config)


def update_tenant_usage(tenant: Tenant, tokens: int = 0, api_calls: int = 1, error: bool = False):
    today = date.today()
    with transaction.atomic():
        usage, _ = TenantUsage.objects.get_or_create(tenant=tenant, date=today)
        usage.api_calls += api_calls
        usage.tokens_used += tokens
        if error:
            usage.errors += 1
        usage.save()
    return usage


def get_tenant_usage(tenant: Tenant):
    return TenantUsage.objects.filter(tenant=tenant).order_by("-date")
