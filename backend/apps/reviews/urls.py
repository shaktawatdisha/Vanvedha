from django.urls import path
from .views import ProductReviewListCreateView, ReviewDetailView

urlpatterns = [
    path('products/<slug:slug>/reviews/', ProductReviewListCreateView.as_view(), name='product-reviews'),
    path('<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),
]
