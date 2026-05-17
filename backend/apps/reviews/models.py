from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from core.models import TimestampedModel
from apps.accounts.models import User
from apps.catalog.models import Product
from apps.orders.models import Order


class Review(TimestampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200)
    body = models.TextField()
    is_approved = models.BooleanField(default=False)

    class Meta:
        db_table = 'reviews'
        unique_together = ('product', 'user')

    def __str__(self):
        return f'{self.user.email} - {self.product.name} ({self.rating}★)'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self._update_product_rating()

    def _update_product_rating(self):
        from django.db.models import Avg, Count
        stats = Review.objects.filter(product=self.product, is_approved=True).aggregate(
            avg=Avg('rating'), count=Count('id')
        )
        Product.objects.filter(id=self.product_id).update(
            avg_rating=stats['avg'] or 0,
            review_count=stats['count'],
        )
