from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory, Shipment


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('id', 'product_name', 'variant_label', 'quantity', 'unit_price', 'total_price')


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ('status', 'note', 'changed_at')


class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = ('carrier', 'tracking_number', 'tracking_url', 'shipped_at', 'delivered_at')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    shipment = ShipmentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'status',
            'subtotal', 'discount_amount', 'shipping_charge', 'tax_amount', 'total_amount',
            'shipping_address', 'notes', 'estimated_delivery',
            'items', 'status_history', 'shipment', 'created_at',
        )


class CreateOrderSerializer(serializers.Serializer):
    shipping_address = serializers.DictField()
    notes = serializers.CharField(required=False, allow_blank=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
