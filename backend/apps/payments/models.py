import uuid
from django.db import models
from core.models import TimestampedModel
from apps.orders.models import Order


class Payment(TimestampedModel):
    GATEWAY_CHOICES = [
        ('RAZORPAY', 'Razorpay'),
        ('STRIPE', 'Stripe'),
        ('COD', 'Cash on Delivery'),
    ]
    STATUS_CHOICES = [
        ('INITIATED', 'Initiated'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name='payments')
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES)
    gateway_order_id = models.CharField(max_length=100, blank=True)
    gateway_payment_id = models.CharField(max_length=100, blank=True)
    gateway_signature = models.CharField(max_length=300, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=5, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INITIATED')
    raw_response = models.JSONField(default=dict)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payments'

    def __str__(self):
        return f'{self.order.order_number} - {self.gateway} - {self.status}'
