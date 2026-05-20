import logging
import time
import uuid

from django.conf import settings
from django.http import JsonResponse

from config.security_ops import get_client_ip
from config.cache_utils import is_security_blocked
from config.response import build_response_payload

request_logger = logging.getLogger("api.request")


class GlobalExceptionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception as exc:
            request_id = getattr(request, "request_id", None) or str(uuid.uuid4())
            request_logger.exception(
                "Unhandled server exception",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.get_full_path(),
                    "user_id": getattr(getattr(request, "user", None), "id", None),
                    "tenant_id": getattr(getattr(request, "tenant", None), "id", None),
                },
            )
            if settings.DEBUG:
                raise
            response = JsonResponse(
                build_response_payload(
                    success=False,
                    message="Internal server error",
                    data=None,
                    errors={"detail": str(exc) or "Internal server error"},
                ),
                status=500,
            )
            response["X-Request-Id"] = request_id
            return response


class SecurityRequestBlockingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-Id", str(uuid.uuid4()))
        request.request_id = request_id
        started_at = time.monotonic()
        response = self.get_response(request)
        duration_ms = round((time.monotonic() - started_at) * 1000, 2)

        request_logger.info(
            "API request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.get_full_path(),
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "user_id": getattr(getattr(request, "user", None), "id", None),
                "tenant_id": getattr(getattr(request, "tenant", None), "id", None),
            },
        )
        response["X-Request-Id"] = request_id
        if getattr(request, "tenant", None) is not None:
            response["X-Tenant-Id"] = str(request.tenant.id)
        return response


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["X-Content-Type-Options"] = "nosniff"
        # Allow external frames (e.g. Razorpay checkout, Google sign-in widget).
        # X-Frame-Options: DENY prevents these from loading; rely on CSP `frame-src` instead.
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        # Set Cross-Origin-Opener-Policy from settings so GSI popup postMessage works
        coop = getattr(settings, 'SECURE_CROSS_ORIGIN_OPENER_POLICY', None)
        if coop:
            response["Cross-Origin-Opener-Policy"] = coop

        response["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https:; "
            "media-src 'self' data: https:; "
            "script-src 'self' https://checkout.razorpay.com https://accounts.google.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; "
            "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; "
            "frame-src https://checkout.razorpay.com https://accounts.google.com; "
            "connect-src 'self' https:;"
        )
        # Add HSTS when running under HTTPS for production
        if getattr(settings, "SECURE_SSL_REDIRECT", False) and not getattr(settings, "DEBUG", True):
            hsts = getattr(settings, "SECURE_HSTS_SECONDS", 31536000)
            response["Strict-Transport-Security"] = f"max-age={hsts}; includeSubDomains; preload"
        return response
