from rest_framework.permissions import BasePermission
from apps.accounts.models import Role


class IsAdminRole(BasePermission):
    """Allows access only to users with role=ADMIN."""
    message = 'You do not have admin privileges.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMIN
        )
