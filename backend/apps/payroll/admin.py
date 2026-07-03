from django.contrib import admin
from .models import StaffSalary, SalaryPayment


class SalaryPaymentInline(admin.TabularInline):
    model = SalaryPayment
    extra = 0


@admin.register(StaffSalary)
class StaffSalaryAdmin(admin.ModelAdmin):
    list_display  = ('user', 'base_salary', 'effective_from')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    inlines       = [SalaryPaymentInline]


@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display  = ('staff_salary', 'month', 'amount', 'status', 'paid_on')
    list_filter   = ('status', 'month')
    search_fields = ('staff_salary__user__email',)
