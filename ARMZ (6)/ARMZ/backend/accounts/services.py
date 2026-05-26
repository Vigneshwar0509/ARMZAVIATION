import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import OTPCode, PasswordResetToken, User
from accounts import selectors as accounts_selectors
from accounts.selectors import active_otp_query, admin_users_queryset, user_by_email, user_by_id_or_email, users_queryset, valid_password_reset_token
from accounts.serializers import UserSerializer
from services.email_service import build_otp_email, queue_email
from services.notification_dispatch import send_direct_notification
from services.utils import build_plan_code

logger = logging.getLogger(__name__)


def build_auth_payload(user):
    refresh = RefreshToken.for_user(user)
    payload = {
        "user": UserSerializer(user).data,
        "token": str(refresh.access_token),
        "refreshToken": str(refresh),
        "onboardingRequired": not user.is_admin_user
        and (not user.is_verified or not (user.subscription or "").strip() or user.subscription == "free"),
    }
    return payload, refresh


def mark_user_logged_in(user):
    if not user:
        return
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])


def ensure_student_profile(user):
    if not user or user.role != "student":
        return

    from services.models import Student

    student = Student.objects.filter(user=user).first()
    if student:
        return student

    student = Student.objects.filter(email__iexact=user.email).first()
    if student:
        student.user = user
        student.save(update_fields=["user"])
        return student

    return Student.objects.create(
        user=user,
        first_name=user.first_name or user.get_full_name().strip() or user.email,
        last_name=user.last_name or "",
        email=user.email,
        phone=user.phone or "",
        status="Active",
    )


def serialize_admin_user(user):
    return {
        "id": user.id,
        "name": user.get_full_name().strip() or user.username,
        "email": user.email,
        "role": "prime" if user.is_prime_admin else "admin",
        "status": "Active" if user.is_active else "Inactive",
        "permissions": ["*"],
        "lastActive": "N/A",
        "joinedAt": user.date_joined.isoformat() if user.date_joined else None,
        "isPrime": user.is_prime_admin,
    }


def ensure_prime_admin(request):
    if not request.user.is_authenticated or not request.user.is_prime_admin:
        raise PermissionDenied("Only the prime admin can manage admin accounts")


def bootstrap_prime_admin():
    from django.db import ProgrammingError, OperationalError

    prime_admin_email = getattr(settings, "PRIME_ADMIN_EMAIL", "") or ""
    prime_admin_password = getattr(settings, "PRIME_ADMIN_PASSWORD", "") or ""
    if not prime_admin_email or not prime_admin_password:
        return

    normalized_email = prime_admin_email.strip().lower()
    if not normalized_email:
        return

    try:
        user = user_by_email(normalized_email)
    except (ProgrammingError, OperationalError):
        return

    if not user:
        user = User(
            email=normalized_email,
            username=normalized_email,
            first_name=normalized_email.split("@", 1)[0],
            role="admin",
            is_verified=True,
            profile_complete=True,
            is_active=True,
        )
    elif not user.is_admin_user:
        user.role = "admin"
        user.is_verified = True
        user.profile_complete = True
        user.is_active = True

    user.set_password(prime_admin_password)
    user.save()


def queue_otp_email(email, otp_code, otp_type):
    if not email:
        return False

    recipient_name = email.split("@")[0].replace(".", " ").title()
    subject, body, html_body = build_otp_email(recipient_name, otp_code, otp_type)
    try:
        queue_email(subject, body, [email], html_message=html_body)
        return True
    except Exception as exc:
        logger.error("Failed to queue OTP email to %s: %s", email, str(exc))
        return False


@transaction.atomic
def register_user(serializer):
    user = serializer.save()
    otp_obj = OTPCode.create_code(email=user.email, otp_type="email", user=user)
    queue_otp_email(user.email, otp_obj.otp, "email")

    payload, refresh = build_auth_payload(user)
    payload["requiresVerification"] = True
    if settings.DEBUG:
        payload["otp"] = otp_obj.otp
    return payload, refresh


def login_user(user):
    if user.is_admin_user:
        raise PermissionDenied("Admin credentials must be used on the admin login page.")
    ensure_student_profile(user)
    mark_user_logged_in(user)
    return build_auth_payload(user)


def admin_login_payload(user):
    if not user.is_admin_user:
        raise PermissionDenied("Admin access denied")
    return {
        "message": "Admin credentials verified. OTP will be sent to your email.",
        "user": serialize_admin_user(user),
        "requiresOTP": True,
    }


def send_otp(data):
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    otp_type = data["type"]

    user = user_by_email(email) if email else None
    otp_obj = OTPCode.create_code(email=email, phone=phone, otp_type=otp_type, user=user)

    if email:
        email_sent = queue_otp_email(email, otp_obj.otp, otp_type)
        if not email_sent:
            logger.error("OTP email queue failed for %s", email)
            otp_obj.delete()
            raise ValidationError({"email": "Unable to send OTP email. Please check email settings and try again."})

    payload = {"message": "OTP sent successfully", "expiresAt": otp_obj.expires_at}
    if settings.DEBUG:
        payload["otp"] = otp_obj.otp
    return payload


@transaction.atomic
def verify_otp(data):
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    otp_obj = active_otp_query(data["otp"], data["type"], email=email, phone=phone).first()

    if not otp_obj or otp_obj.expires_at < timezone.now():
        raise ValidationError({"otp": "Invalid or expired OTP"})

    otp_obj.is_used = True
    otp_obj.save(update_fields=["is_used"])

    if data["type"] == "password_reset":
        user = otp_obj.user or user_by_email(email)
        if not user:
            raise NotFound("User not found")
        reset_token = PasswordResetToken.create_for_user(user)
        return {"token": reset_token.token}

    user = otp_obj.user or user_by_email(email)
    if not user:
        return {"verified": True}

    user.is_verified = True
    user.save(update_fields=["is_verified"])
    ensure_student_profile(user)
    mark_user_logged_in(user)
    return build_auth_payload(user)


def send_password_reset(email):
    normalized_email = email.strip().lower()
    user = user_by_email(normalized_email)
    if user:
        otp_obj = OTPCode.create_code(email=normalized_email, otp_type="password_reset", user=user)
        queue_otp_email(normalized_email, otp_obj.otp, "password_reset")
        payload = {"message": "Password reset instructions sent"}
        if settings.DEBUG:
            payload["otp"] = otp_obj.otp
        return payload
    return {"message": "Password reset instructions sent"}


@transaction.atomic
def reset_password(token, new_password):
    token_obj = valid_password_reset_token(token)
    if not token_obj or token_obj.expires_at < timezone.now():
        raise ValidationError({"token": "Invalid or expired reset token"})

    user = token_obj.user
    user.set_password(new_password)
    user.save(update_fields=["password"])

    token_obj.is_used = True
    token_obj.save(update_fields=["is_used"])
    return {"message": "Password reset successful"}


def refresh_access_token(refresh_token):
    refresh = RefreshToken(refresh_token)
    return {"token": str(refresh.access_token)}, refresh


def profile_payload(user):
    return {"user": UserSerializer(user).data}


def update_profile(serializer):
    user = serializer.save()
    return {"user": UserSerializer(user).data}


@transaction.atomic
def update_subscription(request_user, user_id, plan_id):
    target_user = user_by_id_or_email(user_id) if user_id else request_user

    if target_user and target_user != request_user and not request_user.is_admin_user:
        raise PermissionDenied("You cannot update another user's subscription")

    if not target_user:
        return {"queued": True, "userId": user_id, "planId": plan_id or "paid"}

    normalized_plan_id = build_plan_code(str(plan_id or "paid"))
    target_user.subscription = normalized_plan_id
    target_user.save(update_fields=["subscription"])
    send_direct_notification(
        target_user,
        title="Your subscription has been updated",
        description=f"Your account has been switched to {normalized_plan_id.replace('_', ' ').title()}.",
        notification_type="digest",
        action_url="/dashboard/subscriptions",
        priority="high",
    )
    return {"id": target_user.id, "subscription": target_user.subscription}


def list_users():
    return users_queryset()


def get_user_or_404(user_id):
    return accounts_selectors.get_user_or_404(user_id)


def list_admins():
    return [serialize_admin_user(user) for user in admin_users_queryset(settings.PRIME_ADMIN_EMAIL)]


@transaction.atomic
def create_admin(data):
    email = data.get("email", "").strip().lower()
    if not email:
        raise ValidationError({"email": "Email is required"})
    if user_by_email(email):
        raise ValidationError({"email": "An account with this email already exists"})

    name = data.get("name", "Admin User").strip()
    first_name, *rest = name.split(" ", 1)
    last_name = rest[0] if rest else ""
    password = data.get("password", "")

    user = User.objects.create(
        username=email,
        email=email,
        first_name=first_name,
        last_name=last_name,
        role="admin",
        is_active=True,
        is_verified=True,
        profile_complete=True,
    )
    user.set_password(password)
    user.save(update_fields=["password"])
    return serialize_admin_user(user)


@transaction.atomic
def update_admin(admin_id, data):
    user = accounts_selectors.admin_by_id(admin_id, settings.PRIME_ADMIN_EMAIL)
    if not user:
        raise NotFound("Admin not found")

    if "name" in data:
        name = str(data.get("name", "")).strip()
        first_name, *rest = name.split(" ", 1)
        user.first_name = first_name
        user.last_name = rest[0] if rest else ""
    if "email" in data:
        new_email = str(data.get("email", "")).strip().lower()
        existing = user_by_email(new_email)
        if existing and existing.id != user.id:
            raise ValidationError({"email": "An account with this email already exists"})
        user.email = new_email
        user.username = new_email
    if "status" in data:
        user.is_active = str(data.get("status")).lower() == "active"
    new_password = str(data.get("password", "")).strip()
    if new_password:
        user.set_password(new_password)
    user.save()
    return serialize_admin_user(user)


@transaction.atomic
def delete_admin(admin_id):
    user = accounts_selectors.admin_by_id(admin_id, settings.PRIME_ADMIN_EMAIL)
    if not user:
        raise NotFound("Admin not found")
    if user.is_prime_admin:
        raise ValidationError({"admin": "Cannot delete prime admin"})
    user.delete()
    return {"success": True}


def google_login(id_token_value):
    allowed_client_ids = getattr(settings, "GOOGLE_CLIENT_IDS", [])
    if isinstance(allowed_client_ids, str):
        allowed_client_ids = [allowed_client_ids]
    allowed_client_ids = [client_id.strip() for client_id in allowed_client_ids if client_id and client_id.strip()]

    if not allowed_client_ids:
        raise ValidationError({"google": "Google sign-in is not configured on the server"})

    try:
        info = id_token.verify_oauth2_token(id_token_value, google_requests.Request(), None)
    except Exception as exc:
        raise ValidationError({"google": "Invalid Google token"}) from exc

    audience = info.get("aud")
    if audience not in allowed_client_ids:
        raise ValidationError({"google": "Google client is not authorized"})

    email = (info.get("email") or "").strip().lower()
    if not email:
        raise ValidationError({"google": "Google account email not available"})
    if not info.get("email_verified", False):
        raise ValidationError({"google": "Google account email is not verified"})

    name = info.get("name", "Google User")
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "username": email,
            "first_name": name.split(" ")[0],
            "last_name": " ".join(name.split(" ")[1:]),
            "is_verified": True,
            "profile_complete": True,
        },
    )
    if created:
        user.set_unusable_password()
        user.save(update_fields=["password"])

    payload, refresh = build_auth_payload(user)
    payload["isNewUser"] = created
    return payload, refresh
