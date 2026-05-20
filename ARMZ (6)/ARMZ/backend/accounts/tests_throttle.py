from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


@override_settings(PRIME_ADMIN_EMAIL="rkpk110011@gmail.com")
class ThrottleTests(APITestCase):
    def setUp(self):
        # Create a user to attempt login
        from accounts.models import User

        self.user = User.objects.create_user(
            username="throttle@example.com",
            email="throttle@example.com",
            password="ThrotTle123!",
            role="student",
            is_active=True,
        )

    def test_login_rate_limit_triggers(self):
        # Exceed auth_login rate (configured as 5/minute)
        url = "/auth/login"
        payload = {"email": "throttle@example.com", "password": "wrongpass"}
        last_status = None
        for i in range(6):
            response = self.client.post(url, payload, format="json")
            last_status = response.status_code

        # The sixth attempt should be throttled (429 Too Many Requests)
        self.assertIn(last_status, (status.HTTP_429_TOO_MANY_REQUESTS, status.HTTP_403_FORBIDDEN))

    def test_otp_verify_has_separate_throttle_from_send(self):
        send_url = "/auth/send-otp"
        verify_url = "/auth/verify-otp"

        send_response = self.client.post(send_url, {"type": "email", "email": "throttle@example.com"}, format="json")
        self.assertEqual(send_response.status_code, status.HTTP_200_OK)

        # Verify action should not be blocked by the send OTP rate limit.
        for attempt in range(3):
            verify_response = self.client.post(
                verify_url,
                {"type": "email", "email": "throttle@example.com", "otp": "000000"},
                format="json",
            )
            self.assertNotEqual(verify_response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        # A fourth verify attempt should be throttled by the verify-specific rate limit.
        fourth_response = self.client.post(
            verify_url,
            {"type": "email", "email": "throttle@example.com", "otp": "000000"},
            format="json",
        )
        self.assertEqual(fourth_response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
