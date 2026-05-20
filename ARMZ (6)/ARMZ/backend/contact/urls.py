from django.urls import path

from contact.views import ContactView, LeadDeleteView, LeadsView, LeadStatusView

urlpatterns = [
    path("contact", ContactView.as_view()),
    path("leads", LeadsView.as_view()),
    path("leads/<int:lead_id>/status", LeadStatusView.as_view()),
    path("leads/<int:lead_id>", LeadDeleteView.as_view()),
]
