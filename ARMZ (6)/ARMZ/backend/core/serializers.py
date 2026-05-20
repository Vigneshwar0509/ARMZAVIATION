from rest_framework import serializers

from core.models import AdminActionLog, PaymentMethod, ReportExport, SiteSetting


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = "__all__"


class SiteSettingWriteSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=100)
    value = serializers.CharField(allow_blank=True)
    description = serializers.CharField(allow_blank=True, required=False, default="")


class PaymentMethodSerializer(serializers.ModelSerializer):
    addedDate = serializers.DateTimeField(source="created_at", read_only=True)
    lastDigits = serializers.CharField(source="last_digits")
    expiryDate = serializers.CharField(source="expiry_date", allow_blank=True, required=False)

    class Meta:
        model = PaymentMethod
        fields = ["id", "name", "type", "lastDigits", "expiryDate", "is_default", "addedDate"]


class ReportExportSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="report_name", read_only=True)
    type = serializers.CharField(source="export_format", read_only=True)
    updated = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ReportExport
        fields = [
            "id",
            "title",
            "type",
            "period",
            "status",
            "file_name",
            "metadata",
            "updated",
            "created_at",
        ]


class ReportExportCreateSerializer(serializers.Serializer):
    reportName = serializers.CharField(default="Operations Report", allow_blank=True)
    format = serializers.CharField(default="pdf", allow_blank=True)
    period = serializers.CharField(default="", allow_blank=True)
    metadata = serializers.JSONField(default=dict)


class AdminActionLogSerializer(serializers.ModelSerializer):
    updated = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = AdminActionLog
        fields = ["id", "action_type", "status", "message", "metadata", "updated", "created_at"]


class AdminActionCreateSerializer(serializers.Serializer):
    actionType = serializers.CharField(required=True, allow_blank=False)
    metadata = serializers.JSONField(default=dict)


class AIRequestSerializer(serializers.Serializer):
    query = serializers.CharField(required=True, allow_blank=False)
    asyncTask = serializers.BooleanField(default=False, required=False)
    context = serializers.JSONField(default=dict, required=False)
    action = serializers.CharField(default="analyze", required=False)


class AIMonitorSerializer(serializers.Serializer):
    tenantId = serializers.UUIDField(read_only=True)
    totalEvents = serializers.IntegerField(read_only=True)
    totalMemory = serializers.IntegerField(read_only=True)
    totalToolsExecuted = serializers.IntegerField(read_only=True)
    usageStats = serializers.JSONField(read_only=True)
