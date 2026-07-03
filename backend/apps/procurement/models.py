import uuid
from django.core.validators import MinValueValidator
from django.db import models
from core.models import TimestampedModel


def _barcode(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"


class Supplier(TimestampedModel):
    name    = models.CharField(max_length=150)
    phone   = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)

    class Meta:
        db_table = 'procurement_suppliers'
        ordering = ['name']

    def __str__(self):
        return self.name


class RawMaterialLot(TimestampedModel):
    SPICE_CHOICES = [
        ('CHILLI',    'Chilli'),
        ('TURMERIC',  'Turmeric'),
        ('CORIANDER', 'Coriander'),
        ('OTHER',     'Other'),
    ]

    supplier               = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='lots')
    spice_type             = models.CharField(max_length=20, choices=SPICE_CHOICES)
    quantity_kg            = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    quantity_remaining_kg  = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    price_per_kg           = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    purchase_date          = models.DateField()
    barcode                = models.CharField(max_length=50, unique=True)
    notes                  = models.TextField(blank=True)

    class Meta:
        db_table = 'procurement_raw_lots'
        ordering = ['-purchase_date']

    def save(self, *args, **kwargs):
        if not self.barcode:
            self.barcode = _barcode('RAW')
        if not self.pk:
            self.quantity_remaining_kg = self.quantity_kg
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.barcode} — {self.get_spice_type_display()} {self.quantity_kg}kg"


class ProcessingBatch(TimestampedModel):
    STATUS_CHOICES = [('PENDING', 'Pending'), ('CONFIRMED', 'Confirmed')]

    output_variant     = models.ForeignKey(
        'catalog.ProductVariant', on_delete=models.PROTECT, related_name='processing_batches'
    )
    output_quantity_kg = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    output_units       = models.PositiveIntegerField(help_text='Number of packs produced — added to variant stock on confirm')
    processed_date     = models.DateField()
    status             = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    barcode            = models.CharField(max_length=50, unique=True)
    notes              = models.TextField(blank=True)

    class Meta:
        db_table = 'procurement_processing_batches'
        ordering = ['-processed_date']

    def save(self, *args, **kwargs):
        if not self.barcode:
            self.barcode = _barcode('FIN')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.barcode} — {self.output_variant} ({self.status})"


class ProcessingBatchRawUsage(models.Model):
    batch            = models.ForeignKey(ProcessingBatch, on_delete=models.CASCADE, related_name='raw_usages')
    raw_lot          = models.ForeignKey(RawMaterialLot, on_delete=models.PROTECT, related_name='usages')
    quantity_used_kg = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        db_table = 'procurement_batch_raw_usages'
        unique_together = ('batch', 'raw_lot')

    def __str__(self):
        return f"{self.batch.barcode} used {self.quantity_used_kg}kg from {self.raw_lot.barcode}"
