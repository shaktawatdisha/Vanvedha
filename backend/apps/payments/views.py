import hashlib
import hmac
import razorpay
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.orders.models import Order, OrderStatusHistory
from .models import Payment


client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class InitiatePaymentView(APIView):
    def post(self, request):
        order_number = request.data.get('order_number')
        gateway = request.data.get('gateway', 'RAZORPAY')

        order = Order.objects.filter(order_number=order_number, user=request.user).first()
        if not order:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status != 'PENDING':
            return Response({'detail': 'Order is not in pending state.'}, status=status.HTTP_400_BAD_REQUEST)

        if gateway == 'COD':
            payment = Payment.objects.create(
                order=order, gateway='COD',
                amount=order.total_amount, status='SUCCESS',
                paid_at=timezone.now(),
            )
            order.status = 'CONFIRMED'
            order.save()
            OrderStatusHistory.objects.create(order=order, status='CONFIRMED', note='COD order confirmed.')
            return Response({'detail': 'COD order confirmed.', 'order_number': order.order_number})

        # Razorpay
        razorpay_order = client.order.create({
            'amount': int(order.total_amount * 100),  # paise
            'currency': 'INR',
            'receipt': order.order_number,
        })
        Payment.objects.create(
            order=order,
            gateway='RAZORPAY',
            gateway_order_id=razorpay_order['id'],
            amount=order.total_amount,
        )
        return Response({
            'razorpay_order_id': razorpay_order['id'],
            'amount': razorpay_order['amount'],
            'currency': razorpay_order['currency'],
            'key_id': settings.RAZORPAY_KEY_ID,
            'order_number': order.order_number,
        })


class VerifyPaymentView(APIView):
    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        payment = Payment.objects.filter(gateway_order_id=razorpay_order_id).first()
        if not payment:
            return Response({'detail': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Verify HMAC-SHA256 signature
        message = f'{razorpay_order_id}|{razorpay_payment_id}'
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            message.encode(),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, razorpay_signature):
            payment.status = 'FAILED'
            payment.save()
            return Response({'detail': 'Invalid payment signature.'}, status=status.HTTP_400_BAD_REQUEST)

        payment.gateway_payment_id = razorpay_payment_id
        payment.gateway_signature = razorpay_signature
        payment.status = 'SUCCESS'
        payment.paid_at = timezone.now()
        payment.save()

        order = payment.order
        order.status = 'CONFIRMED'
        order.save()
        OrderStatusHistory.objects.create(order=order, status='CONFIRMED', note='Payment verified.')

        return Response({'detail': 'Payment successful.', 'order_number': order.order_number})


@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        webhook_secret = settings.RAZORPAY_KEY_SECRET
        signature = request.headers.get('X-Razorpay-Signature', '')
        body = request.body

        expected = hmac.new(webhook_secret.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        event = request.data.get('event')
        if event == 'payment.captured':
            payment_entity = request.data.get('payload', {}).get('payment', {}).get('entity', {})
            razorpay_order_id = payment_entity.get('order_id')
            payment = Payment.objects.filter(gateway_order_id=razorpay_order_id).first()
            if payment and payment.status != 'SUCCESS':
                payment.status = 'SUCCESS'
                payment.gateway_payment_id = payment_entity.get('id')
                payment.paid_at = timezone.now()
                payment.raw_response = payment_entity
                payment.save()
                order = payment.order
                if order.status == 'PENDING':
                    order.status = 'CONFIRMED'
                    order.save()

        return Response({'status': 'ok'})
