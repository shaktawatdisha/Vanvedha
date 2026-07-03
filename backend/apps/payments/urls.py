from django.urls import path
from .views import (
    InitiatePaymentView, VerifyPaymentView, RazorpayWebhookView,
    VerifyStripePaymentView, StripeWebhookView,
)

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('verify/', VerifyPaymentView.as_view(), name='payment-verify'),
    path('verify/stripe/', VerifyStripePaymentView.as_view(), name='stripe-verify'),
    path('webhook/razorpay/', RazorpayWebhookView.as_view(), name='razorpay-webhook'),
    path('webhook/stripe/', StripeWebhookView.as_view(), name='stripe-webhook'),
]
