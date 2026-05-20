from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from accounts.models import OTPCode, PasswordResetToken, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("id", "email", "username", "role", "subscription", "is_verified", "is_staff")
    list_filter = ("role", "is_verified", "is_staff")
    search_fields = ("email", "username", "first_name", "last_name")
    ordering = ("-date_joined",)
    fieldsets = UserAdmin.fieldsets + (
        (
            "ARMZ",
            {
                "fields": (
                    "role",
                    "phone",
                    "company_name",
                    "hr_name",
                    "company_details",
                    "subscription",
                    "is_verified",
                    "profile_complete",
                )
            },
        ),
    )


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "phone", "otp_type", "is_used", "expires_at", "created_at")
    list_filter = ("otp_type", "is_used")
    search_fields = ("email", "phone")


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "is_used", "expires_at", "created_at")
    list_filter = ("is_used",)
    search_fields = ("user__email", "token")
