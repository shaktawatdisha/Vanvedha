from django.urls import path
from .views import (
    CategoryListView, CategoryDetailView, TagListView,
    ProductListView, ProductDetailView, FeaturedProductListView,
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('categories/<slug:slug>/', CategoryDetailView.as_view(), name='category-detail'),
    path('tags/', TagListView.as_view(), name='tag-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/featured/', FeaturedProductListView.as_view(), name='product-featured'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
]
