from django.utils.deprecation import MiddlewareMixin
from rest_framework.exceptions import AuthenticationFailed
from tenants.models import Tenant


class TenantMiddleware(MiddlewareMixin):
    def process_request(self, request):
        api_key = self._get_api_key(request)
        if api_key:
            try:
                tenant = Tenant.objects.get(api_key=api_key, is_active=True)
                request.tenant = tenant
            except Tenant.DoesNotExist:
                raise AuthenticationFailed("Invalid API key")
        else:
            request.tenant = None

    def _get_api_key(self, request):
        # Check header first
        api_key = request.META.get('HTTP_X_API_KEY')
        if api_key:
            return api_key
        # Check query param
        return request.GET.get('api_key')