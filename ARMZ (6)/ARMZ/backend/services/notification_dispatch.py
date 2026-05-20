import logging

from django.conf import settings

from accounts.models import User
from services.email_service import build_transactional_html_email, queue_email
from services.models import Notification, NotificationPreference, Plan
from services.utils import build_plan_code

logger = logging.getLogger(__name__)


PLAN_NOTIFICATION_RULES = {
    "prime": {"job"},
    "premium": {"job", "course", "application", "event", "digest"},
    "placement": {"job", "course", "application", "event", "webinar", "interview", "digest"},
    "recruiter_starter": {"job", "application", "digest"},
    "recruiter_growth": {"job", "application", "digest", "interview"},
    "recruiter_enterprise": {"job", "application", "digest", "interview", "webinar", "event"},
}


def _active_plan_codes(plan_type: str) -> set[str]:
    return {
        build_plan_code(plan.name)
        for plan in Plan.objects.filter(type=plan_type, is_active=True)
        if build_plan_code(plan.name)
    }


def _notification_allowed_for_user(user: User, notification_type: str) -> bool:
    if not user or not user.is_active:
        return False

    plan_code = build_plan_code(user.subscription)
    allowed_types = PLAN_NOTIFICATION_RULES.get(plan_code, set())
    if notification_type not in allowed_types:
        return False

    preference, _ = NotificationPreference.objects.get_or_create(user=user)
    if not preference.email_notifications:
        return False

    if notification_type == "job":
        return bool(preference.job_alerts)
    if notification_type == "interview":
        return bool(preference.interview_reminders)
    if notification_type == "application":
        return bool(preference.application_updates)
    if notification_type == "course":
        return bool(preference.course_updates)
    if notification_type in {"webinar", "event", "digest"}:
        return bool(preference.weekly_digest or preference.immediate_alerts)
    return True


def record_notification(user: User, title: str, description: str, notification_type: str, action_url: str = "", priority: str = "medium") -> Notification:
    return Notification.objects.create(
        user=user,
        title=title,
        description=description,
        type=notification_type,
        action_url=action_url,
        priority=priority,
    )


def send_plan_notification(user: User, title: str, description: str, notification_type: str, action_url: str = "", priority: str = "medium") -> bool:
    record_notification(user, title, description, notification_type, action_url, priority)

    if not _notification_allowed_for_user(user, notification_type):
        return False

    subject = f"[ARMZ {notification_type.capitalize()}] {title}"
    body = (
        f"{title}\n\n"
        f"{description}\n"
        + (f"\nView details: {action_url}\n" if action_url else "")
    )
    html_body = build_transactional_html_email(
        subject,
        [title, description] + ([f"View details: {action_url}"] if action_url else []),
        details=[
            ("Notification type", notification_type.capitalize()),
            ("Priority", priority.capitalize()),
        ],
        footer_lines=[
            "This email was sent by ARMZ Aviation.",
            "Visit your dashboard for more details.",
        ],
    )
    try:
        queue_email(subject, body, [user.email], html_message=html_body)
        return True
    except Exception:
        logger.exception("Failed to send %s notification email for user=%s", notification_type, user.id)
        return False


def send_direct_notification(user: User, title: str, description: str, notification_type: str = "digest", action_url: str = "", priority: str = "medium") -> bool:
    record_notification(user, title, description, notification_type, action_url, priority)

    subject = f"[ARMZ] {title}"
    body = (
        f"{title}\n\n"
        f"{description}\n"
        + (f"\nView details: {action_url}\n" if action_url else "")
    )
    html_body = build_transactional_html_email(
        subject,
        [title, description] + ([f"View details: {action_url}"] if action_url else []),
        details=[
            ("Notification type", notification_type.capitalize()),
            ("Priority", priority.capitalize()),
        ],
        footer_lines=[
            "This email was sent by ARMZ Aviation.",
            "Visit your dashboard for more details.",
        ],
    )
    try:
        queue_email(subject, body, [user.email], html_message=html_body)
        return True
    except Exception:
        logger.exception("Failed to send direct notification email for user=%s", user.id)
        return False


def broadcast_plan_notification(plan_type: str, notification_type: str, title: str, description: str, action_url: str = "", priority: str = "medium") -> int:
    codes = _active_plan_codes(plan_type)
    if not codes:
        return 0

    recipients = User.objects.filter(role=plan_type, is_active=True, subscription__in=codes)
    sent = 0
    for user in recipients:
        if send_plan_notification(user, title, description, notification_type, action_url, priority):
            sent += 1
    return sent
