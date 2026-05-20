"""
Business logic for reviews app
"""

from django.shortcuts import get_object_or_404

from reviews.models import Review
from reviews.serializers import ReviewSerializer


def list_reviews():
    """List approved reviews"""
    return Review.objects.filter(is_approved=True).order_by("-created_at")


def create_review(data, user):
    """Create a new review"""
    serializer = ReviewSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    serializer.save(user=user)
    return serializer.data


def get_review(review_id):
    """Get a review by ID"""
    return Review.objects.filter(pk=review_id).first()


def update_review(review_id, data, partial=False):
    """Update a review"""
    review = get_review(review_id)
    if not review:
        raise ValueError("Review not found")
    serializer = ReviewSerializer(review, data=data, partial=partial)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return serializer.data


def delete_review(review_id):
    """Delete a review"""
    review = get_review(review_id)
    if not review:
        raise ValueError("Review not found")
    review.delete()
    return {"success": True}