from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from datetime import date, timedelta

from services.models import Plan


class PaymentOrder(models.Model):
    STATUS_CHOICES = (("created", "Created"), ("paid", "Paid"), ("failed", "Failed"))
    CURRENCY_CHOICES = (("INR", "Indian Rupee"), ("USD", "US Dollar"), ("EUR", "Euro"))

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payment_orders")
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, null=True, blank=True, related_name="payment_orders")
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Amount in paise")
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default="INR")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="created")
    razorpay_order_id = models.CharField(max_length=120, blank=True, db_index=True, unique=True)
    idempotency_key = models.CharField(max_length=255, blank=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="payment_orders_created", editable=False)

    class Meta:
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]

    def validate_status_transition(self, new_status):
        """Validate allowed status transitions"""
        # Determine the current (existing) status from the database when possible
        current_status = None
        if self.pk:
            try:
                current_status = PaymentOrder.objects.get(pk=self.pk).status
            except PaymentOrder.DoesNotExist:
                current_status = None

        valid_transitions = {
            'created': ['paid', 'failed'],
            'paid': [],
            'failed': ['created', 'paid'],  # Allow retry and successful verification recovery
        }

        # If we don't have a recorded current status, allow creation to any valid state
        allowed = valid_transitions.get(current_status, valid_transitions.get('created', []))
        if new_status not in allowed:
            raise ValidationError(f"Cannot transition from {current_status} to {new_status}")

    def save(self, *args, **kwargs):
        if self.pk and self.status != PaymentOrder.objects.get(pk=self.pk).status:
            self.validate_status_transition(self.status)
        super().save(*args, **kwargs)


class PaymentTransaction(models.Model):
    STATUS_CHOICES = (("success", "Success"), ("failed", "Failed"), ("pending", "Pending"))
    CURRENCY_CHOICES = (("INR", "Indian Rupee"), ("USD", "US Dollar"), ("EUR", "Euro"))

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payment_transactions")
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, null=True, blank=True, related_name="payment_transactions")
    order = models.ForeignKey(PaymentOrder, on_delete=models.CASCADE, null=True, blank=True, related_name="transactions")
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default="INR")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    payment_method = models.CharField(max_length=50, blank=True)
    razorpay_payment_id = models.CharField(max_length=120, blank=True, db_index=True, unique=True)
    razorpay_signature = models.CharField(max_length=255, blank=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    modified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="payment_transactions_modified", editable=False)

    class Meta:
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['razorpay_payment_id']),
        ]


class Subscription(models.Model):
    STATUS_CHOICES = (
        ("active", "Active"),
        ("pending", "Pending"),
        ("cancelled", "Cancelled"),
        ("expired", "Expired"),
    )
    CURRENCY_CHOICES = (("INR", "Indian Rupee"), ("USD", "US Dollar"), ("EUR", "Euro"))

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, null=True, blank=True, related_name="subscriptions")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    renewal_date = models.DateField(null=True, blank=True)
    auto_renew = models.BooleanField(default=False)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default="INR")
    payment_method = models.CharField(max_length=50, blank=True)
    razorpay_subscription_id = models.CharField(max_length=120, blank=True, db_index=True, unique=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    modified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="subscriptions_modified", editable=False)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', '-created_at']),
        ]
        unique_together = [['user', 'plan']]

    def clean(self):
        """Validate subscription state"""
        if self.status == 'active':
            if not self.start_date or not self.end_date or not self.renewal_date:
                raise ValidationError("Active subscriptions must have start_date, end_date, and renewal_date")
            if self.start_date > self.end_date:
                raise ValidationError("start_date cannot be after end_date")
            if self.renewal_date < self.end_date:
                raise ValidationError("renewal_date should be after end_date")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
