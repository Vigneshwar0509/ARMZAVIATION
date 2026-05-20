from django.urls import path

from reviews.views import ReviewAdminDetailView, ReviewsView

urlpatterns = [
    path("reviews", ReviewsView.as_view()),
    path("reviews/<int:review_id>", ReviewAdminDetailView.as_view()),
]
