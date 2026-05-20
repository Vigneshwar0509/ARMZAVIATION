from rest_framework import serializers

from contact.models import ContactMessage, Lead
from contact.utils import sanitize_text


class ContactMessageSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name")

    class Meta:
        model = ContactMessage
        fields = ["id", "fullName", "email", "phone", "subject", "message", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        for field in ["full_name", "subject", "message", "phone"]:
            if field in attrs and isinstance(attrs[field], str):
                attrs[field] = sanitize_text(attrs[field])
        if "email" in attrs and isinstance(attrs["email"], str):
            attrs["email"] = attrs["email"].strip().lower()
        return attrs


class LeadSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "interest",
            "source",
            "status",
            "message",
            "metadata",
            "createdAt",
            "updatedAt",
        ]

    def validate(self, attrs):
        for field in ["name", "phone", "interest", "message"]:
            if field in attrs and isinstance(attrs[field], str):
                attrs[field] = sanitize_text(attrs[field])
        if "email" in attrs and isinstance(attrs["email"], str):
            attrs["email"] = attrs["email"].strip().lower()
        return attrs
