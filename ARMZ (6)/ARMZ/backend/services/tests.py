from decimal import Decimal

from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from contact.models import Lead
from payments.models import PaymentOrder
from services.models import (
    Company,
    Course,
    CourseEnrollment,
    Event,
    EventRegistration,
    Interview,
    Job,
    Notification,
    NotificationPreference,
    Plan,
    Webinar,
    WebinarRegistration,
)
from services.selectors import (
    all_events,
    all_interviews,
    course_enrollments_by_user,
    event_registrations_by_user,
    interviews_by_user,
    unread_notifications_count,
    webinar_registrations_by_user,
)
from services.utils import build_plan_code


@override_settings(PRIME_ADMIN_EMAIL="rkpk110011@gmail.com")
class ServiceSecurityTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="student@example.com",
            email="student@example.com",
            password="StudentPass123!",
            role="student",
            is_active=True,
        )
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="AdminPass123!",
            role="admin",
            is_active=True,
        )
        self.other_user = User.objects.create_user(
            username="other@example.com",
            email="other@example.com",
            password="OtherPass123!",
            role="student",
            is_active=True,
        )
        self.company = Company.objects.create(name="ARMZ Aviation")
        self.job = Job.objects.create(
            title="Cabin Crew",
            company=self.company,
            company_name="ARMZ Aviation",
            location="Mumbai",
            description="Assist passengers",
        )
        self.event = Event.objects.create(title="Hiring Drive", type="Event", location="Delhi")
        self.plan = Plan.objects.create(
            name="Premium",
            price=Decimal("999.00"),
            period="month",
            type="student",
        )
        self.course = Course.objects.create(title="Aviation Fundamentals", description="Basics")

    def test_job_and_event_mutations_require_admin_role(self):
        self.client.force_authenticate(user=self.student)

        job_response = self.client.post(
            "/jobs",
            {
                "title": "Pilot",
                "company_name": "ARMZ Aviation",
                "location": "Bengaluru",
                "description": "Fly aircraft",
            },
            format="json",
        )
        self.assertEqual(job_response.status_code, status.HTTP_403_FORBIDDEN)

        event_response = self.client.post(
            "/events",
            {"title": "Open House", "type": "Event", "location": "Pune"},
            format="json",
        )
        self.assertEqual(event_response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        job_response = self.client.post(
            "/jobs",
            {
                "title": "Pilot",
                "company_name": "ARMZ Aviation",
                "location": "Bengaluru",
                "description": "Fly aircraft",
            },
            format="json",
        )
        self.assertEqual(job_response.status_code, status.HTTP_201_CREATED)

        event_response = self.client.post(
            "/events",
            {"title": "Open House", "type": "Event", "location": "Pune"},
            format="json",
        )
        self.assertEqual(event_response.status_code, status.HTTP_201_CREATED)

    def test_leads_are_persisted_and_admin_status_update_is_real(self):
        response = self.client.post(
            "/leads",
            {
                "name": "Lead User",
                "email": "lead@example.com",
                "phone": "9999999999",
                "interest": "Premium Plan",
                "source": "enquiry",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        lead_id = response.data["data"]["id"]
        self.assertTrue(Lead.objects.filter(id=lead_id).exists())

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f"/leads/{lead_id}/status", {"status": "qualified"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["status"], "qualified")
        self.assertEqual(Lead.objects.get(id=lead_id).status, "qualified")

    def test_event_registration_access_is_scoped_to_current_user(self):
        EventRegistration.objects.create(
            event=self.event,
            user=self.other_user,
            registration_code="EVT-TEST-1234",
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.get(f"/events/registrations/{self.other_user.id}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"/events/registrations/{self.other_user.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)

    def test_admin_plan_delete_returns_conflict_when_plan_has_payments(self):
        self.client.force_authenticate(user=self.admin)
        PaymentOrder.objects.create(
            user=self.other_user,
            plan=self.plan,
            amount=Decimal("999.00"),
            currency="INR",
            status="created",
            razorpay_order_id="order-plan-delete-001",
            idempotency_key="idempotency-delete-001",
            created_by=self.admin,
        )

        response = self.client.delete(f"/api/admin/plans/{self.plan.id}")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("message", response.data)
        self.assertTrue(Plan.objects.filter(id=self.plan.id).exists())

    def test_dashboard_stats_use_live_data(self):
        Lead.objects.create(
            name="Qualified Lead",
            email="qualified@example.com",
            phone="8888888888",
            interest="Premium",
            source="enquiry",
            status="converted",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/dashboard/stats")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data["data"]
        self.assertGreaterEqual(payload["totalJobs"], 1)
        self.assertGreaterEqual(payload["newLeads"], 1)
        self.assertGreaterEqual(payload["conversionRate"], 100)
        self.assertTrue(isinstance(payload["jobTrends"], list))
        self.assertTrue(isinstance(payload["userActivity"], list))

    def test_selector_helpers_use_real_timestamp_fields(self):
        webinar = Webinar.objects.create(title="Aviation Webinar", description="Intro")
        EventRegistration.objects.create(
            event=self.event,
            user=self.other_user,
            registration_code="EVT-TEST-1234",
        )
        WebinarRegistration.objects.create(
            webinar=webinar,
            user=self.other_user,
        )
        CourseEnrollment.objects.create(user=self.other_user, course=self.course, progress=65)
        Interview.objects.create(user=self.other_user, title="Cabin Crew Screening", status="scheduled")
        Notification.objects.create(user=self.other_user, title="Unread", description="Hidden", read=False)

        self.assertEqual(len(list(all_events())), 1)
        self.assertEqual(len(list(event_registrations_by_user(self.other_user.id))), 1)
        self.assertEqual(len(list(webinar_registrations_by_user(self.other_user.id))), 1)
        self.assertEqual(len(list(course_enrollments_by_user(self.other_user.id))), 1)
        self.assertEqual(len(list(all_interviews())), 1)
        self.assertEqual(len(list(interviews_by_user(self.other_user.id))), 1)
        self.assertEqual(
            unread_notifications_count(self.other_user.id),
            Notification.objects.filter(user=self.other_user, read=False).count(),
        )

    def test_public_events_ignore_invalid_bearer_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer definitely-not-a-valid-token")
        response = self.client.get("/events")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("data", response.data)

    def test_notifications_and_courses_are_scoped_to_current_user(self):
        Notification.objects.create(user=self.other_user, title="Private", description="Hidden")
        CourseEnrollment.objects.create(user=self.other_user, course=self.course, progress=65)

        self.client.force_authenticate(user=self.student)

        notifications_response = self.client.get(f"/notifications?userId={self.other_user.id}")
        self.assertEqual(notifications_response.status_code, status.HTTP_403_FORBIDDEN)

        courses_response = self.client.get(f"/courses/enrolled?userId={self.other_user.id}")
        self.assertEqual(courses_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_notification_bulk_update_is_scoped_to_current_user(self):
        notification = Notification.objects.create(user=self.other_user, title="Private", description="Hidden", read=False)

        self.client.force_authenticate(user=self.student)
        response = self.client.patch("/notifications/read-all", {"userId": self.other_user.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        notification.refresh_from_db()
        self.assertFalse(notification.read)

    def test_interview_access_is_scoped_to_owner(self):
        interview = Interview.objects.create(
            user=self.other_user,
            title="Cabin Crew Screening",
            status="scheduled",
        )

        self.client.force_authenticate(user=self.student)

        list_response = self.client.get(f"/interviews?userId={self.other_user.id}")
        self.assertEqual(list_response.status_code, status.HTTP_403_FORBIDDEN)

        update_response = self.client.patch(
            f"/interviews/{interview.id}/reschedule",
            {"newDate": "2026-05-01", "newTime": "10:30"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)

        delete_response = self.client.delete(f"/interviews/{interview.id}")
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PlanNotificationTests(APITestCase):
    def setUp(self):
        self.prime_plan = Plan.objects.create(
            name="Prime",
            price=Decimal("499.00"),
            period="month",
            description="",
            features=[],
            permissions=[],
            type="student",
            is_active=True,
        )
        self.premium_plan = Plan.objects.create(
            name="Premium",
            price=Decimal("999.00"),
            period="month",
            description="",
            features=[],
            permissions=[],
            type="student",
            is_active=True,
        )
        self.placement_plan = Plan.objects.create(
            name="Placement",
            price=Decimal("1499.00"),
            period="month",
            description="",
            features=[],
            permissions=[],
            type="student",
            is_active=True,
        )

        self.job_user = User.objects.create_user(
            username="job@example.com",
            email="job@example.com",
            password="StudentPass123!",
            role="student",
            subscription=build_plan_code(self.prime_plan.name),
            is_active=True,
        )
        self.premium_user = User.objects.create_user(
            username="premium@example.com",
            email="premium@example.com",
            password="StudentPass123!",
            role="student",
            subscription=build_plan_code(self.premium_plan.name),
            is_active=True,
        )
        self.placement_user = User.objects.create_user(
            username="placement@example.com",
            email="placement@example.com",
            password="StudentPass123!",
            role="student",
            subscription=build_plan_code(self.placement_plan.name),
            is_active=True,
        )
        self.opted_out_user = User.objects.create_user(
            username="optout@example.com",
            email="optout@example.com",
            password="StudentPass123!",
            role="student",
            subscription=build_plan_code(self.prime_plan.name),
            is_active=True,
        )
        NotificationPreference.objects.create(
            user=self.opted_out_user,
            email_notifications=False,
            job_alerts=True,
            interview_reminders=True,
            application_updates=True,
            course_updates=True,
            weekly_digest=True,
            immediate_alerts=True,
        )

    def test_job_creation_emails_allowed_tiers_only(self):
        Job.objects.create(
            title="Graduate Engineer",
            company_name="Acme",
            location="Remote",
            description="A new graduate role.",
            status="Active",
        )

        self.assertEqual(Notification.objects.filter(type="job").count(), 4)
        self.assertEqual(len(mail.outbox), 3)

        recipients = {message.to[0] for message in mail.outbox}
        self.assertSetEqual(
            recipients,
            {"job@example.com", "premium@example.com", "placement@example.com"},
        )
