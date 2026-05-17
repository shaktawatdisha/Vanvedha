from django.db import models
from core.models import TimestampedModel
from apps.accounts.models import User
from apps.catalog.models import ProductVariant


class CartItem(TimestampedModel):
    """Persisted cart for authenticated users (Redis is primary, this is backup)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'cart_items'
        unique_together = ('user', 'variant')

    def __str__(self):
        return f'{self.user.email} - {self.variant}'
