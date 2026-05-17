from django.urls import path
from .views import OrderListCreateView, OrderDetailView, CancelOrderView

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'),
    path('<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),
    path('<str:order_number>/cancel/', CancelOrderView.as_view(), name='order-cancel'),
]
