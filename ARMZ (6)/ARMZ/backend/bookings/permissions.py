from rest_framework.permissions import BasePermission


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if getattr(request.user, "is_admin_user", False):
            return True
        return getattr(obj, "user_id", None) == request.user.id
