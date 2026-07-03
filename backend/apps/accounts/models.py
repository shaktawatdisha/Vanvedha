import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from core.models import TimestampedModel


class Role(models.TextChoices):
    CUSTOMER = 'CUSTOMER', 'Customer'
    DELIVERY = 'DELIVERY', 'Delivery Agent'
    ADMIN    = 'ADMIN',    'Admin'
    STAFF    = 'STAFF',    'Staff'


class StaffModule(models.TextChoices):
    ORDERS_PAYMENTS  = 'orders_payments',  'Orders & Payments'
    ACCOUNTS_USERS   = 'accounts_users',   'Accounts & Users'
    CATALOG_REVIEWS  = 'catalog_reviews',  'Catalog & Reviews'
    PROCUREMENT      = 'procurement',      'Procurement & Processing'
    PAYROLL          = 'payroll',          'Staff Payroll'


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        extra_fields.setdefault('role', Role.CUSTOMER)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('role', Role.ADMIN)
        return self.create_user(email, password, **extra_fields)

    # Convenience queryset helpers
    def customers(self):
        return self.filter(role=Role.CUSTOMER)

    def delivery_agents(self):
        return self.filter(role=Role.DELIVERY)

    def admins(self):
        return self.filter(role=Role.ADMIN)

    def staff(self):
        return self.filter(role=Role.STAFF)


class User(AbstractBaseUser, PermissionsMixin):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email       = models.EmailField(unique=True)
    phone       = models.CharField(max_length=15, unique=True, null=True, blank=True)
    first_name  = models.CharField(max_length=50)
    last_name   = models.CharField(max_length=50)
    role        = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    is_staff    = models.BooleanField(default=False)
    is_active   = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f'{self.email} ({self.get_role_display()})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    # ── Role helpers ──────────────────────────────────────────────
    @property
    def is_customer(self):
        return self.role == Role.CUSTOMER

    @property
    def is_delivery_agent(self):
        return self.role == Role.DELIVERY

    @property
    def is_admin_user(self):
        return self.role == Role.ADMIN

    @property
    def is_staff_user(self):
        return self.role == Role.STAFF


class DeliveryAgentProfile(TimestampedModel):
    """Extra info for users with role=DELIVERY."""
    VEHICLE_CHOICES = [('BIKE', 'Bike'), ('SCOOTER', 'Scooter'), ('VAN', 'Van')]

    user            = models.OneToOneField(User, on_delete=models.CASCADE, related_name='delivery_profile')
    vehicle_type    = models.CharField(max_length=10, choices=VEHICLE_CHOICES, default='BIKE')
    vehicle_number  = models.CharField(max_length=15, blank=True)
    is_available    = models.BooleanField(default=True)
    current_zone    = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'delivery_agent_profiles'

    def __str__(self):
        return f'{self.user.full_name} – {self.vehicle_type}'


class PermissionTemplate(TimestampedModel):
    """
    A named preset of module-level CRUD permissions that Admin can assign to Staff.
    Examples: 'Order Manager', 'Accounts Staff', 'Procurement Staff'.
    """
    name        = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'permission_templates'

    def __str__(self):
        return self.name


class TemplateModulePermission(models.Model):
    """
    CRUD access for one module inside a PermissionTemplate.
    One row per (template, module) pair.
    """
    template   = models.ForeignKey(PermissionTemplate, on_delete=models.CASCADE, related_name='module_permissions')
    module     = models.CharField(max_length=30, choices=StaffModule.choices)
    can_view   = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_edit   = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        db_table        = 'template_module_permissions'
        unique_together = ('template', 'module')

    def __str__(self):
        perms = [a for a, v in [('V', self.can_view), ('C', self.can_create), ('E', self.can_edit), ('D', self.can_delete)] if v]
        return f'{self.template.name} / {self.get_module_display()} [{",".join(perms) or "none"}]'


class StaffProfile(TimestampedModel):
    """
    Extra info for users with role=STAFF.
    Inherits CRUD permissions from template; overrides let Admin fine-tune per-staff.
    """
    user     = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    template = models.ForeignKey(PermissionTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')
    # JSON override: {"orders_payments": {"view": true, "create": false, "edit": null, "delete": null}}
    # null = inherit from template; explicit bool = override for this staff only.
    permission_overrides = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'staff_profiles'

    def __str__(self):
        tpl = self.template.name if self.template else 'no template'
        return f'{self.user.full_name} ({tpl})'

    def effective_permission(self, module: str, action: str) -> bool:
        """Return the resolved permission for (module, action) for this staff member."""
        override = self.permission_overrides.get(module, {}).get(action)
        if override is not None:
            return bool(override)
        if self.template:
            mp = self.template.module_permissions.filter(module=module).first()
            if mp:
                return getattr(mp, f'can_{action}', False)
        return False


class Address(TimestampedModel):
    ADDRESS_TYPES = [('HOME', 'Home'), ('WORK', 'Work'), ('OTHER', 'Other')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=10, choices=ADDRESS_TYPES, default='HOME')
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    country = models.CharField(max_length=50, default='India')
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = 'addresses'
        verbose_name_plural = 'addresses'

    def __str__(self):
        return f'{self.full_name} - {self.city}, {self.state}'

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)
