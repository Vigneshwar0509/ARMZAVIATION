from django.urls import path

from payments.views import (
    AdminPaymentsView,
    AdminSubscriptionDeleteView,
    AdminSubscriptionStatusView,
    AdminSubscriptionsView,
    CancelSubscriptionView,
    CreateOrderView,
    CreateSubscriptionView,
    PaymentHistoryView,
    PlanChangeView,
    SubscriptionDetailView,
    VerifyPaymentView,
)
from payments.webhooks import RazorpayWebhookView

urlpatterns = [
    path("payments/create-order", CreateOrderView.as_view()),
    path("payments/verify", VerifyPaymentView.as_view()),
    path("payments/create-subscription", CreateSubscriptionView.as_view()),
    path("payments/history", PaymentHistoryView.as_view()),
    path("payments/cancel-subscription", CancelSubscriptionView.as_view()),
    path("payments/subscription/<int:subscription_id>", SubscriptionDetailView.as_view()),
    path("payments/plan-change", PlanChangeView.as_view()),
    path("payments/webhook/razorpay", RazorpayWebhookView.as_view(), name="razorpay-webhook"),
    path("admin/payments", AdminPaymentsView.as_view()),
    path("admin/subscriptions", AdminSubscriptionsView.as_view()),
    path("admin/subscriptions/<int:subscription_id>/status", AdminSubscriptionStatusView.as_view()),
    path("admin/subscriptions/<int:subscription_id>", AdminSubscriptionDeleteView.as_view()),
]
