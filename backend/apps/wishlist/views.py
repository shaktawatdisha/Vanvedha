from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.catalog.models import Product
from apps.catalog.serializers import ProductListSerializer
from .models import WishlistItem


class WishlistView(generics.ListAPIView):
    serializer_class = ProductListSerializer

    def get_queryset(self):
        product_ids = WishlistItem.objects.filter(user=self.request.user).values_list('product_id', flat=True)
        return Product.objects.filter(id__in=product_ids).prefetch_related('variants', 'images', 'tags')


class WishlistToggleView(APIView):
    def post(self, request, slug):
        product = generics.get_object_or_404(Product, slug=slug)
        item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
        if not created:
            item.delete()
            return Response({'status': 'removed'})
        return Response({'status': 'added'}, status=status.HTTP_201_CREATED)
