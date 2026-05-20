from django.urls import path

from bookings.views import (
    ApplicationNotesView,
    ApplicationStatusView,
    ApplicationsView,
    BookingsView,
    InternshipApplyView,
    JobApplyView,
    SavedJobDetailView,
    SavedJobsView,
)

urlpatterns = [
    path("bookings", BookingsView.as_view()),
    path("applications", ApplicationsView.as_view()),
    path("applications/<int:application_id>/status", ApplicationStatusView.as_view()),
    path("applications/<int:application_id>/notes", ApplicationNotesView.as_view()),
    path("jobs/<int:job_id>/apply", JobApplyView.as_view()),
    path("internships/<int:internship_id>/apply", InternshipApplyView.as_view()),
    path("users/<int:user_id>/saved-jobs", SavedJobsView.as_view()),
    path("users/<int:user_id>/saved-jobs/<int:job_id>", SavedJobDetailView.as_view()),
]
