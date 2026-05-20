from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from config.response import success_response

try:
    from django_prometheus.urls import urlpatterns as prometheus_urlpatterns
except ModuleNotFoundError:
    prometheus_urlpatterns = None


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return success_response({"status": "ok"}, "Service healthy")


api_patterns = [
    path("", include("accounts.urls")),
    path("", include("services.urls")),
    path("", include("bookings.urls")),
    path("", include("payments.urls")),
    path("", include("reviews.urls")),
    path("", include("contact.urls")),
    path("", include("core.urls")),
]

# API Documentation
api_docs_patterns = [
    # OpenAPI Schema
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    # Swagger UI
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    # ReDoc
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", health),
    # Legacy endpoints (no versioning)
    path("", include(api_patterns)),
    path("api/", include(api_patterns)),
    # Versioned API endpoints
    path("api/v1/", include(api_patterns)),
    path("api/v2/", include(api_patterns)),
    # API Documentation
    path("api/docs/", include(api_docs_patterns)),
    path("api/v1/docs/", include(api_docs_patterns)),
    path("api/v2/docs/", include(api_docs_patterns)),
]

if prometheus_urlpatterns is not None:
    urlpatterns.insert(2, path("metrics/", include("django_prometheus.urls")))
