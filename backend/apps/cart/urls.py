from django.urls import path
from .views import CartView, CartItemView, CartClearView, CartMergeView, CartCouponView

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('items/', CartItemView.as_view(), name='cart-item-add'),
    path('items/<str:variant_id>/', CartItemView.as_view(), name='cart-item-detail'),
    path('clear/', CartClearView.as_view(), name='cart-clear'),
    path('merge/', CartMergeView.as_view(), name='cart-merge'),
    path('coupon/', CartCouponView.as_view(), name='cart-coupon'),
]
