from rest_framework import serializers

from reviews.models import Review
from reviews.utils import sanitize_text


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = "__all__"

    def validate_comment(self, value):
        return sanitize_text(value)
