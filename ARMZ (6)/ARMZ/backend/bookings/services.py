"""
Business logic for bookings app
"""

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied, ValidationError

from bookings.models import Application, Booking, SavedJob
from bookings.selectors import (
    application_by_id,
    applications_for_internship,
    applications_for_job,
    applications_queryset,
    is_job_saved,
    saved_job_by_id,
    saved_jobs_by_user,
)
from bookings.serializers import ApplicationSerializer, BookingSerializer, SavedJobSerializer
from services.models import Internship, Job
from services.notification_dispatch import send_plan_notification


def create_booking(data):
    """Create a new booking"""
    serializer = BookingSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return serializer.data


def list_applications(user, job_id=None, internship_id=None, user_id=None):
    """List applications with proper filtering and population"""
    queryset = applications_queryset(job_id=job_id, internship_id=internship_id, user_id=user_id)
    if user.role == "employer":
        queryset = queryset.filter(job__posted_by_email=user.normalized_email)
    elif not user.is_admin_user:
        queryset = queryset.filter(user=user)
    return queryset


def update_application_status(application_id, user, status):
    """Update application status with permission checks and complete data return"""
    item = application_by_id(application_id)
    if not item:
        raise get_object_or_404(Application, pk=application_id)  # For 404

    previous_status = item.status
    if user.is_admin_user:
        pass
    elif user.role == "employer":
        if item.job and item.job.posted_by_email != user.normalized_email:
            raise PermissionDenied("You cannot update applications for another employer's jobs")
        elif not item.job:
            raise PermissionDenied("Only job applications can be updated by employers")
    else:
        raise PermissionDenied("Only employers or admins can update application status")

    valid_statuses = {choice for choice, _ in Application.STATUS_CHOICES}
    if status not in valid_statuses:
        raise ValidationError({"status": "Invalid application status"})

    item.status = status
    item.save(update_fields=["status"])

    if previous_status != item.status:
        send_plan_notification(
            item.user,
            title=f"Application update: {item.job.title if item.job else item.internship.title}",
            description=f"Your application status is now {item.get_status_display()}.",
            notification_type="application",
            action_url="/dashboard/applications",
            priority="high" if item.status in {"shortlisted", "hired"} else "medium",
        )

    # Fetch with all relations for complete serialization
    item = application_by_id(application_id)
    if not item:
        item = Application.objects.select_related('job', 'internship', 'user').get(pk=application_id)
    
    return ApplicationSerializer(item).data


@transaction.atomic
def apply_to_job(job_id, user_id, request_user):
    """Apply to a job with validation and complete data return"""
    job = get_object_or_404(Job, pk=job_id)
    if request_user.id != user_id and not request_user.is_admin_user:
        raise PermissionDenied("You cannot apply on behalf of another user")

    application, created = Application.objects.get_or_create(job=job, user_id=user_id)
    job.applications = applications_for_job(job_id).count()
    job.save(update_fields=["applications"])
    
    # Fetch the application with all related data populated
    application = application_by_id(application.id)
    if not application:
        application = Application.objects.select_related('job', 'user').get(pk=application.id)
    
    serialized_data = ApplicationSerializer(application).data
    return serialized_data


@transaction.atomic
def apply_to_internship(internship_id, user_id, request_user):
    """Apply to an internship with validation and complete data return"""
    internship = get_object_or_404(Internship, pk=internship_id)
    if request_user.id != user_id and not request_user.is_admin_user:
        raise PermissionDenied("You cannot apply on behalf of another user")

    application, created = Application.objects.get_or_create(internship=internship, user_id=user_id)
    internship.applications = applications_for_internship(internship_id).count()
    internship.save(update_fields=["applications"])
    
    # Fetch the application with all related data populated
    application = application_by_id(application.id)
    if not application:
        application = Application.objects.select_related('internship', 'user').get(pk=application.id)
    
    return ApplicationSerializer(application).data


def list_saved_jobs(user_id, request_user):
    """List user's saved jobs"""
    if request_user.id != user_id and not request_user.is_admin_user:
        raise PermissionDenied("You cannot view another user's saved jobs")
    queryset = saved_jobs_by_user(user_id)
    return queryset


def save_job(user_id, job_id, request_user):
    """Save a job for user"""
    if request_user.id != user_id and not request_user.is_admin_user:
        raise PermissionDenied("You cannot modify another user's saved jobs")
    item, _ = SavedJob.objects.get_or_create(user_id=user_id, job_id=job_id)
    return SavedJobSerializer(item).data


def unsave_job(user_id, job_id, request_user):
    """Remove saved job"""
    if request_user.id != user_id and not request_user.is_admin_user:
        raise PermissionDenied("You cannot modify another user's saved jobs")
    SavedJob.objects.filter(user_id=user_id, job_id=job_id).delete()
    return {"success": True}