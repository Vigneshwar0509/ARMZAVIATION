"""
Business logic for core app
"""

import asyncio

from core.decision_engine import DecisionType, decision_engine
from core.models import AdminActionLog, MemoryRecord, PaymentMethod, ReportExport, SiteSetting, ToolExecutionRecord
from core.serializers import SiteSettingSerializer, SiteSettingWriteSerializer
from tenants.services import update_tenant_usage


def list_site_settings():
    """List all site settings"""
    return SiteSetting.objects.all()


def update_site_settings(settings_data):
    """Update multiple site settings"""
    saved = []
    for item in settings_data:
        setting, _ = SiteSetting.objects.update_or_create(
            key=item["key"],
            defaults={
                "value": item["value"],
                "description": item.get("description", ""),
            }
        )
        saved.append(setting)
    return saved


def list_payment_methods():
    """List payment methods"""
    return PaymentMethod.objects.all().order_by("-is_default", "-created_at")


def get_default_payment_method():
    """Get default payment method"""
    return PaymentMethod.objects.filter(is_default=True).first()


def list_report_exports():
    """List report exports"""
    return ReportExport.objects.all().order_by("-updated_at", "-created_at")


def list_admin_action_logs(limit=20):
    """List admin action logs"""
    return AdminActionLog.objects.all().order_by("-created_at")[:limit]


def _run_async(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    return loop.run_until_complete(coro)


def analyze_ai_request(request_data, tenant=None):
    if tenant:
        update_tenant_usage(tenant, api_calls=1)

    if decision_engine.memory:
        _run_async(
            decision_engine.memory.store(
                {
                    "event_type": "query",
                    "query": request_data.get("query"),
                    "tenant_id": str(tenant.id) if tenant else None,
                }
            )
        )

    decision = _run_async(decision_engine.analyze_request(request_data, tenant))

    if request_data.get("asyncTask"):
        from core.tasks import process_ai_request
        process_ai_request.delay(str(tenant.id) if tenant else None, request_data)
        return {
            "status": "queued",
            "decision": decision.action,
            "reasoning": decision.reasoning,
        }

    result = _run_async(decision_engine.execute_decision(decision, tenant))
    store_memory_event(
        {
            "event_type": "decision",
            "decision": decision.type.value,
            "params": decision.params,
            "result": result,
        },
        tenant,
    )

    if decision.type == DecisionType.CALL_TOOL:
        log_tool_execution(decision.action, decision.params, result, tenant)

    return {
        "decision": decision.type.value,
        "action": decision.action,
        "result": result,
        "reasoning": decision.reasoning,
    }


def store_memory_event(payload, tenant=None):
    if tenant:
        payload["tenant_id"] = str(tenant.id)
    record = MemoryRecord.objects.create(
        tenant=tenant,
        event_type=payload.get("event_type", "memory"),
        data=payload,
    )
    return record


def log_tool_execution(tool_name, input_payload, output_payload, tenant=None):
    return ToolExecutionRecord.objects.create(
        tenant=tenant,
        tool_name=tool_name,
        input_payload=input_payload,
        output_payload=output_payload,
    )


def get_monitor_data(tenant=None):
    events = MemoryRecord.objects.filter(tenant=tenant).count() if tenant else MemoryRecord.objects.count()
    tools_executed = ToolExecutionRecord.objects.filter(tenant=tenant).count() if tenant else ToolExecutionRecord.objects.count()
    usage = []
    if tenant:
        for usage_stat in tenant.usage_stats.order_by("-date")[:7]:
            usage.append(
                {
                    "date": usage_stat.date.isoformat(),
                    "api_calls": usage_stat.api_calls,
                    "tokens_used": usage_stat.tokens_used,
                    "errors": usage_stat.errors,
                }
            )

    return {
        "tenantId": str(tenant.id) if tenant else None,
        "totalEvents": events,
        "totalMemory": events,
        "totalToolsExecuted": tools_executed,
        "usageStats": usage,
    }


def create_report_export(data, user):
    """Create a report export"""
    report_name = data.get("reportName", "Operations Report").strip() or "Operations Report"
    export_format = data.get("format", "pdf").strip().lower() or "pdf"
    period = data.get("period", "").strip()
    
    metadata = data.get("metadata", {})
    if not isinstance(metadata, dict):
        metadata = {}

    export = ReportExport.objects.create(
        report_name=report_name,
        export_format=export_format,
        period=period,
        status="completed",
        file_name=f"{report_name.lower().replace(' ', '-')}-{export_format}.{export_format}",
        metadata=metadata,
        requested_by=user,
    )
    return export


def update_site_setting(key, value, description=""):
    """Update or create a single site setting"""
    setting, _ = SiteSetting.objects.update_or_create(
        key=key,
        defaults={
            "value": value,
            "description": description,
        }
    )
    return setting


def create_payment_method(data, user):
    """Create a payment method"""
    should_be_default = bool(data.get("is_default")) or not PaymentMethod.objects.exists()
    if should_be_default:
        PaymentMethod.objects.update(is_default=False)

    payload = dict(data)
    # avoid passing duplicate is_default kwarg
    payload.pop("is_default", None)

    method = PaymentMethod.objects.create(
        created_by=user,
        is_default=should_be_default,
        **payload
    )
    return method


def update_payment_method(method_id, data, user):
    """Update a payment method"""
    method = PaymentMethod.objects.filter(pk=method_id).first()
    if not method:
        raise ValueError("Payment method not found")

    if data.get("is_default"):
        PaymentMethod.objects.exclude(pk=method.pk).update(is_default=False)

    for key, value in data.items():
        setattr(method, key, value)
    method.save()
    return method


def delete_payment_method(method_id, user):
    """Delete a payment method"""
    method = PaymentMethod.objects.filter(pk=method_id).first()
    if not method:
        raise ValueError("Payment method not found")

    deleted_default = method.is_default
    method.delete()

    if deleted_default:
        next_method = PaymentMethod.objects.order_by("-created_at").first()
        if next_method:
            next_method.is_default = True
            next_method.save(update_fields=["is_default"])
    return {"success": True}


def create_report_export(data, user):
    """Create a report export"""
    report_name = data.get("reportName", "Operations Report").strip() or "Operations Report"
    export_format = data.get("format", "pdf").strip().lower() or "pdf"
    period = data.get("period", "").strip()
    
    metadata = data.get("metadata", {})
    if not isinstance(metadata, dict):
        metadata = {}

    export = ReportExport.objects.create(
        report_name=report_name,
        export_format=export_format,
        period=period,
        status="completed",
        file_name=f"{report_name.lower().replace(' ', '-')}-{export_format}.{export_format}",
        metadata=metadata,
        requested_by=user,
    )
    return export


def create_admin_action_log(data, user):
    """Create an admin action log"""
    action_type = data.get("actionType", "").strip()
    metadata = data.get("metadata", {})
    if not isinstance(metadata, dict):
        metadata = {}

    status_value = "completed"
    message = {
        "backup": "Backup request recorded",
        "export_data": "Data export request recorded",
        "reset_passwords": "User password reset request recorded",
        "clear_cache": "Cache clear request recorded",
    }.get(action_type, "Admin action recorded")

    action = AdminActionLog.objects.create(
        action_type=action_type,
        status=status_value,
        message=message,
        metadata=metadata,
        requested_by=user,
    )
    return action