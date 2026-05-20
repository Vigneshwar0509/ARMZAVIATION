from django.conf import settings
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    def _authenticate_raw_token(self, raw_token):
        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError):
            return None

    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                authenticated = self._authenticate_raw_token(raw_token)
                if authenticated is not None:
                    return authenticated

        raw_token = request.COOKIES.get(getattr(settings, "AUTH_COOKIE_ACCESS", "access_token"))
        if not raw_token:
            return None

        return self._authenticate_raw_token(raw_token)


class SSOEnforcement:
    """
    Middleware to enforce SSO for Enterprise users.
    Enterprise tier users with SSO permission get additional security checks.
    """
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if user has Enterprise plan with SSO permission
        if request.user and request.user.is_authenticated:
            subscription = getattr(request.user, 'subscription', None)
            if subscription:
                from services.models import Plan
                if isinstance(subscription, Plan) and subscription.name == 'Enterprise':
                    if 'sso' in subscription.permissions:
                        # Add SSO context to request
                        request.has_sso_enabled = True
                        request.sso_provider = getattr(settings, 'SSO_PROVIDER', 'generic')
        
        response = self.get_response(request)
        return response

