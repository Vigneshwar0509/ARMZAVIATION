"""Simple RBAC utilities: decorator and middleware.

Usage:
  - Decorate DRF view classes or view functions: @require_roles('admin')
  - The middleware reads the `required_roles` attribute and enforces it.

This is intentionally small and non-opinionated so it can be applied incrementally.
"""
from functools import wraps

from django.core.exceptions import PermissionDenied

try:
    from rest_framework.permissions import BasePermission
except Exception:
    BasePermission = None


def require_roles(*roles):
    """Decorator to mark a view function or class with required roles.

    Roles are strings like 'admin', 'student', 'employer'. Multiple roles allowed.
    """
    role_set = set(roles or [])

    def decorator(view):
        # For class-based views, annotate the class; for functions, annotate the function.
        try:
            # If decorating a class, set attribute on class
            setattr(view, "required_roles", role_set)
            return view
        except Exception:
            pass

        @wraps(view)
        def _wrapped(*args, **kwargs):
            return view(*args, **kwargs)

        setattr(_wrapped, "required_roles", role_set)
        return _wrapped

    return decorator


class RolePermission(BasePermission if BasePermission is not None else object):
    """DRF permission class that enforces `required_roles` set on views.

    Use in a view's `permission_classes` to enforce roles for that endpoint.
    If DRF isn't available at import time, this is a no-op placeholder.
    """

    def has_permission(self, request, view):
        required = getattr(view, "required_roles", None)
        if not required:
            return True

        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False

        if getattr(user, "is_admin_user", False) or getattr(user, "is_superuser", False):
            return True

        return getattr(user, "role", None) in required


class RBACMiddleware:
    """Middleware that enforces `required_roles` attribute on resolved views.

    It allows an `admin` user (or any user with `is_admin_user` truthy) to bypass role checks.
    If a view does not have `required_roles` but uses a permission class named
    `IsAdminRole`, this middleware will treat it as requiring `admin` role.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        resolver_match = getattr(request, "resolver_match", None)
        if resolver_match:
            view_func = resolver_match.func
            required = None

            # DRF class-based views expose `view_class` on the function produced by as_view()
            view_class = getattr(view_func, "view_class", None)
            if view_class is not None:
                required = getattr(view_class, "required_roles", None)
            else:
                required = getattr(view_func, "required_roles", None)

            # Fallback: if no explicit required_roles, detect permission classes named IsAdminRole
            if not required:
                permission_classes = None
                if view_class is not None:
                    permission_classes = getattr(view_class, "permission_classes", None)
                else:
                    permission_classes = getattr(view_func, "permission_classes", None)

                if permission_classes:
                    for pc in permission_classes:
                        pc_name = getattr(pc, "__name__", None) or pc.__class__.__name__
                        if pc_name == "IsAdminRole":
                            required = {"admin"}
                            break

            if required:
                user = getattr(request, "user", None)
                if not user or not getattr(user, "is_authenticated", False):
                    raise PermissionDenied("Authentication required")

                # Admin users bypass role checks
                if getattr(user, "is_admin_user", False) or getattr(user, "is_superuser", False):
                    return self.get_response(request)

                user_role = getattr(user, "role", None)
                if user_role not in required:
                    raise PermissionDenied("Insufficient role privileges")

        return self.get_response(request)
