from django.urls import path
from .views import WishlistView, WishlistToggleView

urlpatterns = [
    path('', WishlistView.as_view(), name='wishlist'),
    path('<slug:slug>/toggle/', WishlistToggleView.as_view(), name='wishlist-toggle'),
]
