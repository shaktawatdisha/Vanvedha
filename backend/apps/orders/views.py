from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from core.exceptions import InsufficientStockError
from core.permissions import IsOwner
from .models import Order
from .serializers import OrderSerializer, CreateOrderSerializer
from . import services


class OrderListCreateView(generics.ListAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items', 'status_history', 'shipment')

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            order = services.create_order(
                request,
                shipping_address_data=serializer.validated_data['shipping_address'],
                notes=serializer.validated_data.get('notes', ''),
                coupon_code=serializer.validated_data.get('coupon_code'),
            )
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        except InsufficientStockError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items', 'status_history', 'shipment')

    lookup_field = 'order_number'


class CancelOrderView(APIView):
    def post(self, request, order_number):
        order = generics.get_object_or_404(Order, order_number=order_number, user=request.user)
        if order.status not in ('PENDING', 'CONFIRMED'):
            return Response({'detail': 'Order cannot be cancelled at this stage.'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = 'CANCELLED'
        order.save()
        from .models import OrderStatusHistory
        OrderStatusHistory.objects.create(order=order, status='CANCELLED', note='Cancelled by customer.', changed_by=request.user)
        return Response(OrderSerializer(order).data)
