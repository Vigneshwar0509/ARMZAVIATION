from rest_framework import serializers


class TenantSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField(max_length=100)
    api_key = serializers.CharField(max_length=255)
    config = serializers.JSONField(default=dict)
    is_active = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class TenantUsageSerializer(serializers.Serializer):
    tenant = TenantSerializer(read_only=True)
    date = serializers.DateField()
    api_calls = serializers.IntegerField(read_only=True)
    tokens_used = serializers.IntegerField(read_only=True)
    errors = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
