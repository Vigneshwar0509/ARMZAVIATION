from decimal import Decimal

from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from bookings.models import Application, SavedJob
from services.models import Internship, Job, Notification, Plan
from services.utils import build_plan_code


@override_settings(PRIME_ADMIN_EMAIL="rkpk110011@gmail.com")
class BookingSecurityTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="student@example.com",
            email="student@example.com",
            password="StudentPass123!",
            role="student",
            is_active=True,
        )
        self.other_student = User.objects.create_user(
            username="other@example.com",
            email="other@example.com",
            password="OtherPass123!",
            role="student",
            is_active=True,
        )
        self.employer = User.objects.create_user(
            username="employer@example.com",
            email="employer@example.com",
            password="EmployerPass123!",
            role="employer",
            is_active=True,
        )
        self.other_employer = User.objects.create_user(
            username="other-employer@example.com",
            email="other-employer@example.com",
            password="OtherEmployerPass123!",
            role="employer",
            is_active=True,
        )

        self.job = Job.objects.create(
            title="First Officer",
            company_name="ARMZ Aviation",
            location="Delhi",
            description="Aviation role",
            salary="100000",
            category="Flight Crew",
            type="Full-time",
            experience="2 years",
            posted_by_email=self.employer.email,
        )
        self.other_job = Job.objects.create(
            title="Cabin Crew",
            company_name="Other Aviation",
            location="Mumbai",
            description="Cabin role",
            salary="80000",
            category="Cabin Crew",
            type="Full-time",
            experience="1 year",
            posted_by_email=self.other_employer.email,
        )

        self.application = Application.objects.create(job=self.job, user=self.student)
        self.other_application = Application.objects.create(job=self.other_job, user=self.other_student)

    def test_saved_jobs_are_limited_to_owner(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f"/users/{self.student.id}/saved-jobs", {"jobId": self.job.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SavedJob.objects.filter(user=self.student, job=self.job).exists())

        response = self.client.get(f"/users/{self.other_student.id}/saved-jobs")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_employer_can_only_update_own_job_applications(self):
        self.client.force_authenticate(user=self.employer)
        response = self.client.patch(
            f"/applications/{self.application.id}/status",
            {"status": "shortlisted"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.application.refresh_from_db()
        self.assertEqual(self.application.status, "shortlisted")

        response = self.client.patch(
            f"/applications/{self.other_application.id}/status",
            {"status": "shortlisted"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_application_persists_and_admin_can_list(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f"/jobs/{self.other_job.id}/apply",
            {"userId": self.student.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Application.objects.filter(job=self.other_job, user=self.student).exists())

        admin_user = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="AdminPass123!",
            role="admin",
            is_active=True,
        )
        self.client.force_authenticate(user=admin_user)
        list_response = self.client.get("/applications")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        applications = list_response.data.get("data", [])
        self.assertTrue(
            any(
                app.get("job_id") == self.other_job.id and app.get("user_id") == self.student.id
                for app in applications
            )
        )

    def test_student_internship_application_persists_and_admin_can_list(self):
        internship = Internship.objects.create(
            title="Pilot Intern",
            company_name="ARMZ Aviation",
            location="Chennai",
            stipend="10000",
            department="Engineering",
            description="Internship role",
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f"/internships/{internship.id}/apply",
            {"userId": self.student.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Application.objects.filter(internship=internship, user=self.student).exists())

        admin_user = User.objects.create_user(
            username="admin2@example.com",
            email="admin2@example.com",
            password="AdminPass123!",
            role="admin",
            is_active=True,
        )
        self.client.force_authenticate(user=admin_user)
        list_response = self.client.get("/applications")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        applications = list_response.data.get("data", [])
        self.assertTrue(
            any(
                app.get("internship_id") == internship.id and app.get("user_id") == self.student.id
                for app in applications
            )
        )


@override_settings(
    PRIME_ADMIN_EMAIL="rkpk110011@gmail.com",
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
class ApplicationNotificationTests(APITestCase):
    def setUp(self):
        premium_plan = Plan.objects.create(
            name="Premium",
            price=Decimal("999.00"),
            period="month",
            description="",
            features=[],
            permissions=[],
            type="student",
            is_active=True,
        )
        self.student = User.objects.create_user(
            username="premium-student@example.com",
            email="premium-student@example.com",
            password="StudentPass123!",
            role="student",
            subscription=build_plan_code(premium_plan.name),
            is_active=True,
        )
        self.employer = User.objects.create_user(
            username="employer@example.com",
            email="employer@example.com",
            password="EmployerPass123!",
            role="employer",
            is_active=True,
        )
        self.job = Job.objects.create(
            title="Flight Operations Analyst",
            company_name="ARMZ Aviation",
            location="Delhi",
            description="Operations role",
            posted_by_email=self.employer.email,
        )
        self.application = Application.objects.create(job=self.job, user=self.student)

    def test_application_status_update_sends_notification_email(self):
        self.client.force_authenticate(user=self.employer)
        mail.outbox.clear()
        response = self.client.patch(
            f"/applications/{self.application.id}/status",
            {"status": "shortlisted"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertTrue(
            Notification.objects.filter(
                user=self.student,
                type="application",
                title__icontains="Application update",
            ).exists()
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.student.email])

