from rest_framework import serializers
from apps.accounts.models import (
    User, DeliveryAgentProfile, Role,
    PermissionTemplate, TemplateModulePermission, StaffProfile, StaffModule,
)


class AdminUserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for user listing."""
    full_name           = serializers.ReadOnlyField()
    staff_template_id   = serializers.SerializerMethodField()
    staff_template_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'full_name', 'phone',
            'role', 'is_active', 'is_verified', 'date_joined',
            'staff_template_id', 'staff_template_name',
        )

    def _profile(self, obj):
        return getattr(obj, 'staff_profile', None)

    def get_staff_template_id(self, obj):
        profile = self._profile(obj)
        return profile.template_id if profile else None

    def get_staff_template_name(self, obj):
        profile = self._profile(obj)
        return profile.template.name if profile and profile.template else None


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


class TemplateModulePermissionSerializer(serializers.ModelSerializer):
    module_label = serializers.CharField(source='get_module_display', read_only=True)

    class Meta:
        model = TemplateModulePermission
        fields = ('module', 'module_label', 'can_view', 'can_create', 'can_edit', 'can_delete')


class PermissionTemplateSerializer(serializers.ModelSerializer):
    module_permissions = TemplateModulePermissionSerializer(many=True)
    staff_count = serializers.SerializerMethodField()

    class Meta:
        model = PermissionTemplate
        fields = (
            'id', 'name', 'description', 'is_active',
            'module_permissions', 'staff_count', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_staff_count(self, obj):
        return obj.staff_members.count()

    def validate_module_permissions(self, value):
        modules = [row['module'] for row in value]
        if len(modules) != len(set(modules)):
            raise serializers.ValidationError('Each module may only appear once per template.')
        valid_modules = set(StaffModule.values)
        for m in modules:
            if m not in valid_modules:
                raise serializers.ValidationError(f'Invalid module "{m}". Choices: {sorted(valid_modules)}')
        return value

    def create(self, validated_data):
        module_permissions = validated_data.pop('module_permissions', [])
        template = PermissionTemplate.objects.create(**validated_data)
        for row in module_permissions:
            TemplateModulePermission.objects.create(template=template, **row)
        return template

    def update(self, instance, validated_data):
        module_permissions = validated_data.pop('module_permissions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if module_permissions is not None:
            for row in module_permissions:
                TemplateModulePermission.objects.update_or_create(
                    template=instance, module=row['module'],
                    defaults={k: v for k, v in row.items() if k != 'module'},
                )
        return instance


class StaffProfileSerializer(serializers.ModelSerializer):
    user_email    = serializers.EmailField(source='user.email', read_only=True)
    user_name     = serializers.CharField(source='user.full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True, default=None)
    effective_permissions = serializers.SerializerMethodField()

    class Meta:
        model = StaffProfile
        fields = (
            'id', 'user', 'user_email', 'user_name',
            'template', 'template_name', 'permission_overrides',
            'is_active', 'effective_permissions', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def get_effective_permissions(self, obj):
        return {
            module: {
                action: obj.effective_permission(module, action)
                for action in ('view', 'create', 'edit', 'delete')
            }
            for module in StaffModule.values
        }

    def validate_permission_overrides(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('permission_overrides must be an object keyed by module.')
        valid_modules = set(StaffModule.values)
        valid_actions = {'view', 'create', 'edit', 'delete'}
        for module, actions in value.items():
            if module not in valid_modules:
                raise serializers.ValidationError(f'Invalid module "{module}". Choices: {sorted(valid_modules)}')
            if not isinstance(actions, dict) or not set(actions).issubset(valid_actions):
                raise serializers.ValidationError(f'Invalid overrides for module "{module}". Allowed keys: {sorted(valid_actions)}')
        return value


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
    total_delivery_agents     = serializers.IntegerField()
    active_users              = serializers.IntegerField()
    inactive_users            = serializers.IntegerField()
    verified_users            = serializers.IntegerField()
