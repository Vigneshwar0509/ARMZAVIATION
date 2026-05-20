from django.contrib import admin
from django.utils.html import format_html

from services.models import (
    Assessment,
    AssessmentAttempt,
    Campaign,
    College,
    Company,
    Course,
    CourseEnrollment,
    Event,
    Internship,
    Interview,
    Job,
    Notification,
    NotificationPreference,
    Plan,
    Service,
    Student,
    Webinar,
    WebinarPreference,
    WebinarRegistration,
)

admin.site.register(Service)
admin.site.register(Company)
admin.site.register(Job)
admin.site.register(Internship)
admin.site.register(Student)
admin.site.register(Campaign)
admin.site.register(College)
admin.site.register(Event)
admin.site.register(Notification)
admin.site.register(NotificationPreference)
admin.site.register(Webinar)
admin.site.register(WebinarRegistration)
admin.site.register(WebinarPreference)
admin.site.register(Course)
admin.site.register(CourseEnrollment)
admin.site.register(Interview)
admin.site.register(Assessment)
admin.site.register(AssessmentAttempt)


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "type",
        "get_price_display",
        "get_final_price_display",
        "is_active",
        "created_at",
    )
    list_filter = ("type", "is_active", "created_at")
    search_fields = ("name", "description")
    readonly_fields = (
        "razorpay_fee",
        "gst_amount",
        "final_price",
        "pricing_summary",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        ("Basic Information", {
            "fields": ("name", "type", "description", "tier", "period", "is_active")
        }),
        ("Pricing Details", {
            "fields": (
                "price",
                "razorpay_fee_percentage",
                "gst_percentage",
                "pricing_summary",
            ),
            "description": "Set base price. Fees and GST are calculated automatically."
        }),
        ("Calculated Pricing (Read-Only)", {
            "fields": ("razorpay_fee", "gst_amount", "final_price"),
            "classes": ("collapse",)
        }),
        ("Features & Permissions", {
            "fields": ("features", "permissions", "tabs"),
            "classes": ("collapse",)
        }),
        ("Razorpay Configuration", {
            "fields": ("razorpay_plan_id",),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    def get_price_display(self, obj):
        """Display base price in list view"""
        return f"₹{obj.price:,.2f}"
    get_price_display.short_description = "Base Price"

    def get_final_price_display(self, obj):
        """Display final price with breakdown in list view"""
        return format_html(
            '<span title="Base: ₹{:.2f} + Fee: ₹{:.2f} + GST: ₹{:.2f}">₹{:,.2f}</span>',
            obj.price,
            obj.razorpay_fee,
            obj.gst_amount,
            obj.final_price,
        )
    get_final_price_display.short_description = "Final Price (Hover for breakdown)"

    def pricing_summary(self, obj):
        """Display pricing summary as HTML"""
        return format_html(
            """
            <div style="font-family: monospace; background: #f5f5f5; padding: 12px; border-radius: 4px; width: fit-content;">
                <div>Base Amount: <strong>₹{:.2f}</strong></div>
                <div>Razorpay Fee ({:.2f}%): <strong>₹{:.2f}</strong></div>
                <div>GST ({:.2f}%): <strong>₹{:.2f}</strong></div>
                <hr style="margin: 8px 0;">
                <div>Final Amount: <strong style="color: green; font-size: 16px;">₹{:.2f}</strong></div>
            </div>
            """,
            obj.price,
            obj.razorpay_fee_percentage,
            obj.razorpay_fee,
            obj.gst_percentage,
            obj.gst_amount,
            obj.final_price,
        )
    pricing_summary.short_description = "Pricing Breakdown"
