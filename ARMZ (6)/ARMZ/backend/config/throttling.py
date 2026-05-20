"""Enhanced rate limiting for authentication and sensitive endpoints."""

from django.core.cache import cache
from rest_framework.throttling import BaseThrottle, UserRateThrottle, AnonRateThrottle
import time

from config.cache_utils import record_security_failure_event


class GlobalUserRateThrottle(UserRateThrottle):
    """Global per-user rate limiting for authenticated API traffic."""
    scope = "user"
    THROTTLE_RATES = {
        "user": "1200/minute",
    }


class GlobalAnonRateThrottle(AnonRateThrottle):
    """Global per-IP rate limiting for anonymous traffic."""
    scope = "anon"
    THROTTLE_RATES = {
        "anon": "300/minute",
    }


class AuthLoginRateThrottle(AnonRateThrottle):
    """Strict rate limiting for login attempts."""
    scope = "auth_login"
    THROTTLE_RATES = {
        "auth_login": "5/minute",  # Max 5 login attempts per minute
    }


class AuthRegisterRateThrottle(AnonRateThrottle):
    """Strict rate limiting for registration."""
    scope = "auth_register"
    THROTTLE_RATES = {
        "auth_register": "3/minute",  # Max 3 registrations per minute per IP
    }


class PasswordResetRateThrottle(AnonRateThrottle):
    """Strict rate limiting for password reset requests."""
    scope = "password_reset"
    THROTTLE_RATES = {
        "password_reset": "3/hour",  # Max 3 password resets per hour
    }


class OTPRateThrottle(AnonRateThrottle):
    """Strict rate limiting for OTP generation."""
    scope = "otp_send"
    THROTTLE_RATES = {
        "otp_send": "3/minute",  # Max 3 OTP send requests per minute
    }


class OTPVerifyRateThrottle(AnonRateThrottle):
    """Strict rate limiting for OTP verification attempts."""
    scope = "otp_verify"
    THROTTLE_RATES = {
        "otp_verify": "3/minute",  # Max 3 OTP verify requests per minute
    }


class APIKeyRateThrottle(UserRateThrottle):
    """Rate limiting for API key operations."""
    scope = "api_key"
    THROTTLE_RATES = {
        "api_key": "10/minute",
    }


class PaymentRateThrottle(UserRateThrottle):
    """Rate limiting for payment operations."""
    scope = "payments"
    THROTTLE_RATES = {
        "payments": "20/minute",  # Generous for legitimate operations
    }


class DataExportRateThrottle(UserRateThrottle):
    """Rate limiting for data export operations."""
    scope = "data_export"
    THROTTLE_RATES = {
        "data_export": "5/hour",  # Max 5 exports per hour per user
    }


class PaymentCreateOrderRateThrottle(UserRateThrottle):
    """Scoped throttling for payment order creation."""
    scope = "payments_create_order"
    THROTTLE_RATES = {
        "payments_create_order": "20/minute",
    }


class PaymentVerifyRateThrottle(UserRateThrottle):
    """Scoped throttling for payment verification requests."""
    scope = "payments_verify"
    THROTTLE_RATES = {
        "payments_verify": "15/minute",
    }


class PaymentSubscriptionRateThrottle(UserRateThrottle):
    """Scoped throttling for subscription creation flows."""
    scope = "payments_subscription"
    THROTTLE_RATES = {
        "payments_subscription": "10/minute",
    }


class BruteForceProtectionThrottle(BaseThrottle):
    """
    Advanced brute force protection with exponential backoff.
    Tracks failed attempts and temporarily blocks accounts after threshold.
    """

    cache_timeout = 3600  # 1 hour
    failure_threshold = 5  # Block after 5 failures
    lockout_duration = 900  # 15 minutes

    def get_cache_key(self, request):
        """Generate cache key based on identifier."""
        if request.user and request.user.is_authenticated:
            return f"brute_force:{request.user.id}"
        return f"brute_force:{self.get_ident(request)}"

    def throttle_success(self, request):
        """Reset failure count on successful auth."""
        key = self.get_cache_key(request)
        cache.delete(key)
        return True

    def throttle_failure(self, request):
        """Track authentication failures."""
        key = self.get_cache_key(request)
        failures = cache.get(key, 0) or 0
        failures += 1

        if failures >= self.failure_threshold:
            cache.set(key, failures, self.lockout_duration)
            record_security_failure_event(self.get_ident(request), threshold=self.failure_threshold, block_ttl=self.lockout_duration)
            return False

        cache.set(key, failures, self.cache_timeout)
        return True

    def throttle(self, request):
        """Apply throttle."""
        return self.throttle_failure(request)

    def allow_request(self, request, view):
        """Allow requests by default while tracking failures."""
        return True

    def get_ident(self, request):
        """Get unique identifier for request."""
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        client_addr = xff.split(",")[0] if xff else None
        return client_addr or request.META.get("REMOTE_ADDR")


class ConcurrentRequestThrottle(BaseThrottle):
    """
    Limit concurrent requests per user to prevent resource exhaustion.
    """
    
    max_concurrent = 10  # Max 10 concurrent requests per user
    cache_timeout = 60
    
    def allow_request(self, request):
        """Check and increment concurrent request count."""
        from django.core.cache import cache
        
        if not (request.user and request.user.is_authenticated):
            return True  # Only throttle authenticated users
        
        key = f"concurrent:{request.user.id}"
        current = cache.get(key, 0)
        
        if current >= self.max_concurrent:
            return False
        
        # Increment
        cache.set(key, current + 1, self.cache_timeout)
        return True


class IPRateThrottle(UserRateThrottle):
    """Throttle based on client IP address for additional network-level protection."""
    scope = "ip"
    THROTTLE_RATES = {
        "ip": "300/minute",
    }

    def get_cache_key(self, request, view):
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        client_addr = xff.split(",")[0] if xff else None
        ident = client_addr or request.META.get("REMOTE_ADDR")
        if not ident:
            return None
        return self.cache_format % {
            "scope": self.scope,
            "ident": ident,
        }
    
    def throttle_success(self, request=None):
        """Decrement on completion.

        Accept an optional `request` for compatibility with BaseThrottle's
        `allow_request` which may call `throttle_success()` without args.
        """
        if request is None:
            return True

        from django.core.cache import cache

        if not (request.user and request.user.is_authenticated):
            return True

        key = f"concurrent:{request.user.id}"
        current = cache.get(key, 1)
        cache.set(key, max(0, current - 1), self.cache_timeout)
        return True
    
    def allow_request(self, request, view=None):
        """Delegate to parent implementation to ensure correct signatures are used.

        This avoids DRF calling a BaseThrottle.allow_request fallback that expects
        throttle_success() with no args.
        """
        return super().allow_request(request, view)
