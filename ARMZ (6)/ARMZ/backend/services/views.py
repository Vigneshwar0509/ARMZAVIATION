from datetime import date, datetime, timedelta
import time
import uuid

from django.db.models import Count, Q, ProtectedError
from django.db.models.functions import TruncDate, TruncMonth
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, parsers
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from config.rbac import require_roles

from accounts.models import User
from accounts.permissions import IsEmployerRole
from bookings.models import Application
from contact.models import Lead
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
from accounts.permissions import IsEmployerRole
from services.permissions import HasPlanPermission, IsAdminRole
from services.serializers import (
    AssessmentAttemptSerializer,
    AssessmentSerializer,
    CampaignSerializer,
    CollegeSerializer,
    CompanySerializer,
    CourseEnrollmentSerializer,
    CourseSerializer,
    EventSerializer,
    EventRegistrationSerializer,
    InternshipSerializer,
    InterviewSerializer,
    JobSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
    PlanSerializer,
    ServiceSerializer,
    StudentSerializer,
    WebinarSerializer,
    build_internship_stats,
    build_job_stats,
    build_plan_stats,
)
from services.selectors import (
    all_jobs_queryset,
    active_jobs_queryset,
    jobs_by_employer,
    all_companies,
    all_courses,
    all_events,
    interviews_by_user,
    active_services,
    active_plans,
    all_plans,
    all_students,
    all_campaigns,
    all_colleges,
    all_assessments,
    all_interviews,
    notifications_by_user,
    unread_notifications_count,
    event_registrations_by_user,
    webinar_registrations_by_user,
    course_enrollments_by_user,
    all_internships_queryset,
    all_webinars,
)
from accounts.selectors import users_queryset


def _resolve_requested_user_id(request, user_id):
    if user_id is None:
        return request.user.id

    try:
        requested_id = int(user_id)
    except (TypeError, ValueError):
        raise PermissionDenied("Invalid user id")

    if request.user.id != requested_id and not request.user.is_admin_user:
        raise PermissionDenied("You cannot access another user's data")

    return requested_id


def _ensure_interview_access(request, interview):
    if interview.user_id != request.user.id and not request.user.is_admin_user:
        raise PermissionDenied("You cannot access another user's interview")


def _shift_month(value: date, offset: int) -> date:
    month_index = value.year * 12 + (value.month - 1) + offset
    year = month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def _normalize_dashboard_range(raw_range):
    return raw_range if raw_range in {"7d", "30d", "90d", "12m"} else "7d"


def _build_job_trends(queryset, range_key: str):
    today = timezone.localdate()

    if range_key == "12m":
        start_month = _shift_month(today.replace(day=1), -11)
        aggregated = {
            item["bucket"].date(): item["count"]
            for item in queryset.filter(posted_at__date__gte=start_month).annotate(bucket=TruncMonth("posted_at")).values("bucket").annotate(count=Count("id"))
        }

        trends = []
        for offset in range(12):
            bucket_date = _shift_month(start_month, offset)
            trends.append({"month": bucket_date.strftime("%b %Y"), "count": aggregated.get(bucket_date, 0)})
        return trends

    day_count = 7 if range_key == "7d" else 30 if range_key == "30d" else 90
    start_day = today - timedelta(days=day_count - 1)
    aggregated = {
        item["bucket"]: item["count"]
        for item in queryset.filter(posted_at__date__range=(start_day, today)).annotate(bucket=TruncDate("posted_at")).values("bucket").annotate(count=Count("id"))
    }

    trends = []
    for offset in range(day_count):
        bucket_date = start_day + timedelta(days=offset)
        trends.append({"month": bucket_date.strftime("%d %b"), "count": aggregated.get(bucket_date, 0)})
    return trends


class ServicesListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = active_services()
        return Response({"data": ServiceSerializer(qs, many=True).data})


class CompaniesListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"data": CompanySerializer(all_companies(), many=True).data})


class IsAdminOrEmployerRole(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return IsAdminRole().has_permission(request, view) or IsEmployerRole().has_permission(request, view)


class JobsView(APIView):
    required_permission = 'job_posting'

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), HasPlanPermission()]

    def get(self, request):
        return Response({"data": JobSerializer(all_jobs_queryset(), many=True).data})

    def post(self, request):
        serializer = JobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(posted_by_email=getattr(request.user, "email", ""))
        return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)


class InternshipsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"data": InternshipSerializer(all_internships_queryset(), many=True).data})


class InternshipDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, internship_id):
        internship = get_object_or_404(Internship, pk=internship_id)
        return Response({"data": InternshipSerializer(internship).data})


class JobDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminRole()]

    def get(self, request, job_id):
        job = get_object_or_404(Job, pk=job_id)
        return Response({"data": JobSerializer(job).data})

    def put(self, request, job_id):
        job = get_object_or_404(Job, pk=job_id)
        serializer = JobSerializer(job, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data})

    def delete(self, request, job_id):
        get_object_or_404(Job, pk=job_id).delete()
        return Response({"data": {"success": True}})


class PlansView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Return all active plans (both student and employer)
        # Include all plan details including permissions so frontend can check access
        plans = active_plans()
        return Response({
            "data": PlanSerializer(plans, many=True).data,
            "debug": {
                "count": plans.count(),
                "types": list(plans.values_list("type", flat=True).distinct()),
            }
        })


@require_roles('admin')
class AdminPlansView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        plans = all_plans()
        return Response({"data": {"plans": PlanSerializer(plans, many=True).data, "stats": build_plan_stats(plans)}})

    def post(self, request):
        serializer = PlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)


@require_roles('admin')
class AdminPlanDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, plan_id):
        plan = get_object_or_404(Plan, pk=plan_id)
        serializer = PlanSerializer(plan, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Save the plan
        updated_plan = serializer.save()
        
        # If plan has permissions, ensure it's marked as active
        if updated_plan.permissions and not updated_plan.is_active:
            updated_plan.is_active = True
            updated_plan.save(update_fields=["is_active"])
        
        # Return updated plan with confirmation
        return Response({
            "data": PlanSerializer(updated_plan).data,
            "debug": {
                "permissions_saved": len(updated_plan.permissions),
                "is_active": updated_plan.is_active,
            }
        })

    def delete(self, request, plan_id):
        plan = get_object_or_404(Plan, pk=plan_id)
        try:
            plan.delete()
            return Response({"data": {"success": True}})
        except ProtectedError:
            return Response(
                {
                    "message": "This plan cannot be deleted because it is referenced by existing payment or subscription records. Please deactivate the plan instead.",
                },
                status=status.HTTP_409_CONFLICT,
            )


@require_roles('admin')
class AdminPlanStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, plan_id):
        plan = get_object_or_404(Plan, pk=plan_id)
        requested_value = request.data.get("isActive", plan.is_active)
        if isinstance(requested_value, str):
            plan.is_active = requested_value.strip().lower() == "true"
        else:
            plan.is_active = bool(requested_value)
        plan.save(update_fields=["is_active"])
        return Response({"data": PlanSerializer(plan).data})


@require_roles('admin')
class AdminPlanSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request, plan_id):
        plan = get_object_or_404(Plan, pk=plan_id)
        return Response({"data": {"id": plan.id, "synced": True, "syncedAt": datetime.utcnow().isoformat()}})


@require_roles('admin')
class AdminJobsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        jobs = all_jobs_queryset()
        return Response({"data": {"jobs": JobSerializer(jobs, many=True).data, "stats": build_job_stats(jobs)}})

    def post(self, request):
        serializer = JobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(posted_by_email=request.user.email)
        return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)


@require_roles('admin')
class AdminJobDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, job_id):
        job = get_object_or_404(Job, pk=job_id)
        serializer = JobSerializer(job, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data})

    def delete(self, request, job_id):
        get_object_or_404(Job, pk=job_id).delete()
        return Response({"data": {"success": True}})


@require_roles('admin')
class AdminInternshipsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        items = all_internships_queryset()
        return Response({"data": {"internships": InternshipSerializer(items, many=True).data, "stats": build_internship_stats(items)}})

    def post(self, request):
        serializer = InternshipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)


@require_roles('admin')
class AdminInternshipDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, internship_id):
        item = get_object_or_404(Internship, pk=internship_id)
        serializer = InternshipSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data})

    def delete(self, request, internship_id):
        get_object_or_404(Internship, pk=internship_id).delete()
        return Response({"data": {"success": True}})


@require_roles('admin')
class StudentsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        return Response({"data": StudentSerializer(all_students(), many=True).data})

    def post(self, request):
        serializer = StudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)


@require_roles('admin')
class StudentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, student_id):
        item = get_object_or_404(Student, pk=student_id)
        serializer = StudentSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data})

    def delete(self, request, student_id):
        get_object_or_404(Student, pk=student_id).delete()
        return Response({"data": {"success": True}})


@require_roles('admin')
class CampaignsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        return Response({"data": CampaignSerializer(all_campaigns(), many=True).data})

    def post(self, request):
        serializer = CampaignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)


@require_roles('admin')
class CampaignDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, campaign_id):
        item = get_object_or_404(Campaign, pk=campaign_id)
        serializer = CampaignSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data})

    def delete(self, request, campaign_id):
        get_object_or_404(Campaign, pk=campaign_id).delete()
        return Response({"data": {"success": True}})


@require_roles('admin')
class CollegesView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        return Response({"data": CollegeSerializer(all_colleges(), many=True).data})

    def post(self, request):
        serializer = CollegeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)


@require_roles('admin')
class CollegeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, college_id):
        item = get_object_or_404(College, pk=college_id)
        serializer = CollegeSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data})

    def delete(self, request, college_id):
        get_object_or_404(College, pk=college_id).delete()
        return Response({"data": {"success": True}})


class EventsView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminRole()]

    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get(self, request):
        return Response({"data": EventSerializer(all_events(), many=True).data})

    def post(self, request):
        serializer = EventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)


@require_roles('admin')
class EventDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def put(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        serializer = EventSerializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data})

    def delete(self, request, event_id):
        get_object_or_404(Event, pk=event_id).delete()
        return Response({"data": {"success": True}})


class EventRegisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_id):
        user_id = request.data.get("userId") or request.user.id
        if request.user.id != user_id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot register another user for an event")
        user = get_object_or_404(User, pk=user_id)
        event = get_object_or_404(Event, pk=event_id)
        registration, created = EventRegistration.objects.get_or_create(
            event=event,
            user=user,
            defaults={
                "registration_code": f"EVT-{event.id}-{user.id}-{uuid.uuid4().hex[:8].upper()}",
            },
        )
        return Response(
            {
                "data": {
                    "registered": True,
                    "created": created,
                    "registration": EventRegistrationSerializer(registration).data,
                }
            }
        )


class EventUnregisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_id):
        user_id = request.data.get("userId") or request.user.id
        if request.user.id != user_id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot unregister another user from an event")
        EventRegistration.objects.filter(event_id=event_id, user_id=user_id).delete()
        return Response({"data": {"unregistered": True}})


class EventRegistrationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.id != user_id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot view another user's event registrations")
        registrations = event_registrations_by_user(user_id)
        return Response(
            {
                "data": [
                    {
                        "id": item.id,
                        "eventId": item.event_id,
                        "registrationCode": item.registration_code,
                        "registeredAt": item.registered_at,
                    }
                    for item in registrations
                ]
            }
        )


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        range_key = _normalize_dashboard_range(request.query_params.get("range"))
        from config.cache_utils import cache_get, cache_set, get_dashboard_cache_versions

        global_version, user_version = get_dashboard_cache_versions(user.id)
        cache_key = f"dashboard:{user.id}:{range_key}:{global_version}:{user_version}"
        cached = cache_get(cache_key)
        if cached is not None:
            return Response({"data": cached})

        if user.role == "student":
            applications_qs = user.applications.select_related("job").order_by("-applied_at")
            jobs_qs = active_jobs_queryset()
            total_jobs = jobs_qs.count()
            total_applications = applications_qs.count()
            total_hires = applications_qs.filter(status="hired").count()
            active_users = user.saved_jobs.count()
            recent_user_activity = [
                {
                    "id": f"application-{item.id}",
                    "user": item.job.title,
                    "action": f"Application {item.get_status_display()}",
                    "time": item.applied_at.strftime("%d %b %Y"),
                    "timestamp": item.applied_at.isoformat(),
                    "source": item.job.company_name,
                }
                for item in applications_qs[:5]
            ]
            conversion_rate = round((total_hires / total_applications) * 100, 1) if total_applications else 0
            platform_score = min(100, round(min(total_applications, 10) * 8 + min(active_users, 10) * 4))
            new_leads = 0
            active_students = 1 if user.is_active else 0
        elif user.role == "employer":
            jobs_qs = jobs_by_employer(user.normalized_email)
            applications_qs = (
                jobs_qs
                .aggregate(total=Count("job_applications"), hired=Count("job_applications", filter=Q(job_applications__status="hired")))
            )
            total_jobs = jobs_qs.count()
            total_applications = applications_qs["total"] or 0
            total_hires = applications_qs["hired"] or 0
            active_users = Application.objects.filter(job__posted_by_email=user.normalized_email).values("user_id").distinct().count()
            recent_user_activity = [
                {
                    "id": f"job-{job.id}",
                    "user": job.title,
                    "action": "Job posted",
                    "time": job.posted_at.strftime("%d %b %Y"),
                    "timestamp": job.posted_at.isoformat(),
                    "source": job.company_name,
                }
                for job in jobs_qs[:5]
            ]
            conversion_rate = round((total_hires / total_applications) * 100, 1) if total_applications else 0
            platform_score = min(100, round(min(total_jobs, 20) * 4 + min(total_applications, 50) * 1.2))
            new_leads = 0
            active_students = active_users
        else:
            jobs_qs = all_jobs_queryset()
            total_jobs = jobs_qs.count()
            total_applications = Job.objects.aggregate(total=Count("job_applications"))["total"] or 0
            total_hires = 0
            active_users = users_queryset().filter(is_active=True).count()
            active_students = users_queryset().filter(role="student", is_active=True).count()
            total_leads = Lead.objects.count()
            converted_leads = Lead.objects.filter(status="converted").count()
            new_leads = Lead.objects.filter(created_at__gte=timezone.now() - timedelta(days=30)).count()
            recent_user_activity = [
                {
                    "id": f"user-{system_user.id}",
                    "user": system_user.get_full_name().strip() or system_user.email,
                    "action": "joined the platform",
                    "time": system_user.date_joined.strftime("%d %b %Y"),
                    "timestamp": system_user.date_joined.isoformat(),
                    "source": "Web",
                }
                for system_user in users_queryset()[:5]
            ]
            conversion_rate = round((converted_leads / total_leads) * 100, 1) if total_leads else 0
            platform_score = min(
                100,
                round(
                    min(active_users, 40) * 1.2
                    + min(total_jobs, 25) * 1.6
                    + min(total_applications, 25) * 1.2
                    + min(conversion_rate, 10) * 1.5
                ),
            )

        job_trends = _build_job_trends(jobs_qs, range_key)

        data = {
            "totalJobs": total_jobs,
            "totalApplications": total_applications,
            "totalHires": total_hires,
            "activeUsers": active_users,
            "activeStudents": active_students,
            "revenue": "0",
            "newLeads": new_leads,
            "conversionRate": conversion_rate,
            "platformScore": platform_score,
            "avgResponseTime": "24h",
            "offerRate": f"{conversion_rate}%",
            "jobTrends": job_trends,
            "userActivity": recent_user_activity,
        }
        try:
            cache_set(cache_key, data, timeout=120)
        except Exception:
            pass
        response = Response({"data": data})
        return response


class NotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = _resolve_requested_user_id(request, request.query_params.get("userId"))
        queryset = notifications_by_user(user_id)
        notifications = NotificationSerializer(queryset, many=True).data
        unread_count = len([n for n in notifications if not n.get("read")])
        response = Response({"data": {"notifications": notifications, "unreadCount": unread_count}})
        return response


class NotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, notification_id):
        item = get_object_or_404(Notification, pk=notification_id)
        if item.user_id != request.user.id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot update another user's notifications")
        item.read = True
        item.save(update_fields=["read"])
        return Response({"data": {"success": True}})


class NotificationsReadAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user_id = _resolve_requested_user_id(request, request.data.get("userId"))
        Notification.objects.filter(user_id=user_id).update(read=True)
        return Response({"data": {"success": True}})


class NotificationDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, notification_id):
        item = get_object_or_404(Notification, pk=notification_id)
        if item.user_id != request.user.id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot delete another user's notifications")
        item.delete()
        return Response({"data": {"success": True}})


class NotificationPreferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.id != user_id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot view another user's notification preferences")
        pref, _ = NotificationPreference.objects.get_or_create(user_id=user_id)
        return Response({"data": NotificationPreferenceSerializer(pref).data})

    def put(self, request, user_id):
        if request.user.id != user_id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot update another user's notification preferences")
        pref, _ = NotificationPreference.objects.get_or_create(user_id=user_id)
        serializer = NotificationPreferenceSerializer(pref, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data})


class WebinarsView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminRole()]

    def get(self, request):
        webinars = all_webinars()
        data = WebinarSerializer(webinars, many=True).data
        categories = sorted(list(set([x.get("category") for x in data if x.get("category")])))
        return Response({"data": {"webinars": data, "categories": categories}})

    def post(self, request):
        serializer = WebinarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)


@require_roles('admin')
class WebinarDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, webinar_id):
        webinar = get_object_or_404(Webinar, pk=webinar_id)
        serializer = WebinarSerializer(webinar, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data})

    def delete(self, request, webinar_id):
        get_object_or_404(Webinar, pk=webinar_id).delete()
        return Response({"data": {"success": True}})


class WebinarRegisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, webinar_id):
        user_id = request.data.get("userId") or request.user.id
        if request.user.id != user_id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot register another user for a webinar")
        user = get_object_or_404(User, pk=user_id)
        webinar = get_object_or_404(Webinar, pk=webinar_id)
        WebinarRegistration.objects.get_or_create(webinar=webinar, user=user)
        return Response({"data": {"registered": True}})


class WebinarUnregisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, webinar_id):
        user_id = request.data.get("userId") or request.user.id
        if request.user.id != user_id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot unregister another user from a webinar")
        WebinarRegistration.objects.filter(webinar_id=webinar_id, user_id=user_id).delete()
        return Response({"data": {"unregistered": True}})


class WebinarRegistrationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.id != user_id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot view another user's webinar registrations")
        regs = webinar_registrations_by_user(user_id)
        return Response({"data": [{"id": r.id, "webinarId": r.webinar_id} for r in regs]})


@require_roles('admin')
class WebinarRegistrationsByWebinarView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request, webinar_id):
        webinar = get_object_or_404(Webinar, pk=webinar_id)
        registrations = WebinarRegistration.objects.select_related("user").filter(webinar=webinar).order_by("-registered_at")
        return Response(
            {
                "data": [
                    {
                        "id": reg.id,
                        "webinarId": reg.webinar_id,
                        "userId": reg.user_id,
                        "userName": reg.user.get_full_name().strip() or reg.user.email,
                        "userEmail": reg.user.email,
                        "registeredAt": reg.registered_at,
                    }
                    for reg in registrations
                ]
            }
        )


class WebinarPreferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.id != user_id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot view another user's webinar preferences")
        pref, _ = WebinarPreference.objects.get_or_create(user_id=user_id)
        return Response({"data": pref.preferences})

    def put(self, request, user_id):
        if request.user.id != user_id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot update another user's webinar preferences")
        pref, _ = WebinarPreference.objects.get_or_create(user_id=user_id)
        pref.preferences = request.data
        pref.save(update_fields=["preferences"])
        return Response({"data": pref.preferences})


class CoursesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        courses = all_courses()
        return Response({"data": {"courses": CourseSerializer(courses, many=True).data, "stats": None}})


class AdminCoursesView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        courses = all_courses()
        stats = {
            "totalCourses": courses.count(),
            "publishedCourses": courses.count(),
            "totalEnrollments": CourseEnrollment.objects.count(),
        }
        return Response({"data": {"courses": CourseSerializer(courses, many=True).data, "stats": stats}})

    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)


class AdminCourseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        serializer = CourseSerializer(course, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data})

    def delete(self, request, course_id):
        get_object_or_404(Course, pk=course_id).delete()
        return Response({"data": {"success": True}})


class EnrolledCoursesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = _resolve_requested_user_id(request, request.query_params.get("userId"))
        enrollments = course_enrollments_by_user(user_id)
        payload = [
            {
                "id": item.course.id,
                "title": item.course.title,
                "description": item.course.description,
                "thumbnail": item.course.thumbnail,
                "progress": item.progress,
            }
            for item in enrollments
        ]
        return Response({"data": {"courses": payload, "stats": None}})


class CourseProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, course_id):
        progress = int(request.data.get("progress", 0))
        enrollment, _ = CourseEnrollment.objects.get_or_create(user=request.user, course_id=course_id)
        enrollment.progress = max(0, min(100, progress))
        enrollment.save(update_fields=["progress"])
        return Response({"data": {"success": True, "progress": enrollment.progress}})


class InterviewsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = _resolve_requested_user_id(request, request.query_params.get("userId"))
        items = interviews_by_user(user_id)
        return Response({"data": InterviewSerializer(items, many=True).data})


class InterviewRescheduleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, interview_id):
        item = get_object_or_404(Interview, pk=interview_id)
        _ensure_interview_access(request, item)
        new_date = request.data.get("newDate")
        new_time = request.data.get("newTime")
        if new_date:
            item.scheduled_date = datetime.strptime(new_date, "%Y-%m-%d").date()
        if new_time:
            item.scheduled_time = datetime.strptime(new_time, "%H:%M").time()
        item.save()
        return Response({"data": InterviewSerializer(item).data})


class InterviewCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, interview_id):
        item = get_object_or_404(Interview, pk=interview_id)
        _ensure_interview_access(request, item)
        item.delete()
        return Response({"data": {"success": True}})


class AssessmentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"data": AssessmentSerializer(all_assessments(), many=True).data})


class AssessmentStartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, assessment_id):
        attempt = (
            AssessmentAttempt.objects.filter(assessment_id=assessment_id, user=request.user, submitted_at__isnull=True)
            .order_by("-started_at")
            .first()
        )
        if not attempt:
            attempt = AssessmentAttempt.objects.create(assessment_id=assessment_id, user=request.user)
        return Response({"data": AssessmentAttemptSerializer(attempt).data})


class AssessmentSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, assessment_id):
        answers = request.data.get("answers", {})
        attempt = (
            AssessmentAttempt.objects.filter(assessment_id=assessment_id, user=request.user)
            .order_by("-started_at")
            .first()
        )
        if not attempt:
            attempt = AssessmentAttempt.objects.create(assessment_id=assessment_id, user=request.user)
        attempt.answers = answers
        attempt.score = min(100, len(answers) * 10)
        attempt.submitted_at = datetime.utcnow()
        attempt.save()
        return Response({"data": {"score": attempt.score}})


class AssessmentResultView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, assessment_id):
        attempt = (
            AssessmentAttempt.objects.filter(assessment_id=assessment_id, user=request.user)
            .order_by("-submitted_at", "-started_at")
            .first()
        )
        if not attempt:
            return Response({"data": {"score": 0, "answers": {}, "startedAt": None, "submittedAt": None}})
        return Response(
            {
                "data": {
                    "score": attempt.score,
                    "answers": attempt.answers,
                    "startedAt": attempt.started_at,
                    "submittedAt": attempt.submitted_at,
                }
            }
        )


class SubscriptionStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.id != user_id and not request.user.is_admin_user:
            raise PermissionDenied("You cannot view another user's subscription")
        user = get_object_or_404(User, pk=user_id)
        return Response({"data": {"userId": user.id, "subscription": user.subscription}})


