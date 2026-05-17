from django.db import models
from django.utils import timezone
from core.models import TimestampedModel
from apps.accounts.models import User


class Coupon(TimestampedModel):
    DISCOUNT_TYPES = [('PERCENT', 'Percentage'), ('FLAT', 'Flat Amount')]

    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(max_digits=6, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    max_discount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_single_use = models.BooleanField(default=False)

    class Meta:
        db_table = 'coupons'

    def __str__(self):
        return self.code

    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False, 'Coupon is inactive.'
        if now < self.valid_from:
            return False, 'Coupon is not yet valid.'
        if now > self.valid_until:
            return False, 'Coupon has expired.'
        if self.usage_limit and self.used_count >= self.usage_limit:
            return False, 'Coupon usage limit reached.'
        return True, None

    def calculate_discount(self, subtotal):
        if self.discount_type == 'PERCENT':
            discount = subtotal * self.discount_value / 100
            if self.max_discount:
                discount = min(discount, self.max_discount)
        else:
            discount = self.discount_value
        return min(discount, subtotal)


class CouponUsage(models.Model):
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'coupon_usages'
        unique_together = ('coupon', 'user')
