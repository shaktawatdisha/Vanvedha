from django.db import models
from core.models import TimestampedModel
from apps.accounts.models import User
from apps.catalog.models import Product


class WishlistItem(TimestampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    class Meta:
        db_table = 'wishlist_items'
        unique_together = ('user', 'product')

    def __str__(self):
        return f'{self.user.email} - {self.product.name}'
