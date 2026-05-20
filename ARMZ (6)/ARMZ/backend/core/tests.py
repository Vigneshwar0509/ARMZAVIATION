from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from core.models import AdminActionLog, PaymentMethod, ReportExport
from tenants.models import Tenant


@override_settings(PRIME_ADMIN_EMAIL="rkpk110011@gmail.com")
class CoreAdminFeatureTests(APITestCase):
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

    def test_payment_methods_are_admin_only_and_persist(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get("/core/payment-methods")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/core/payment-methods",
            {
                "name": "Visa Corporate",
                "type": "credit_card",
                "lastDigits": "4242",
                "expiryDate": "12/28",
                "is_default": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        method_id = response.data["data"]["id"]
        self.assertTrue(PaymentMethod.objects.filter(id=method_id).exists())

        response = self.client.put(
            f"/core/payment-methods/{method_id}",
            {"name": "Visa Ops", "is_default": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(PaymentMethod.objects.get(id=method_id).name, "Visa Ops")

    def test_report_exports_are_recorded(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/core/report-exports",
            {
                "reportName": "Operations Report",
                "format": "pdf",
                "period": "Last 30 Days",
                "metadata": {"source": "admin-reports"},
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ReportExport.objects.count(), 1)
        export = ReportExport.objects.first()
        self.assertEqual(export.status, "completed")

        list_response = self.client.get("/core/report-exports")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data["data"]), 1)

    def test_admin_actions_are_recorded(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/core/admin-actions",
            {
                "actionType": "backup",
                "metadata": {"initiatedFrom": "admin-settings"},
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AdminActionLog.objects.count(), 1)
        action = AdminActionLog.objects.first()
        self.assertEqual(action.action_type, "backup")
        self.assertEqual(action.status, "completed")

    def test_ai_analyze_endpoint_requires_api_key(self):
        response = self.client.post(
            "/core/ai/analyze",
            {"query": "Identify bugs in my code"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_ai_analyze_endpoint_works_for_tenant(self):
        tenant = Tenant.objects.create(name="Tenant A", api_key="tenant-api-key", config={})
        response = self.client.post(
            "/core/ai/analyze",
            {"query": "Analyze security for this service"},
            format="json",
            HTTP_X_API_KEY=tenant.api_key,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("analysis", response.data["data"])
        self.assertEqual(response.data["success"], True)

    def test_ai_monitor_endpoint_reports_usage(self):
        tenant = Tenant.objects.create(name="Tenant B", api_key="tenant-monitor-key", config={})
        response = self.client.get(
            "/core/ai/monitor",
            HTTP_X_API_KEY=tenant.api_key,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.data["data"]["monitor"], dict))
