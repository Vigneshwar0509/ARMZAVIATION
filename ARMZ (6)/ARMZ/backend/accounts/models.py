import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = (
        ("student", "Student"),
        ("employer", "Employer"),
        ("admin", "Admin"),
    )
    SUBSCRIPTION_CHANGE_TYPE = (
        ("upgrade", "Upgrade"),
        ("downgrade", "Downgrade"),
    )

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")
    phone = models.CharField(max_length=20, blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    hr_name = models.CharField(max_length=255, blank=True)
    company_details = models.TextField(blank=True)
    subscription = models.CharField(max_length=64, blank=True, default="free")
    is_verified = models.BooleanField(default=False)
    profile_complete = models.BooleanField(default=False)
    # Subscription downgrade handling
    pending_plan_id = models.IntegerField(null=True, blank=True, help_text="ID of plan to change to after current expires")
    pending_change_type = models.CharField(max_length=20, choices=SUBSCRIPTION_CHANGE_TYPE, null=True, blank=True, help_text="Type of pending subscription change")

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role"]),
            models.Index(fields=["subscription"]),
            models.Index(fields=["is_verified"]),
        ]

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    @property
    def normalized_email(self):
        return (self.email or "").strip().lower()

    @property
    def is_prime_admin(self):
        prime_admin_email = getattr(settings, "PRIME_ADMIN_EMAIL", "rkpk110011@gmail.com").strip().lower()
        return self.is_superuser or self.normalized_email == prime_admin_email

    @property
    def is_admin_user(self):
        return self.role == "admin" or self.is_prime_admin

    def save(self, *args, **kwargs):
        self.email = self.normalized_email
        if not self.username:
            self.username = self.email
        if not self.first_name and self.get_full_name():
            self.first_name = self.get_full_name()
        super().save(*args, **kwargs)


class OTPCode(models.Model):
    TYPE_CHOICES = (
        ("email", "Email"),
        ("phone", "Phone"),
        ("password_reset", "Password Reset"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otp_codes", null=True, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    otp = models.CharField(max_length=6)
    otp_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["email", "otp_type", "created_at"]),
            models.Index(fields=["phone", "otp_type", "created_at"]),
            models.Index(fields=["otp", "otp_type", "is_used"]),
        ]

    @classmethod
    def create_code(cls, email="", phone="", otp_type="email", user=None):
        otp = f"{secrets.randbelow(900000) + 100000}"
        return cls.objects.create(
            user=user,
            email=email,
            phone=phone,
            otp=otp,
            otp_type=otp_type,
            expires_at=timezone.now() + timedelta(minutes=10),
        )


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.CharField(max_length=128, unique=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["token", "is_used"]),
            models.Index(fields=["user", "created_at"]),
        ]

    @classmethod
    def create_for_user(cls, user):
        token = secrets.token_urlsafe(32)
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(minutes=30),
        )
