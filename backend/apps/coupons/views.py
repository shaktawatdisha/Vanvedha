from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Coupon
from . import services as coupon_services


class ValidateCouponView(APIView):
    def post(self, request):
        code = request.data.get('coupon_code', '').strip().upper()
        subtotal = request.data.get('subtotal', 0)
        result = coupon_services.validate_coupon(code, request.user, float(subtotal))
        if result['valid']:
            return Response(result)
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
