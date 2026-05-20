from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from services.models import Internship, Job


class Booking(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    service = models.CharField(max_length=255, blank=True)
    message = models.TextField(blank=True)
    source = models.CharField(max_length=64, default="website")
    created_at = models.DateTimeField(auto_now_add=True)


class Application(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("reviewed", "Reviewed"),
        ("shortlisted", "Shortlisted"),
        ("interview_scheduled", "Interview Scheduled"),
        ("rejected", "Rejected"),
        ("hired", "Hired"),
        ("rescheduled", "Rescheduled"),
        ("cancelled", "Cancelled"),
        ("offer_extended", "Offer Extended"),
    )

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="job_applications", null=True, blank=True)
    internship = models.ForeignKey(Internship, on_delete=models.CASCADE, related_name="internship_applications", null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    interview_notes = models.TextField(blank=True, default="")
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("job", "user"), ("internship", "user"))
        indexes = [
            models.Index(fields=["job"]),
            models.Index(fields=["internship"]),
            models.Index(fields=["user"]),
            models.Index(fields=["applied_at"]),
        ]

    def clean(self):
        if bool(self.job) == bool(self.internship):
            raise ValidationError("Application must belong to either a job or an internship, not both.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class SavedJob(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_jobs")
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="saved_by_users")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "job")
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["job"]),
        ]
