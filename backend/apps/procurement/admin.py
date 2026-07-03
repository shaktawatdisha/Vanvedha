from django.contrib import admin
from .models import Supplier, RawMaterialLot, ProcessingBatch, ProcessingBatchRawUsage


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display  = ('name', 'phone', 'created_at')
    search_fields = ('name', 'phone')


class RawUsageInline(admin.TabularInline):
    model  = ProcessingBatchRawUsage
    extra  = 1
    fields = ('raw_lot', 'quantity_used_kg')


@admin.register(RawMaterialLot)
class RawMaterialLotAdmin(admin.ModelAdmin):
    list_display   = ('barcode', 'supplier', 'spice_type', 'quantity_kg', 'quantity_remaining_kg', 'purchase_date')
    list_filter    = ('spice_type', 'supplier')
    search_fields  = ('barcode', 'notes')
    readonly_fields = ('barcode', 'quantity_remaining_kg')


@admin.register(ProcessingBatch)
class ProcessingBatchAdmin(admin.ModelAdmin):
    list_display   = ('barcode', 'output_variant', 'output_quantity_kg', 'output_units', 'processed_date', 'status')
    list_filter    = ('status',)
    search_fields  = ('barcode', 'notes')
    readonly_fields = ('barcode', 'status')
    inlines        = [RawUsageInline]
