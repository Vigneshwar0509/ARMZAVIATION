from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied


class RolePermission(BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_admin_user", False):
            return True
        return getattr(user, "role", None) in self.allowed_roles


class IsAdminRole(RolePermission):
    allowed_roles = ("admin",)

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, "is_admin_user", False))


class IsStudentRole(RolePermission):
    allowed_roles = ("student",)


class IsEmployerRole(RolePermission):
    allowed_roles = ("employer",)


class AuthenticatedOrRaise403(BasePermission):
    """Require authentication but raise PermissionDenied (403) when missing instead of 401."""

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            raise PermissionDenied("Authentication required")
        return True
