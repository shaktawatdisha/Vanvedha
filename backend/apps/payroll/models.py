from django.core.validators import MinValueValidator
from django.db import models
from core.models import TimestampedModel
from apps.accounts.models import User


class StaffSalary(TimestampedModel):
    """Base monthly salary configuration for a staff member. One record per user."""
    user           = models.OneToOneField(User, on_delete=models.CASCADE, related_name='salary_profile')
    base_salary    = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    effective_from = models.DateField()
    notes          = models.TextField(blank=True)

    class Meta:
        db_table = 'staff_salaries'
        ordering = ['user__first_name', 'user__last_name']

    def __str__(self):
        return f'{self.user.full_name} — {self.base_salary}/mo'


class SalaryPayment(TimestampedModel):
    """One monthly payment record for a staff member."""
    STATUS_CHOICES = [('PENDING', 'Pending'), ('PAID', 'Paid')]

    staff_salary = models.ForeignKey(StaffSalary, on_delete=models.CASCADE, related_name='payments')
    month        = models.DateField(help_text='First day of the salary month, e.g. 2026-07-01')
    amount       = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    status       = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    paid_on      = models.DateField(null=True, blank=True)
    notes        = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'salary_payments'
        unique_together = ('staff_salary', 'month')
        ordering = ['-month']

    def __str__(self):
        return f'{self.staff_salary.user.full_name} — {self.month:%b %Y} ({self.status})'
