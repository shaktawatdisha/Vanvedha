from rest_framework.permissions import BasePermission
from apps.accounts.models import Role


class IsAdminRole(BasePermission):
    """Allows access only to users with role=ADMIN (full, unscoped access)."""
    message = 'You do not have admin privileges.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMIN
        )


# HTTP-method fallback, used when the view isn't a ViewSet (no `.action`).
METHOD_ACTION_MAP = {
    'GET': 'view', 'HEAD': 'view', 'OPTIONS': 'view',
    'POST': 'create',
    'PUT': 'edit', 'PATCH': 'edit',
    'DELETE': 'delete',
}

# DRF ViewSet action -> permission action. Custom actions (e.g. `confirm`)
# aren't listed here and fall back to 'edit', since they always mutate an
# existing record rather than create a new one.
VIEWSET_ACTION_MAP = {
    'list': 'view', 'retrieve': 'view',
    'create': 'create',
    'update': 'edit', 'partial_update': 'edit',
    'destroy': 'delete',
}


class HasModulePermission(BasePermission):
    """
    ADMIN role: full access.
    STAFF role: allowed only if their StaffProfile (template + overrides)
    grants the resolved action for `view.module`.

    Views must set a `module` class attribute (a StaffModule value).
    Views may set `permission_action` to force a specific action
    ('view'/'create'/'edit'/'delete') instead of deriving it from the
    HTTP method / viewset action — use this for single-purpose endpoints
    that mutate an existing record via POST (activate, approve, etc).
    """
    message = 'You do not have permission to perform this action.'

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.role == Role.ADMIN:
            return True
        if user.role != Role.STAFF:
            return False

        module = getattr(view, 'module', None)
        if module is None:
            return False

        profile = getattr(user, 'staff_profile', None)
        if not profile or not profile.is_active:
            return False

        action = getattr(view, 'permission_action', None)
        if action is None:
            viewset_action = getattr(view, 'action', None)
            if viewset_action:
                action = VIEWSET_ACTION_MAP.get(viewset_action, 'edit')
            else:
                action = METHOD_ACTION_MAP.get(request.method)

        if action is None:
            return False

        return profile.effective_permission(module, action)
