from rest_framework import serializers
from .models import Supplier, RawMaterialLot, ProcessingBatch, ProcessingBatchRawUsage


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = ('id', 'name', 'phone', 'address', 'created_at')


class RawMaterialLotSerializer(serializers.ModelSerializer):
    supplier_name     = serializers.CharField(source='supplier.name', read_only=True)
    spice_type_label  = serializers.CharField(source='get_spice_type_display', read_only=True)

    class Meta:
        model  = RawMaterialLot
        fields = (
            'id', 'supplier', 'supplier_name',
            'spice_type', 'spice_type_label',
            'quantity_kg', 'quantity_remaining_kg',
            'price_per_kg', 'purchase_date',
            'barcode', 'notes', 'created_at',
        )
        read_only_fields = ('barcode', 'quantity_remaining_kg')


class ProcessingBatchRawUsageSerializer(serializers.ModelSerializer):
    lot_barcode   = serializers.CharField(source='raw_lot.barcode', read_only=True)
    lot_spice     = serializers.CharField(source='raw_lot.get_spice_type_display', read_only=True)
    lot_remaining = serializers.DecimalField(source='raw_lot.quantity_remaining_kg', max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model  = ProcessingBatchRawUsage
        fields = ('id', 'raw_lot', 'lot_barcode', 'lot_spice', 'lot_remaining', 'quantity_used_kg')


class ProcessingBatchSerializer(serializers.ModelSerializer):
    raw_usages          = ProcessingBatchRawUsageSerializer(many=True)
    variant_name        = serializers.SerializerMethodField()
    status_label        = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = ProcessingBatch
        fields = (
            'id', 'output_variant', 'variant_name',
            'output_quantity_kg', 'output_units',
            'processed_date', 'status', 'status_label',
            'barcode', 'notes', 'raw_usages', 'created_at',
        )
        read_only_fields = ('barcode', 'status')

    def get_variant_name(self, obj):
        v = obj.output_variant
        return f"{v.product.name} — {v.weight}{v.unit}"

    def create(self, validated_data):
        usages_data = validated_data.pop('raw_usages')
        batch = ProcessingBatch.objects.create(**validated_data)
        for u in usages_data:
            ProcessingBatchRawUsage.objects.create(batch=batch, **u)
        return batch

    def update(self, instance, validated_data):
        if instance.status == 'CONFIRMED':
            raise serializers.ValidationError('A confirmed batch cannot be edited.')
        usages_data = validated_data.pop('raw_usages', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if usages_data is not None:
            instance.raw_usages.all().delete()
            for u in usages_data:
                ProcessingBatchRawUsage.objects.create(batch=instance, **u)
        return instance
