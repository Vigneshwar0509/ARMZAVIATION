from django.urls import path

from core.views import (
    AIAnalyzeView,
    AIFixView,
    AIMonitorView,
    AdminActionsView,
    MetaView,
    PaymentMethodDetailView,
    PaymentMethodsView,
    ReportExportsView,
    SiteSettingsView,
)

urlpatterns = [
    path("meta", MetaView.as_view()),
    path("core/settings", SiteSettingsView.as_view()),
    path("core/payment-methods", PaymentMethodsView.as_view()),
    path("core/payment-methods/<int:method_id>", PaymentMethodDetailView.as_view()),
    path("core/report-exports", ReportExportsView.as_view()),
    path("core/admin-actions", AdminActionsView.as_view()),
    path("core/ai/analyze", AIAnalyzeView.as_view()),
    path("core/ai/fix", AIFixView.as_view()),
    path("core/ai/monitor", AIMonitorView.as_view()),
]
