"""
Selector functions for bookings app - consolidate query patterns
Last Updated: April 26, 2026
"""

from django.db.models import QuerySet
from bookings.models import Application, SavedJob


# ============================================================================
# APPLICATION SELECTORS (Fixes N+1 at line 28)
# ============================================================================

def applications_queryset(job_id=None, internship_id=None, user_id=None) -> QuerySet[Application]:
    """
    Get applications with job, internship, and user details (prevents N+1 queries)
    Optionally filter by job_id, internship_id, or user_id
    """
    qs = Application.objects.select_related("job", "internship", "user").order_by("-applied_at")
    if job_id:
        qs = qs.filter(job_id=job_id)
    if internship_id:
        qs = qs.filter(internship_id=internship_id)
    if user_id:
        qs = qs.filter(user_id=user_id)
    return qs


def application_by_id(application_id: int) -> Application | None:
    """Get specific application with job and user details"""
    return Application.objects.select_related("job", "user").filter(
        id=application_id
    ).first()


def applications_by_user(user_id: int) -> QuerySet[Application]:
    """Get all applications by user with job details"""
    return Application.objects.select_related("job").filter(
        user_id=user_id
    ).order_by("-applied_at")


def applications_for_job(job_id: int) -> QuerySet[Application]:
    """Get all applications for a specific job with user details"""
    return Application.objects.select_related("user").filter(
        job_id=job_id
    ).order_by("-applied_at")


def applications_for_internship(internship_id: int) -> QuerySet[Application]:
    """Get all applications for a specific internship with user details"""
    return Application.objects.select_related("user").filter(
        internship_id=internship_id
    ).order_by("-applied_at")


# ============================================================================
# SAVED JOB SELECTORS
# ============================================================================

def saved_jobs_by_user(user_id: int) -> QuerySet[SavedJob]:
    """Get user's saved jobs with full job details"""
    return SavedJob.objects.filter(user_id=user_id).select_related("job").order_by("-created_at")


def saved_job_by_id(user_id: int, job_id: int) -> SavedJob | None:
    """Get specific saved job entry"""
    return SavedJob.objects.select_related("job").filter(
        user_id=user_id, job_id=job_id
    ).first()


def is_job_saved(user_id: int, job_id: int) -> bool:
    """Check if a job is saved by user"""
    return SavedJob.objects.filter(user_id=user_id, job_id=job_id).exists()
