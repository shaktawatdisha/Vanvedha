import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('catalog', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Supplier',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active',  models.BooleanField(default=True)),
                ('name',       models.CharField(max_length=150)),
                ('phone',      models.CharField(blank=True, max_length=15)),
                ('address',    models.TextField(blank=True)),
            ],
            options={'db_table': 'procurement_suppliers', 'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='RawMaterialLot',
            fields=[
                ('id',                    models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at',            models.DateTimeField(auto_now_add=True)),
                ('updated_at',            models.DateTimeField(auto_now=True)),
                ('is_active',             models.BooleanField(default=True)),
                ('spice_type',            models.CharField(choices=[('CHILLI','Chilli'),('TURMERIC','Turmeric'),('CORIANDER','Coriander'),('OTHER','Other')], max_length=20)),
                ('quantity_kg',           models.DecimalField(decimal_places=2, max_digits=8, validators=[django.core.validators.MinValueValidator(0)])),
                ('quantity_remaining_kg', models.DecimalField(decimal_places=2, max_digits=8, validators=[django.core.validators.MinValueValidator(0)])),
                ('price_per_kg',          models.DecimalField(decimal_places=2, max_digits=8, validators=[django.core.validators.MinValueValidator(0)])),
                ('purchase_date',         models.DateField()),
                ('barcode',               models.CharField(max_length=50, unique=True)),
                ('notes',                 models.TextField(blank=True)),
                ('supplier',              models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='lots', to='procurement.supplier')),
            ],
            options={'db_table': 'procurement_raw_lots', 'ordering': ['-purchase_date']},
        ),
        migrations.CreateModel(
            name='ProcessingBatch',
            fields=[
                ('id',                 models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at',         models.DateTimeField(auto_now_add=True)),
                ('updated_at',         models.DateTimeField(auto_now=True)),
                ('is_active',          models.BooleanField(default=True)),
                ('output_quantity_kg', models.DecimalField(decimal_places=2, max_digits=8, validators=[django.core.validators.MinValueValidator(0)])),
                ('output_units',       models.PositiveIntegerField()),
                ('processed_date',     models.DateField()),
                ('status',             models.CharField(choices=[('PENDING','Pending'),('CONFIRMED','Confirmed')], default='PENDING', max_length=10)),
                ('barcode',            models.CharField(max_length=50, unique=True)),
                ('notes',              models.TextField(blank=True)),
                ('output_variant',     models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='processing_batches', to='catalog.productvariant')),
            ],
            options={'db_table': 'procurement_processing_batches', 'ordering': ['-processed_date']},
        ),
        migrations.CreateModel(
            name='ProcessingBatchRawUsage',
            fields=[
                ('id',               models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity_used_kg', models.DecimalField(decimal_places=2, max_digits=8, validators=[django.core.validators.MinValueValidator(0)])),
                ('batch',   models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='raw_usages', to='procurement.processingbatch')),
                ('raw_lot', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='usages', to='procurement.rawmateriallot')),
            ],
            options={
                'db_table':        'procurement_batch_raw_usages',
                'unique_together': {('batch', 'raw_lot')},
            },
        ),
    ]
