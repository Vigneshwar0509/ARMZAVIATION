"""API Key Management System for Partner Integrations"""

from django.db import models
from django.utils import timezone
from datetime import timedelta
import secrets
import hashlib

from accounts.models import User


class APIKey(models.Model):
    """
    API Key model for partner and external integrations.
    
    Features:
    - Secure key generation and storage
    - Rate limiting per key
    - Expiration management
    - IP whitelisting
    - Scope-based permissions
    """
    
    SCOPES = [
        ('read:jobs', 'Read Job Postings'),
        ('read:internships', 'Read Internship Listings'),
        ('read:plans', 'Read Subscription Plans'),
        ('write:jobs', 'Create Job Postings'),
        ('write:applications', 'Submit Applications'),
        ('read:analytics', 'Read Analytics Data'),
        ('admin:users', 'Manage Users'),
        ('admin:payments', 'Manage Payments'),
    ]
    
    # Identification
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_keys')
    name = models.CharField(max_length=255, help_text="Descriptive name for this API key")
    
    # Security
    key_hash = models.CharField(max_length=255, unique=True, db_index=True)
    prefix = models.CharField(max_length=10, db_index=True)  # First 10 chars of key
    secret_hash = models.CharField(max_length=255, blank=True)  # For webhook signing
    
    # Permissions
    scopes = models.JSONField(default=list, help_text="List of allowed scopes")
    
    # Rate limiting
    rate_limit = models.IntegerField(
        default=1000,
        help_text="Requests per hour limit"
    )
    
    # IP Whitelisting
    allowed_ips = models.JSONField(
        default=list,
        blank=True,
        help_text="List of IPs allowed to use this key. Empty = all IPs allowed"
    )
    
    # Lifecycle
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Leave blank for no expiration"
    )
    
    # Metadata
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'API Key'
        verbose_name_plural = 'API Keys'
    
    def __str__(self):
        return f"{self.user.email} - {self.name} ({self.prefix}...)"
    
    @staticmethod
    def generate_key():
        """Generate a secure random API key."""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def hash_key(key):
        """Hash the API key for secure storage."""
        return hashlib.sha256(key.encode()).hexdigest()
    
    def is_valid(self):
        """Check if API key is valid and not expired."""
        if not self.is_active:
            return False
        
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        
        return True
    
    def can_access_scope(self, scope):
        """Check if key has access to requested scope."""
        return scope in self.scopes or '*' in self.scopes
    
    def record_usage(self):
        """Update last_used_at timestamp."""
        self.last_used_at = timezone.now()
        self.save(update_fields=['last_used_at'])
    
    @classmethod
    def create_key(cls, user, name, scopes, rate_limit=1000, expires_in_days=None):
        """
        Factory method to create a new API key.
        
        Returns:
            tuple: (APIKey instance, raw key string)
        """
        raw_key = cls.generate_key()
        key_hash = cls.hash_key(raw_key)
        prefix = raw_key[:10]
        
        expires_at = None
        if expires_in_days:
            expires_at = timezone.now() + timedelta(days=expires_in_days)
        
        api_key = cls.objects.create(
            user=user,
            name=name,
            key_hash=key_hash,
            prefix=prefix,
            scopes=scopes,
            rate_limit=rate_limit,
            expires_at=expires_at
        )
        
        return api_key, raw_key


class APIKeyUsage(models.Model):
    """Track API key usage for rate limiting and analytics."""
    
    api_key = models.ForeignKey(APIKey, on_delete=models.CASCADE, related_name='usage_logs')
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField()
    response_time_ms = models.IntegerField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    request_body_size = models.IntegerField(default=0)
    response_body_size = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['api_key', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.api_key.prefix}... - {self.method} {self.endpoint} ({self.status_code})"


from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.core.cache import cache
from django.conf import settings


class APIKeyAuthentication(TokenAuthentication):
    """
    Custom authentication class for API key based access.
    
    Usage: Add to DEFAULT_AUTHENTICATION_CLASSES in settings.py
    """
    
    keyword = 'Bearer'
    
    def authenticate(self, request):
        """Authenticate request using API key."""
        auth = self._get_auth_header(request)
        
        if not auth:
            return None
        
        try:
            key = auth[1].decode()
        except (IndexError, UnicodeDecodeError):
            raise AuthenticationFailed('Invalid token format')
        
        # Check cache first
        cache_key = f'api_key:{key[:10]}'
        api_key_data = cache.get(cache_key)
        
        if api_key_data is None:
            # Look up in database
            key_hash = APIKey.hash_key(key)
            try:
                api_key = APIKey.objects.get(key_hash=key_hash)
            except APIKey.DoesNotExist:
                raise AuthenticationFailed('Invalid API key')
            
            # Validate
            if not api_key.is_valid():
                raise AuthenticationFailed('API key is invalid or expired')
            
            api_key_data = {
                'id': api_key.id,
                'user_id': api_key.user_id,
                'scopes': api_key.scopes,
                'rate_limit': api_key.rate_limit,
                'allowed_ips': api_key.allowed_ips,
            }
            cache.set(cache_key, api_key_data, 300)  # Cache for 5 minutes
        
        # Check IP whitelist
        if api_key_data['allowed_ips']:
            client_ip = self._get_client_ip(request)
            if client_ip not in api_key_data['allowed_ips']:
                raise AuthenticationFailed('Your IP is not whitelisted')
        
        # Check rate limiting
        if not self._check_rate_limit(api_key_data['id'], api_key_data['rate_limit']):
            raise AuthenticationFailed('Rate limit exceeded')
        
        # Return user and authenticated key
        return (api_key_data['user_id'], api_key_data)
    
    @staticmethod
    def _get_auth_header(request):
        """Extract Authorization header."""
        auth = request.META.get('HTTP_AUTHORIZATION', '').split()
        return auth if len(auth) == 2 and auth[0] == 'Bearer' else None
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
    
    @staticmethod
    def _check_rate_limit(api_key_id, limit_per_hour):
        """Check if API key has exceeded rate limit."""
        cache_key = f'rate_limit:{api_key_id}'
        count = cache.get(cache_key, 0)
        
        if count >= limit_per_hour:
            return False
        
        cache.set(cache_key, count + 1, 3600)  # Reset after 1 hour
        return True


# Admin configuration
from django.contrib import admin


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'prefix', 'is_active', 'rate_limit', 'created_at', 'expires_at']
    list_filter = ['is_active', 'created_at', 'expires_at']
    search_fields = ['user__email', 'name', 'prefix']
    readonly_fields = ['key_hash', 'prefix', 'created_at', 'updated_at', 'last_used_at']
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'name', 'description', 'prefix')
        }),
        ('Security', {
            'fields': ('is_active', 'expires_at', 'allowed_ips', 'scopes')
        }),
        ('Rate Limiting', {
            'fields': ('rate_limit',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_used_at'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        return False  # Create through custom view


@admin.register(APIKeyUsage)
class APIKeyUsageAdmin(admin.ModelAdmin):
    list_display = ['api_key', 'endpoint', 'method', 'status_code', 'response_time_ms', 'timestamp']
    list_filter = ['method', 'status_code', 'timestamp']
    search_fields = ['api_key__prefix', 'endpoint', 'ip_address']
    readonly_fields = list_display
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
