from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


@override_settings(PRIME_ADMIN_EMAIL="rkpk110011@gmail.com")
class AccountSecurityTests(APITestCase):
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
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="AdminPass123!",
            role="admin",
            is_active=True,
        )
        self.prime_admin = User.objects.create_user(
            username="rkpk110011@gmail.com",
            email="rkpk110011@gmail.com",
            password="PrimePass123!",
            role="admin",
            is_active=True,
        )

    def test_subscription_update_requires_authentication(self):
        response = self.client.post("/users/update-subscription", {"planId": "premium"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_can_only_update_own_subscription(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post("/users/update-subscription", {"planId": "premium"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.subscription, "premium")

        response = self.client.post(
            "/users/update-subscription",
            {"userId": self.other_student.id, "planId": "enterprise"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.other_student.refresh_from_db()
        self.assertEqual(self.other_student.subscription, "free")

    def test_prime_admin_controls_admin_management(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/admins")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.prime_admin)
        response = self.client.get("/admins")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(
            "/admins",
            {
                "name": "Ops Admin",
                "email": "ops@example.com",
                "password": "StrongPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="ops@example.com").exists())

    def test_admin_users_listing_returns_data(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/users")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("data", response.data)
        self.assertEqual(len(response.data["data"]), User.objects.count())

    def test_admin_creation_requires_explicit_strong_password(self):
        self.client.force_authenticate(user=self.prime_admin)
        response = self.client.post(
            "/admins",
            {
                "name": "Weak Admin",
                "email": "weak@example.com",
                "password": "short",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email="weak@example.com").exists())

    def test_login_sets_http_only_auth_cookies(self):
        response = self.client.post(
            "/auth/login",
            {"email": "student@example.com", "password": "StudentPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)
        self.assertEqual(response.json()["success"], True)

    def test_admin_cannot_login_via_public_endpoint(self):
        response = self.client.post(
            "/auth/login",
            {"email": "admin@example.com", "password": "AdminPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.json().get("message"), "Admin credentials must be used on the admin login page.")
        self.assertEqual(response.json().get("success"), False)
        self.assertIn("detail", response.json().get("errors", {}))

    def test_refresh_and_logout_work_with_cookie_auth(self):
        login_response = self.client.post(
            "/auth/login",
            {"email": "student@example.com", "password": "StudentPass123!"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        payload = login_response.json().get("data") or {}
        access_token = payload.get("token")
        self.assertIsNotNone(access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        refresh_response = self.client.post("/auth/refresh", {}, format="json")
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", refresh_response.cookies)

        logout_response = self.client.post("/auth/logout", {}, format="json")
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        self.client.credentials()
        profile_response = self.client.get("/auth/profile")
        self.assertEqual(profile_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_versioned_api_route_uses_standard_response_envelope(self):
        response = self.client.post(
            "/api/v1/auth/login",
            {"email": "student@example.com", "password": "StudentPass123!"},
            format="json",
        )
        payload = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(payload["success"], True)
        self.assertEqual(payload["data"]["user"]["email"], "student@example.com")
        self.assertIsNone(payload["errors"])
