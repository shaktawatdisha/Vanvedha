from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Tag, Product
from .serializers import (
    CategorySerializer, TagSerializer,
    ProductListSerializer, ProductDetailSerializer,
)
from .filters import ProductFilter
from core.permissions import IsAdminOrReadOnly


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(parent=None, is_active=True)


class CategoryDetailView(generics.RetrieveAPIView):
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(is_active=True)
    lookup_field = 'slug'


class TagListView(generics.ListAPIView):
    serializer_class = TagSerializer
    queryset = Tag.objects.all()


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    filterset_class = ProductFilter
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'tags__name']
    ordering_fields = ['avg_rating', 'created_at', 'variants__price']
    ordering = ['-created_at']

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True)
            .select_related('category')
            .prefetch_related('variants', 'images', 'tags')
        )


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True)
            .select_related('category')
            .prefetch_related('variants', 'images', 'tags')
        )


class FeaturedProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True, is_featured=True)
            .select_related('category')
            .prefetch_related('variants', 'images', 'tags')
        )
