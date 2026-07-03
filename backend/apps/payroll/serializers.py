from rest_framework import serializers
from apps.accounts.models import Role
from .models import StaffSalary, SalaryPayment


class StaffSalarySerializer(serializers.ModelSerializer):
    user_name          = serializers.CharField(source='user.full_name', read_only=True)
    user_email         = serializers.CharField(source='user.email', read_only=True)
    pending_count      = serializers.SerializerMethodField()

    class Meta:
        model = StaffSalary
        fields = (
            'id', 'user', 'user_name', 'user_email',
            'base_salary', 'effective_from', 'notes',
            'pending_count', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_pending_count(self, obj):
        return obj.payments.filter(status='PENDING').count()

    def validate_user(self, value):
        if value.role != Role.STAFF:
            raise serializers.ValidationError('Salary can only be configured for a Staff-role user.')
        return value


class SalaryPaymentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff_salary.user.full_name', read_only=True)

    class Meta:
        model = SalaryPayment
        fields = (
            'id', 'staff_salary', 'staff_name', 'month', 'amount',
            'status', 'paid_on', 'notes', 'created_at',
        )
        read_only_fields = ('id', 'created_at')
