from django.db.models import Q, QuerySet

from accounts.models import OTPCode, PasswordResetToken, User


def user_by_email(email: str):
    normalized_email = (email or "").strip().lower()
    if not normalized_email:
        return None
    return User.objects.filter(email__iexact=normalized_email).first()


def user_by_id_or_email(identifier):
    if not identifier:
        return None
    if isinstance(identifier, str) and "@" in identifier:
        return user_by_email(identifier)
    return User.objects.filter(id=identifier).first()


def active_otp_query(otp: str, otp_type: str, email: str = "", phone: str = "") -> QuerySet[OTPCode]:
    queryset = OTPCode.objects.filter(otp=otp, otp_type=otp_type, is_used=False)
    if email:
        queryset = queryset.filter(Q(email__iexact=email) | Q(user__email__iexact=email))
    elif phone:
        queryset = queryset.filter(phone=phone)
    return queryset.order_by("-created_at")


def valid_password_reset_token(token: str):
    return PasswordResetToken.objects.select_related("user").filter(token=token, is_used=False).first()


def admin_users_queryset(prime_admin_email: str):
    return User.objects.filter(Q(role="admin") | Q(email__iexact=prime_admin_email)).order_by("-date_joined")


def user_by_id(user_id: int) -> User | None:
    """Get user by ID"""
    return User.objects.filter(id=user_id).first()


def get_user_or_404(user_id: int) -> User:
    """Get user by ID or raise a 404."""
    from django.shortcuts import get_object_or_404

    return get_object_or_404(User, id=user_id)


def users_queryset() -> QuerySet[User]:
    """Get all users, most recent first"""
    return User.objects.all().order_by("-date_joined")


def admin_by_id(admin_id: int, prime_admin_email: str = "") -> User | None:
    """Get admin by ID (admin role or prime admin)"""
    admin = User.objects.filter(id=admin_id, role="admin").first()
    if not admin and prime_admin_email:
        admin = User.objects.filter(id=admin_id, email__iexact=prime_admin_email).first()
    return admin
    if admin:
        return admin
    if prime_admin_email:
        return User.objects.filter(id=admin_id, email__iexact=prime_admin_email).first()
    return None
