"""Sentry error tracking and monitoring setup."""

import logging
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from django.conf import settings


def initialize_sentry():
    """Initialize Sentry error tracking with custom configuration."""
    
    if not settings.SENTRY_DSN:
        return
    
    # Configure logging integration
    sentry_logging = LoggingIntegration(
        level=logging.INFO,  # Capture info and above as breadcrumbs
        event_level=logging.ERROR  # Send errors to Sentry
    )
    
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            sentry_logging,
        ],
        traces_sample_rate=settings.SENTRY_TRACE_SAMPLE_RATE,
        profiles_sample_rate=settings.SENTRY_PROFILE_SAMPLE_RATE,
        release=settings.SENTRY_RELEASE,
        environment=settings.ENVIRONMENT,
        
        # Security & filtering
        include_local_variables=settings.DEBUG,
        send_default_pii=False,
        
        # Django-specific settings
        attach_stacktrace=True,
        server_name=settings.SENTRY_SERVER_NAME or "armz-backend",
        
        # Set request body logging
        max_request_body_size=settings.SENTRY_MAX_REQUEST_BODY_SIZE,
        before_send=_sentry_before_send,
    )


def _sentry_before_send(event, hint):
    """Filter sensitive data before sending to Sentry."""
    
    # Don't send transaction events for health checks and admin endpoints
    if event.get('request', {}).get('url'):
        url = event['request']['url']
        if any(exclude in url for exclude in ['/health', '/admin', '/static', '/media']):
            return None
    
    # Filter sensitive headers and query params
    if 'request' in event:
        req = event['request']
        
        # Remove sensitive headers
        if 'headers' in req:
            sensitive_headers = [
                'Authorization', 'Cookie', 'X-API-Key',
                'X-Auth-Token', 'X-CSRF-Token'
            ]
            for header in sensitive_headers:
                req['headers'].pop(header, None)
        
        # Filter query string
        if 'query_string' in req:
            query = req['query_string']
            if isinstance(query, str) and ('password' in query or 'token' in query):
                req['query_string'] = '[REDACTED]'
    
    return event


# Initialize breadcrumb callback
def sentry_breadcrumb_callback(logger_name, method_name, level, record):
    """Custom breadcrumb extraction from logs."""
    if level < logging.WARNING:
        return  # Only WARNING and ERROR
    
    return {
        'logger': logger_name,
        'level': logging.getLevelName(level),
        'message': record.getMessage()
    }
