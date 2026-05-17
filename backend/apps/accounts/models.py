import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from core.models import TimestampedModel


class Role(models.TextChoices):
    CUSTOMER = 'CUSTOMER', 'Customer'
    VENDOR   = 'VENDOR',   'Vendor'
    DELIVERY = 'DELIVERY', 'Delivery Agent'
    ADMIN    = 'ADMIN',    'Admin'


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

    def vendors(self):
        return self.filter(role=Role.VENDOR)

    def delivery_agents(self):
        return self.filter(role=Role.DELIVERY)

    def admins(self):
        return self.filter(role=Role.ADMIN)


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
    def is_vendor(self):
        return self.role == Role.VENDOR

    @property
    def is_delivery_agent(self):
        return self.role == Role.DELIVERY

    @property
    def is_admin_user(self):
        return self.role == Role.ADMIN


class VendorProfile(TimestampedModel):
    """Extra info for users with role=VENDOR."""
    user         = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    shop_name    = models.CharField(max_length=150)
    gstin        = models.CharField(max_length=15, blank=True)
    is_approved  = models.BooleanField(default=False)  # Admin must approve before vendor can list products
    bank_account = models.CharField(max_length=20, blank=True)
    ifsc_code    = models.CharField(max_length=11, blank=True)

    class Meta:
        db_table = 'vendor_profiles'

    def __str__(self):
        return f'{self.shop_name} ({self.user.email})'


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
