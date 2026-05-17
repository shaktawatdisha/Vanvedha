from rest_framework import serializers
from apps.accounts.models import User, VendorProfile, DeliveryAgentProfile, Role


class AdminUserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for user listing."""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'full_name', 'phone',
            'role', 'is_active', 'is_verified', 'date_joined',
        )


class AdminUserDetailSerializer(serializers.ModelSerializer):
    """Full serializer for user detail and update."""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'is_active', 'is_verified',
            'is_staff', 'is_superuser', 'date_joined',
        )
        read_only_fields = ('id', 'email', 'date_joined', 'is_superuser')

    def validate_role(self, value):
        if value not in Role.values:
            raise serializers.ValidationError(f'Invalid role. Choose from: {Role.values}')
        return value


class AdminVendorSerializer(serializers.ModelSerializer):
    user_email    = serializers.EmailField(source='user.email', read_only=True)
    user_name     = serializers.CharField(source='user.full_name', read_only=True)
    user_phone    = serializers.CharField(source='user.phone', read_only=True)
    date_joined   = serializers.DateTimeField(source='user.date_joined', read_only=True)

    class Meta:
        model = VendorProfile
        fields = (
            'id', 'user_email', 'user_name', 'user_phone', 'date_joined',
            'shop_name', 'gstin', 'is_approved', 'bank_account', 'ifsc_code',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class AdminDeliveryAgentSerializer(serializers.ModelSerializer):
    user_email  = serializers.EmailField(source='user.email', read_only=True)
    user_name   = serializers.CharField(source='user.full_name', read_only=True)
    user_phone  = serializers.CharField(source='user.phone', read_only=True)

    class Meta:
        model = DeliveryAgentProfile
        fields = (
            'id', 'user_email', 'user_name', 'user_phone',
            'vehicle_type', 'vehicle_number', 'is_available', 'current_zone',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class AdminDashboardSerializer(serializers.Serializer):
    total_users               = serializers.IntegerField()
    total_customers           = serializers.IntegerField()
    total_vendors             = serializers.IntegerField()
    total_delivery_agents     = serializers.IntegerField()
    pending_vendor_approvals  = serializers.IntegerField()
    active_users              = serializers.IntegerField()
    inactive_users            = serializers.IntegerField()
    verified_users            = serializers.IntegerField()
