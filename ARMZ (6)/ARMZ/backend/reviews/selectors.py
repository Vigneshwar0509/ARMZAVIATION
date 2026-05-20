"""
Selector functions for reviews app
Last Updated: April 26, 2026
"""

from reviews.models import Review


# ============================================================================
# REVIEW SELECTORS
# ============================================================================

def approved_reviews_queryset():
    """Get approved reviews, most recent first, with user details"""
    return Review.objects.filter(is_approved=True).select_related("user").order_by("-created_at")


def review_by_id(review_id: int) -> Review | None:
    """Get review by ID with user details"""
    return Review.objects.select_related("user").filter(pk=review_id).first()


def pending_reviews_queryset():
    """Get reviews pending approval"""
    return Review.objects.filter(is_approved=False).select_related("user").order_by("-created_at")


def reviews_by_user(user_id: int):
    """Get all reviews by a specific user"""
    return Review.objects.filter(user_id=user_id).order_by("-created_at")
