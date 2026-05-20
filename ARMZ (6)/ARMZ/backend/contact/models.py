from django.conf import settings
from django.db import models


class ContactMessage(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["created_at"]),
        ]


class Lead(models.Model):
    STATUS_CHOICES = (
        ("new", "New"),
        ("contacted", "Contacted"),
        ("qualified", "Qualified"),
        ("converted", "Converted"),
        ("lost", "Lost"),
    )

    SOURCE_CHOICES = (
        ("job_apply", "Job Apply"),
        ("contact_form", "Contact Form"),
        ("newsletter", "Newsletter"),
        ("enquiry", "Enquiry"),
        ("program_interest", "Program Interest"),
        ("course_enroll", "Course Enroll"),
        ("conclave_register", "Conclave Register"),
        ("webinar_register", "Webinar Register"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="leads")
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    interest = models.CharField(max_length=255, blank=True)
    source = models.CharField(max_length=64, choices=SOURCE_CHOICES, default="enquiry")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["status"]),
            models.Index(fields=["source"]),
            models.Index(fields=["created_at"]),
        ]
