import uuid
from django.core.validators import MinValueValidator
from django.db import models
from mptt.models import MPTTModel, TreeForeignKey
from core.models import TimestampedModel


class Category(MPTTModel, TimestampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True)
    parent = TreeForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')

    class MPTTMeta:
        order_insertion_by = ['name']

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        db_table = 'tags'

    def __str__(self):
        return self.name


class Product(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    sku = models.CharField(max_length=50, unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    tags = models.ManyToManyField(Tag, blank=True)
    description = models.TextField()
    ingredients = models.TextField(blank=True)
    origin = models.CharField(max_length=100, blank=True)
    is_organic = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    review_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return self.name


class ProductVariant(TimestampedModel):
    UNIT_CHOICES = [('g', 'Grams'), ('kg', 'Kilograms'), ('ml', 'Millilitres')]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    weight = models.PositiveIntegerField()
    unit = models.CharField(max_length=5, choices=UNIT_CHOICES, default='g')
    price = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    mrp = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = 'product_variants'
        unique_together = ('product', 'weight', 'unit')

    def __str__(self):
        return f'{self.product.name} - {self.weight}{self.unit}'

    @property
    def discount_percent(self):
        if self.mrp > 0:
            return round((1 - self.price / self.mrp) * 100, 1)
        return 0

    @property
    def is_in_stock(self):
        return self.stock > 0


class ProductImage(TimestampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'product_images'
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.product.name} image'
