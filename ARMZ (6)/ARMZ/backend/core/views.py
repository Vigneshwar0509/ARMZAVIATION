from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from config.rbac import require_roles
from config.response import error_response, success_response
from config.throttling import APIKeyRateThrottle

from core.models import AdminActionLog, PaymentMethod, ReportExport, SiteSetting
from core.permissions import IsAdminRole
from core.serializers import (
    AdminActionCreateSerializer,
    AdminActionLogSerializer,
    AIRequestSerializer,
    AIMonitorSerializer,
    PaymentMethodSerializer,
    ReportExportCreateSerializer,
    ReportExportSerializer,
    SiteSettingSerializer,
    SiteSettingWriteSerializer,
)
from core import services as core_services
from core.utils import app_metadata


class MetaView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def get(self, request: Request) -> Response:
        return success_response(app_metadata(), "Service healthy")


@require_roles("admin")
class SiteSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    throttle_classes = [UserRateThrottle]

    def get(self, request: Request) -> Response:
        settings = core_services.list_site_settings()
        return success_response(
            {"settings": SiteSettingSerializer(settings, many=True).data},
            "Site settings retrieved",
        )

    def post(self, request: Request) -> Response:
        payload = request.data

        if isinstance(payload, dict) and isinstance(payload.get("settings"), list):
            serializer = SiteSettingWriteSerializer(data=payload["settings"], many=True)
            serializer.is_valid(raise_exception=True)
            saved = core_services.update_site_settings(serializer.validated_data)
            return success_response(
                {"settings": SiteSettingSerializer(saved, many=True).data},
                "Site settings updated",
            )

        serializer = SiteSettingWriteSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        item = serializer.validated_data
        setting = core_services.update_site_setting(
            item["key"], item["value"], item.get("description", "")
        )
        return success_response(
            {"setting": SiteSettingSerializer(setting).data},
            "Site setting updated",
        )


@require_roles("admin")
class PaymentMethodsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    throttle_classes = [UserRateThrottle]

    def get(self, request: Request) -> Response:
        methods = core_services.list_payment_methods()
        return success_response(
            {"paymentMethods": PaymentMethodSerializer(methods, many=True).data},
            "Payment methods loaded",
        )

    def post(self, request: Request) -> Response:
        serializer = PaymentMethodSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        method = core_services.create_payment_method(serializer.validated_data, request.user)
        return success_response(
            {"paymentMethod": PaymentMethodSerializer(method).data},
            "Payment method created",
        )


@require_roles("admin")
class PaymentMethodDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    throttle_classes = [UserRateThrottle]

    def put(self, request: Request, method_id: int) -> Response:
        serializer = PaymentMethodSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        method = core_services.update_payment_method(method_id, serializer.validated_data, request.user)
        return success_response(
            {"paymentMethod": PaymentMethodSerializer(method).data},
            "Payment method updated",
        )

    def delete(self, request: Request, method_id: int) -> Response:
        result = core_services.delete_payment_method(method_id, request.user)
        return success_response(result, "Payment method deleted")


@require_roles("admin")
class ReportExportsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    throttle_classes = [UserRateThrottle]

    def get(self, request: Request) -> Response:
        exports = core_services.list_report_exports()
        return success_response(
            {"reportExports": ReportExportSerializer(exports, many=True).data},
            "Report exports retrieved",
        )

    def post(self, request: Request) -> Response:
        serializer = ReportExportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        export = core_services.create_report_export(data, request.user)
        return success_response(
            {"reportExport": ReportExportSerializer(export).data},
            "Report export started",
        )


@require_roles("admin")
class AdminActionsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    throttle_classes = [UserRateThrottle]

    def get(self, request: Request) -> Response:
        actions = core_services.list_admin_action_logs(20)
        return success_response(
            {"adminActions": AdminActionLogSerializer(actions, many=True).data},
            "Admin actions retrieved",
        )

    def post(self, request: Request) -> Response:
        serializer = AdminActionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        action = core_services.create_admin_action_log(data, request.user)
        return success_response(
            {"adminAction": AdminActionLogSerializer(action).data},
            "Admin action logged",
        )


class AIAnalyzeView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [APIKeyRateThrottle]

    def post(self, request: Request) -> Response:
        tenant = getattr(request, "tenant", None)
        if not tenant:
            return error_response("Invalid tenant API key", status_code=status.HTTP_401_UNAUTHORIZED)

        serializer = AIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = core_services.analyze_ai_request(serializer.validated_data, tenant)
        return success_response({"analysis": result}, "AI analysis completed")


class AIFixView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [APIKeyRateThrottle]

    def post(self, request: Request) -> Response:
        tenant = getattr(request, "tenant", None)
        if not tenant:
            return error_response("Invalid tenant API key", status_code=status.HTTP_401_UNAUTHORIZED)

        serializer = AIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        payload["action"] = "fix"
        result = core_services.analyze_ai_request(payload, tenant)
        return success_response({"fix": result}, "AI fix pipeline completed")


class AIMonitorView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [APIKeyRateThrottle]

    def get(self, request: Request) -> Response:
        tenant = getattr(request, "tenant", None)
        if not tenant:
            return error_response("Invalid tenant API key", status_code=status.HTTP_401_UNAUTHORIZED)

        monitor_data = core_services.get_monitor_data(tenant)
        return success_response({"monitor": monitor_data}, "AI monitor data retrieved")
