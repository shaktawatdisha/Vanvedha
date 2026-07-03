import datetime
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.models import StaffModule
from apps.admin.permissions import HasModulePermission
from .models import StaffSalary, SalaryPayment
from .serializers import StaffSalarySerializer, SalaryPaymentSerializer


def _parse_month(raw):
    """Accepts 'YYYY-MM' or 'YYYY-MM-DD' and returns the first day of that month."""
    if not raw:
        return None
    parts = raw.split('-')
    if len(parts) < 2:
        return None
    try:
        return datetime.date(int(parts[0]), int(parts[1]), 1)
    except (ValueError, IndexError):
        return None


class StaffSalaryViewSet(viewsets.ModelViewSet):
    permission_classes = [HasModulePermission]
    module              = StaffModule.PAYROLL
    serializer_class   = StaffSalarySerializer
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['user__first_name', 'user__last_name', 'user__email']
    ordering_fields    = ['base_salary', 'effective_from', 'created_at']

    def get_queryset(self):
        return StaffSalary.objects.select_related('user').prefetch_related('payments')


class SalaryPaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [HasModulePermission]
    module              = StaffModule.PAYROLL
    serializer_class   = SalaryPaymentSerializer
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['staff_salary', 'status', 'month']
    ordering_fields    = ['month', 'created_at']

    def get_queryset(self):
        return SalaryPayment.objects.select_related('staff_salary__user').all()

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        payment = self.get_object()
        if payment.status == 'PAID':
            return Response({'detail': 'Payment is already marked as paid.'}, status=status.HTTP_400_BAD_REQUEST)
        payment.status = 'PAID'
        payment.paid_on = datetime.date.today()
        payment.save(update_fields=['status', 'paid_on'])
        return Response(self.get_serializer(payment).data)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        """
        Create a PENDING payment for every staff salary that doesn't already
        have one for the given month (defaults to the current month).
        """
        month = _parse_month(request.data.get('month')) or datetime.date.today().replace(day=1)

        existing_ids = set(
            SalaryPayment.objects.filter(month=month).values_list('staff_salary_id', flat=True)
        )
        to_create = [
            SalaryPayment(staff_salary=salary, month=month, amount=salary.base_salary, status='PENDING')
            for salary in StaffSalary.objects.all()
            if salary.id not in existing_ids
        ]
        SalaryPayment.objects.bulk_create(to_create)

        payments = SalaryPayment.objects.filter(month=month).select_related('staff_salary__user')
        return Response({
            'month': month,
            'created': len(to_create),
            'payments': self.get_serializer(payments, many=True).data,
        })
