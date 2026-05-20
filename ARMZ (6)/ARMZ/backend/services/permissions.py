from rest_framework.permissions import BasePermission
from services.models import Plan
from services.utils import build_plan_code


class IsAdminRole(BasePermission):
    """Check if user has admin role"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, "is_admin_user", False))


class HasPlanPermission(BasePermission):
    """
    Check if user's subscription plan has required permission.
    Requires 'required_permission' attribute on view.
    """
    PERMISSION_ALIASES = {
        'job_posting': ['post_job'],
    }

    def _resolve_plan(self, subscription):
        if isinstance(subscription, Plan):
            return subscription

        if not subscription:
            return None

        normalized_subscription = build_plan_code(str(subscription))
        plan = Plan.objects.filter(name__iexact=str(subscription)).first()
        if plan:
            return plan

        for plan in Plan.objects.all():
            if build_plan_code(plan.name) == normalized_subscription:
                return plan

        return None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins bypass permission checks
        if getattr(request.user, "is_admin_user", False):
            return True

        required_permission = getattr(view, 'required_permission', None)
        if not required_permission:
            return True  # No specific permission required

        subscription = getattr(request.user, 'subscription', None)
        if not subscription:
            return False

        plan = self._resolve_plan(subscription)
        if not plan:
            return False

        normalized_permissions = set(plan.permissions or [])
        for alias, equivalents in self.PERMISSION_ALIASES.items():
            if alias in normalized_permissions:
                normalized_permissions.update(equivalents)
            for equivalent in equivalents:
                if equivalent in normalized_permissions:
                    normalized_permissions.add(alias)

        if isinstance(required_permission, (list, tuple)):
            return any(permission in normalized_permissions for permission in required_permission)
        return required_permission in normalized_permissions


class IsEnterpriseUser(BasePermission):
    """Check if user has Enterprise plan (for SSO features)"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admins have Enterprise access
        if getattr(request.user, "is_admin_user", False):
            return True
        
        subscription = getattr(request.user, 'subscription', None)
        if subscription and isinstance(subscription, Plan):
            return subscription.name == 'Enterprise' and 'sso' in subscription.permissions
        
        return False
