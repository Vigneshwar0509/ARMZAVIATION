from types import SimpleNamespace

from django.test import TestCase
from rest_framework.exceptions import PermissionDenied

from config.throttling import IPRateThrottle
from accounts.permissions import IsAdminRole, IsStudentRole, IsEmployerRole, AuthenticatedOrRaise403


class RBACThrottleTests(TestCase):
    def make_req(self, user, meta=None):
        return SimpleNamespace(user=user, META=meta or {})

    def test_is_admin_role_allowed(self):
        user = SimpleNamespace(is_authenticated=True, is_admin_user=True, role="student")
        req = self.make_req(user)
        self.assertTrue(IsAdminRole().has_permission(req, None))

    def test_student_and_employer_roles(self):
        student = SimpleNamespace(is_authenticated=True, is_admin_user=False, role="student")
        employer = SimpleNamespace(is_authenticated=True, is_admin_user=False, role="employer")

        student_req = self.make_req(student)
        employer_req = self.make_req(employer)

        self.assertTrue(IsStudentRole().has_permission(student_req, None))
        self.assertFalse(IsEmployerRole().has_permission(student_req, None))

        self.assertTrue(IsEmployerRole().has_permission(employer_req, None))
        self.assertFalse(IsStudentRole().has_permission(employer_req, None))

    def test_authenticated_or_raise403(self):
        anon_user = SimpleNamespace(is_authenticated=False)
        req = self.make_req(anon_user)
        with self.assertRaises(PermissionDenied):
            AuthenticatedOrRaise403().has_permission(req, None)

    def test_ip_rate_throttle_cache_key(self):
        req = self.make_req(SimpleNamespace(is_authenticated=False), meta={"REMOTE_ADDR": "127.0.0.1"})
        throttle = IPRateThrottle()
        key = throttle.get_cache_key(req, None)
        # Ensure we get a non-empty cache key containing the IP
        self.assertIsNotNone(key)
        self.assertIn("127.0.0.1", key)
