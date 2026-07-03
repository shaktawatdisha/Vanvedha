from rest_framework.permissions import BasePermission
from .models import Role


class IsDeliveryRole(BasePermission):
    """Allows access only to users with role=DELIVERY."""
    message = 'You do not have delivery agent privileges.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.DELIVERY
        )
