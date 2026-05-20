"""
Selector functions for services app - centralized query patterns
Prevents N+1 queries and consolidates repeated query logic

Reference: SELECTOR_REFACTORING_CODE.md for implementation guide
Last Updated: April 26, 2026
"""

from django.db.models import QuerySet, Count, Q
from services.models import (
    Job,
    Internship,
    Service,
    Company,
    Plan,
    Event,
    Webinar,
    Course,
    Student,
    Campaign,
    College,
    Assessment,
    EventRegistration,
    WebinarRegistration,
    CourseEnrollment,
    Interview,
    Notification,
    NotificationPreference,
)


# ============================================================================
# JOB SELECTORS (Replaces duplicate queries at lines 147, 240, 524)
# ============================================================================

def all_jobs_queryset() -> QuerySet[Job]:
    """Get all jobs regardless of status, ordered by recency, with company"""
    return Job.objects.select_related("company").order_by("-posted_at")


def active_jobs_queryset() -> QuerySet[Job]:
    """Get active jobs only, ordered by recency, with company"""
    return Job.objects.select_related("company").filter(
        status="Active"
    ).order_by("-posted_at")


def jobs_by_employer(employer_email: str) -> QuerySet[Job]:
    """Get jobs posted by specific employer, with company"""
    return Job.objects.select_related("company").filter(
        posted_by_email=employer_email
    ).order_by("-posted_at")


def job_by_id(job_id: int) -> Job | None:
    """Get specific job with company details"""
    return Job.objects.select_related("company").filter(id=job_id).first()


def job_count_by_company() -> dict:
    """Get job count aggregated by company"""
    return (
        Job.objects.values("company__name")
        .annotate(count=Count("id"))
        .order_by("-count")
    )


# ============================================================================
# INTERNSHIP SELECTORS
# ============================================================================

def all_internships_queryset() -> QuerySet[Internship]:
    """Get all internships, most recent first"""
    return Internship.objects.order_by("-posted_at")


def active_internships_queryset() -> QuerySet[Internship]:
    """Get active internships, most recent first"""
    return Internship.objects.filter(
        status="Active"
    ).order_by("-posted_at")


def internships_by_employer(employer_email: str) -> QuerySet[Internship]:
    """Get internships posted by specific employer"""
    return Internship.objects.filter(
        posted_by_email=employer_email
    ).order_by("-posted_at")


# ============================================================================
# SERVICE SELECTORS
# ============================================================================

def active_services() -> QuerySet[Service]:
    """Get active services, sorted alphabetically"""
    return Service.objects.filter(is_active=True).order_by("title")


def all_services() -> QuerySet[Service]:
    """Get all services, sorted alphabetically"""
    return Service.objects.order_by("title")


# ============================================================================
# COMPANY SELECTORS
# ============================================================================

def all_companies() -> QuerySet[Company]:
    """Get all companies, sorted by name"""
    return Company.objects.order_by("name")


def companies_with_job_count() -> QuerySet[Company]:
    """Get companies with count of active jobs"""
    return Company.objects.annotate(
        active_jobs=Count("job", filter=Q(job__status="Active"))
    ).order_by("-active_jobs")


def company_by_id(company_id: int) -> Company | None:
    """Get specific company"""
    return Company.objects.filter(id=company_id).first()


# ============================================================================
# PLAN SELECTORS
# ============================================================================

def active_plans() -> QuerySet[Plan]:
    """Get active plans"""
    return Plan.objects.filter(is_active=True).order_by("price")


def all_plans() -> QuerySet[Plan]:
    """Get all plans, sorted by ID"""
    return Plan.objects.order_by("id")


def plans_by_type(plan_type: str) -> QuerySet[Plan]:
    """Get plans by type (student/employer)"""
    return Plan.objects.filter(type=plan_type, is_active=True).order_by("price")


def plan_by_id(plan_id: int) -> Plan | None:
    """Get specific plan"""
    return Plan.objects.filter(id=plan_id).first()


# ============================================================================
# EVENT SELECTORS
# ============================================================================

def all_events() -> QuerySet[Event]:
    """Get all events, most recent first"""
    return Event.objects.order_by("-id")


def event_registrations_by_user(user_id: int) -> QuerySet[EventRegistration]:
    """Get events user is registered for, with event details"""
    return EventRegistration.objects.select_related("event").filter(
        user_id=user_id
    ).order_by("-registered_at")


def event_by_id(event_id: int) -> Event | None:
    """Get specific event"""
    return Event.objects.filter(id=event_id).first()


# ============================================================================
# WEBINAR SELECTORS
# ============================================================================

def all_webinars() -> QuerySet[Webinar]:
    """Get all webinars, most recent first"""
    return Webinar.objects.order_by("-created_at")


def webinar_registrations_by_user(user_id: int) -> QuerySet[WebinarRegistration]:
    """Get webinars user is registered for, with webinar details"""
    return WebinarRegistration.objects.select_related("webinar").filter(
        user_id=user_id
    ).order_by("-registered_at")


def webinar_by_id(webinar_id: int) -> Webinar | None:
    """Get specific webinar"""
    return Webinar.objects.filter(id=webinar_id).first()


# ============================================================================
# COURSE SELECTORS (Replaces duplicate queries at lines 703 & 711)
# ============================================================================

def all_courses() -> QuerySet[Course]:
    """Get all courses, most recent first"""
    return Course.objects.order_by("-created_at")


def course_enrollments_by_user(user_id: int) -> QuerySet[CourseEnrollment]:
    """Get courses user is enrolled in, with course details"""
    return CourseEnrollment.objects.select_related("course").filter(
        user_id=user_id
    ).order_by("-enrolled_at")


def course_by_id(course_id: int) -> Course | None:
    """Get specific course"""
    return Course.objects.filter(id=course_id).first()


# ============================================================================
# STUDENT SELECTORS
# ============================================================================

def all_students() -> QuerySet[Student]:
    """Get all students, most recent first."""
    return (
        Student.objects.filter(Q(user__role="student") | Q(user__isnull=True))
        .select_related("user")
        .order_by("-created_at")
    )


def student_by_id(student_id: int) -> Student | None:
    """Get specific student"""
    return Student.objects.filter(id=student_id).first()


# ============================================================================
# CAMPAIGN SELECTORS
# ============================================================================

def all_campaigns() -> QuerySet[Campaign]:
    """Get all campaigns, most recent first"""
    return Campaign.objects.order_by("-created_at")


def campaign_by_id(campaign_id: int) -> Campaign | None:
    """Get specific campaign"""
    return Campaign.objects.filter(id=campaign_id).first()


# ============================================================================
# COLLEGE SELECTORS
# ============================================================================

def all_colleges() -> QuerySet[College]:
    """Get all colleges, sorted by name"""
    return College.objects.order_by("name")


def college_by_id(college_id: int) -> College | None:
    """Get specific college"""
    return College.objects.filter(id=college_id).first()


# ============================================================================
# ASSESSMENT SELECTORS
# ============================================================================

def all_assessments() -> QuerySet[Assessment]:
    """Get all assessments"""
    return Assessment.objects.order_by("title")


def assessment_by_id(assessment_id: int) -> Assessment | None:
    """Get specific assessment"""
    return Assessment.objects.filter(id=assessment_id).first()


# ============================================================================
# INTERVIEW SELECTORS
# ============================================================================

def all_interviews() -> QuerySet[Interview]:
    """Get all interviews, most recent first"""
    return Interview.objects.order_by("-id")


def interviews_by_user(user_id: int) -> QuerySet[Interview]:
    """Get interviews for specific user"""
    return Interview.objects.filter(user_id=user_id).order_by("-id")


def interview_by_id(interview_id: int) -> Interview | None:
    """Get specific interview"""
    return Interview.objects.filter(id=interview_id).first()


# ============================================================================
# NOTIFICATION SELECTORS
# ============================================================================

def notifications_by_user(user_id: int) -> QuerySet[Notification]:
    """Get notifications for user, most recent first"""
    return Notification.objects.filter(user_id=user_id).order_by("-created_at")


def unread_notifications_count(user_id: int) -> int:
    """Get count of unread notifications for user"""
    return Notification.objects.filter(
        user_id=user_id, read=False
    ).count()


def notification_preferences_by_user(user_id: int) -> QuerySet[NotificationPreference]:
    """Get notification preferences for user"""
    return NotificationPreference.objects.filter(user_id=user_id)
