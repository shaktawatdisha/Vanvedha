from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from . import services


class CartView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(services.get_cart(request))


class CartItemView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        variant_id = request.data.get('variant_id')
        quantity = int(request.data.get('quantity', 1))
        if not variant_id or quantity < 1:
            return Response({'detail': 'variant_id and quantity are required.'}, status=status.HTTP_400_BAD_REQUEST)
        services.add_item(request, variant_id, quantity)
        return Response(services.get_cart(request), status=status.HTTP_201_CREATED)

    def patch(self, request, variant_id):
        quantity = int(request.data.get('quantity', 1))
        services.update_item(request, variant_id, quantity)
        return Response(services.get_cart(request))

    def delete(self, request, variant_id):
        services.remove_item(request, variant_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartClearView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request):
        services.clear_cart(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartMergeView(APIView):
    def post(self, request):
        session_key = request.data.get('session_key')
        if session_key:
            services.merge_carts(request, session_key)
        return Response(services.get_cart(request))


class CartCouponView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('coupon_code', '').strip().upper()
        if not code:
            return Response({'detail': 'coupon_code is required.'}, status=status.HTTP_400_BAD_REQUEST)
        services.apply_coupon(request, code)
        return Response(services.get_cart(request))

    def delete(self, request):
        services.remove_coupon(request)
        return Response(services.get_cart(request))
