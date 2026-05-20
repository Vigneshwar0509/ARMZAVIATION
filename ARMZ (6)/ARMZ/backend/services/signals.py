from django.db.models.signals import post_save
from django.dispatch import receiver

from services.models import Course, Event, Interview, Job, Webinar
from services.notification_dispatch import broadcast_plan_notification, send_plan_notification
from django.db.models.signals import post_delete
from config.cache_utils import invalidate_dashboard_cache


@receiver(post_save, sender=Job)
def notify_job_created(sender, instance, created, **kwargs):
    if not created:
        return
    broadcast_plan_notification(
        plan_type="student",
        notification_type="job",
        title=f"New job: {instance.title}",
        description=f"{instance.company_name} posted a new role in {instance.location}.",
        action_url=f"/jobs/{instance.id}",
    )


@receiver(post_save, sender=Course)
def notify_course_created(sender, instance, created, **kwargs):
    if not created:
        return
    broadcast_plan_notification(
        plan_type="student",
        notification_type="course",
        title=f"New course: {instance.title}",
        description="A new learning resource has been added to your dashboard.",
        action_url=f"/dashboard/courses/{instance.id}",
    )


@receiver(post_save, sender=Event)
def notify_event_created(sender, instance, created, **kwargs):
    if not created:
        return
    broadcast_plan_notification(
        plan_type="student",
        notification_type="event",
        title=f"New event: {instance.title}",
        description="A new platform event is now available.",
        action_url=f"/events/{instance.id}",
    )


@receiver(post_save, sender=Webinar)
def notify_webinar_created(sender, instance, created, **kwargs):
    if not created:
        return
    broadcast_plan_notification(
        plan_type="student",
        notification_type="webinar",
        title=f"New webinar: {instance.title}",
        description="A new webinar has been scheduled for eligible placement users.",
        action_url=f"/dashboard/webinars",
        priority="high",
    )


@receiver(post_save, sender=Interview)
def notify_interview_created(sender, instance, created, **kwargs):
    if not created:
        return
    send_plan_notification(
        instance.user,
        title=f"Interview scheduled: {instance.title}",
        description="An interview has been scheduled for your account.",
        notification_type="interview",
        action_url="/dashboard/interviews",
        priority="high",
    )


@receiver(post_save, sender=Job)
def invalidate_cache_on_job_save(sender, instance, created, **kwargs):
    # Invalidate global dashboard cache and employer-specific cache
    invalidate_dashboard_cache(None)


@receiver(post_delete, sender=Job)
def invalidate_cache_on_job_delete(sender, instance, **kwargs):
    invalidate_dashboard_cache(None)


from bookings.models import Application, SavedJob


@receiver(post_save, sender=Application)
@receiver(post_delete, sender=Application)
def invalidate_cache_on_application_change(sender, instance, **kwargs):
    # clear dashboards for job owner and applicant
    try:
        invalidate_dashboard_cache(instance.user_id)
    except Exception:
        pass


@receiver(post_save, sender=SavedJob)
@receiver(post_delete, sender=SavedJob)
def invalidate_cache_on_savedjob(sender, instance, **kwargs):
    try:
        invalidate_dashboard_cache(instance.user_id)
    except Exception:
        pass

