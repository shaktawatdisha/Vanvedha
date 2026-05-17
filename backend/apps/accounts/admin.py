from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Address, VendorProfile, DeliveryAgentProfile, Role


class VendorProfileInline(admin.StackedInline):
    model = VendorProfile
    can_delete = False
    extra = 0


class DeliveryProfileInline(admin.StackedInline):
    model = DeliveryAgentProfile
    can_delete = False
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('email', 'full_name', 'role', 'is_verified', 'is_active', 'date_joined')
    list_filter   = ('role', 'is_staff', 'is_verified', 'is_active')
    search_fields = ('email', 'first_name', 'last_name', 'phone')
    ordering      = ('-date_joined',)

    fieldsets = (
        (None,            {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Role',          {'fields': ('role',)}),
        ('Permissions',   {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

    def get_inlines(self, request, obj=None):  # noqa: ARG002
        """Show profile inline only for the relevant role."""
        if obj is None:
            return []
        if obj.role == Role.VENDOR:
            return [VendorProfileInline]
        if obj.role == Role.DELIVERY:
            return [DeliveryProfileInline]
        return []


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display  = ('shop_name', 'user', 'gstin', 'is_approved')
    list_filter   = ('is_approved',)
    search_fields = ('shop_name', 'user__email', 'gstin')
    actions       = ['approve_vendors']

    @admin.action(description='Approve selected vendors')
    def approve_vendors(self, request, queryset):
        queryset.update(is_approved=True)


@admin.register(DeliveryAgentProfile)
class DeliveryAgentProfileAdmin(admin.ModelAdmin):
    list_display  = ('user', 'vehicle_type', 'vehicle_number', 'is_available', 'current_zone')
    list_filter   = ('vehicle_type', 'is_available')
    search_fields = ('user__email', 'vehicle_number', 'current_zone')


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display  = ('full_name', 'user', 'city', 'state', 'is_default')
    list_filter   = ('state', 'is_default')
    search_fields = ('full_name', 'city', 'pincode')
