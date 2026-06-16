from django.db.models import Count, Sum
from rest_framework import serializers

from services.models import (
    Assessment,
    AssessmentAttempt,
    Campaign,
    College,
    Company,
    Course,
    CourseEnrollment,
    Event,
    EventRegistration,
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
from services.utils import build_plan_code, sanitize_text


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = "__all__"


class PlanSerializer(serializers.ModelSerializer):
    code = serializers.SerializerMethodField()
    razorpay_plan_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    pricing_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = [
            "id",
            "name",
            "price",
            "razorpay_fee",
            "razorpay_fee_percentage",
            "gst_amount",
            "gst_percentage",
            "final_price",
            "pricing_breakdown",
            "tier",
            "period",
            "description",
            "features",
            "permissions",
            "tabs",
            "razorpay_plan_id",
            "type",
            "is_active",
            "code",
            "created_at",
            "updated_at"
        ]
        extra_kwargs = {
            'razorpay_fee': {'required': False, 'allow_null': True},
            'gst_amount': {'required': False, 'allow_null': True},
            'final_price': {'required': False, 'allow_null': True},
            'tier': {'required': False, 'allow_null': True},
            'tabs': {'required': False, 'allow_null': True},
            'razorpay_fee_percentage': {'required': False},
            'gst_percentage': {'required': False},
        }

    def get_code(self, obj):
        return build_plan_code(obj.name)

    def get_pricing_breakdown(self, obj):
        """Return formatted pricing breakdown"""
        # Ensure pricing is calculated if fields are None
        if obj.razorpay_fee is None or obj.gst_amount is None or obj.final_price is None:
            obj.calculate_pricing()
            
        return {
            "base_price": float(obj.price),
            "razorpay_fee": float(obj.razorpay_fee or 0),
            "razorpay_fee_percentage": float(obj.razorpay_fee_percentage),
            "gst_amount": float(obj.gst_amount or 0),
            "gst_percentage": float(obj.gst_percentage),
            "final_price": float(obj.final_price or obj.price),
        }

    def to_internal_value(self, data):
        if hasattr(data, "copy"):
            data = data.copy()

        if data.get("razorpay_plan_id") is None:
            data["razorpay_plan_id"] = ""

        if "isActive" in data and "is_active" not in data:
            data["is_active"] = data.get("isActive")

        if "price" in data and isinstance(data["price"], (int, float)):
            data["price"] = str(data["price"])

        if "razorpay_fee_percentage" not in data or data.get("razorpay_fee_percentage") in (None, ""):
            data["razorpay_fee_percentage"] = str(self.Meta.model._meta.get_field("razorpay_fee_percentage").default)

        if "gst_percentage" not in data or data.get("gst_percentage") in (None, ""):
            data["gst_percentage"] = str(self.Meta.model._meta.get_field("gst_percentage").default)

        if "type" not in data or data.get("type") in (None, ""):
            data["type"] = self.Meta.model._meta.get_field("type").default

        return super().to_internal_value(data)


class JobSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "company_name",
            "location",
            "description",
            "salary",
            "experience",
            "category",
            "type",
            "posted_at",
            "posted_by_email",
            "logo",
            "skills",
            "requirements",
            "responsibilities",
            "status",
            "applications",
            "views",
        ]

    def validate(self, attrs):
        for key in ["title", "company_name", "location", "description", "salary", "category", "type", "experience"]:
            if key in attrs and isinstance(attrs[key], str):
                attrs[key] = sanitize_text(attrs[key])

        if "skills" in attrs:
            skills = attrs["skills"]
            if isinstance(skills, str):
                skills = [skills]
            if isinstance(skills, list):
                attrs["skills"] = [sanitize_text(item) for item in skills if isinstance(item, str) and item.strip()]
            else:
                attrs["skills"] = []

        return attrs


class InternshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Internship
        fields = "__all__"


class StudentSerializer(serializers.ModelSerializer):
    lastLogin = serializers.DateTimeField(source="user.last_login", read_only=True)
    userId = serializers.IntegerField(source="user.id", read_only=True)
    userName = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = "__all__"

    def get_userName(self, obj):
        if obj.user:
            full_name = obj.user.get_full_name().strip()
            return full_name or obj.user.email or obj.email
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = "__all__"


class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = "__all__"


class EventSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True, use_url=True)
    class Meta:
        model = Event
        fields = "__all__"


class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        fields = "__all__"


class NotificationSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "title",
            "description",
            "type",
            "icon",
            "read",
            "action_url",
            "priority",
            "timestamp",
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        exclude = []


class WebinarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Webinar
        fields = "__all__"


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = "__all__"


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = ["id", "user", "course", "progress", "enrolled_at"]


class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = "__all__"


class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = "__all__"


class AssessmentAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentAttempt
        fields = "__all__"


def build_plan_stats(plans_qs):
    plans = list(plans_qs)
    total_revenue = sum([0 for _ in plans])
    return {
        "totalPlans": len(plans),
        "activePlans": len([p for p in plans if p.is_active]),
        "totalSubscribers": 0,
        "totalRevenue": total_revenue,
        "totalRevenueFormatted": f"INR {total_revenue}",
        "averageRevenuePerUser": 0,
        "averageRevenuePerUserFormatted": "INR 0",
        "mostPopularPlan": plans[0].name if plans else "N/A",
        "planDistribution": [{"name": p.name, "value": 0, "color": "#3b82f6"} for p in plans],
    }


def build_job_stats(jobs_qs):
    total = jobs_qs.count()
    active = jobs_qs.filter(status="Active").count()
    applications = jobs_qs.aggregate(v=Sum("applications"))["v"] or 0
    views = jobs_qs.aggregate(v=Sum("views"))["v"] or 0
    by_category = jobs_qs.values("category").annotate(value=Count("id"))
    colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    jobs_by_category = []
    for idx, row in enumerate(by_category):
        jobs_by_category.append(
            {
                "name": row["category"] or "General",
                "value": row["value"],
                "color": colors[idx % len(colors)],
            }
        )

    return {
        "totalJobs": total,
        "activeJobs": active,
        "totalApplications": applications,
        "averageApplicationsPerJob": applications / total if total else 0,
        "totalViews": views,
        "jobsByCategory": jobs_by_category,
        "applicationsByStatus": [
            {"status": "Active", "count": active},
            {"status": "Closed", "count": total - active},
        ],
    }


def build_internship_stats(items_qs):
    total = items_qs.count()
    active = items_qs.filter(status="Active").count()
    applications = items_qs.aggregate(v=Sum("applications"))["v"] or 0
    views = items_qs.aggregate(v=Sum("views"))["v"] or 0
    by_department = items_qs.values("department").annotate(value=Count("id"))
    colors = ["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
    internships_by_department = []
    for idx, row in enumerate(by_department):
        internships_by_department.append(
            {
                "name": row["department"] or "General",
                "value": row["value"],
                "color": colors[idx % len(colors)],
            }
        )

    return {
        "totalInternships": total,
        "activeInternships": active,
        "totalApplications": applications,
        "averageApplicationsPerInternship": applications / total if total else 0,
        "totalViews": views,
        "internshipsByDepartment": internships_by_department,
    }
