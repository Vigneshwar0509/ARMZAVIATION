"""
Selector functions for core app - admin/settings queries
Last Updated: April 26, 2026
"""

from core.models import SiteSetting, PaymentMethod, ReportExport, AdminActionLog


# ============================================================================
# SITE SETTING SELECTORS
# ============================================================================

def all_site_settings():
    """Get all site configuration settings, sorted by key"""
    return SiteSetting.objects.all().order_by("key")


def site_setting_by_key(key: str) -> SiteSetting | None:
    """Get specific site setting by key"""
    return SiteSetting.objects.filter(key=key).first()


# ============================================================================
# PAYMENT METHOD SELECTORS
# ============================================================================

def payment_methods_queryset():
    """Get payment methods sorted by default status and recency"""
    return PaymentMethod.objects.all().order_by("-is_default", "-created_at")


def payment_method_by_id(method_id: int) -> PaymentMethod | None:
    """Get specific payment method"""
    return PaymentMethod.objects.filter(pk=method_id).first()


def default_payment_method() -> PaymentMethod | None:
    """Get the default payment method"""
    return PaymentMethod.objects.filter(is_default=True).first()


# ============================================================================
# REPORT EXPORT SELECTORS
# ============================================================================

def report_exports_queryset():
    """Get all report exports, most recent first"""
    return ReportExport.objects.all().order_by("-updated_at", "-created_at")


# ============================================================================
# ADMIN ACTION LOG SELECTORS
# ============================================================================

def recent_admin_actions(limit: int = 20):
    """Get recent admin action logs"""
    return AdminActionLog.objects.all().order_by("-created_at")[:limit]
