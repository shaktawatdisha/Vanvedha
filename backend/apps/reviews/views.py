from rest_framework import generics, permissions
from apps.catalog.models import Product
from core.permissions import IsOwnerOrReadOnly
from .models import Review
from .serializers import ReviewSerializer


class ProductReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(
            product__slug=self.kwargs['slug'],
            is_approved=True,
        ).select_related('user')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['product'] = generics.get_object_or_404(Product, slug=self.kwargs['slug'])
        return ctx

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)
