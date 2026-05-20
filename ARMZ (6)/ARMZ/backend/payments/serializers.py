from rest_framework import serializers
from decimal import Decimal

from payments.models import PaymentOrder, PaymentTransaction, Subscription
from payments.selectors import plan_by_identifier


class PaymentOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentOrder
        fields = "__all__"
        read_only_fields = ("razorpay_order_id", "idempotency_key", "created_at", "updated_at", "created_by", "is_deleted")


class PaymentTransactionSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user.id', read_only=True)
    userName = serializers.SerializerMethodField()
    userEmail = serializers.EmailField(source='user.email', read_only=True)
    planId = serializers.IntegerField(source='plan.id', read_only=True, allow_null=True)
    planName = serializers.SerializerMethodField()
    orderId = serializers.CharField(source='order.razorpay_order_id', read_only=True, allow_null=True)
    paymentId = serializers.CharField(source='razorpay_payment_id', read_only=True, allow_blank=True)
    amountFormatted = serializers.SerializerMethodField()
    paymentMethod = serializers.CharField(source='payment_method', allow_blank=True, read_only=True)
    transactionDate = serializers.DateTimeField(source='created_at', format="%Y-%m-%d %H:%M:%S", read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', format="%Y-%m-%dT%H:%M:%S.%fZ", read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = PaymentTransaction
        fields = "__all__"
        read_only_fields = ("razorpay_payment_id", "razorpay_signature", "created_at", "updated_at", "modified_by", "is_deleted")

    def get_userName(self, obj):
        full_name = obj.user.get_full_name() if hasattr(obj.user, 'get_full_name') else ''
        return full_name or getattr(obj.user, 'username', '') or getattr(obj.user, 'email', '')

    def get_planName(self, obj):
        return obj.plan.name if obj.plan else 'Free'

    def get_amountFormatted(self, obj):
        try:
            amount = obj.amount or 0
            return f"₹{amount:,.2f}"
        except Exception:
            return str(obj.amount or "₹0")

    def get_status(self, obj):
        return str(obj.status).title()


class SubscriptionSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user.id', read_only=True)
    userName = serializers.SerializerMethodField()
    userEmail = serializers.EmailField(source='user.email', read_only=True)
    planId = serializers.IntegerField(source='plan.id', read_only=True, allow_null=True)
    planName = serializers.SerializerMethodField()
    amountFormatted = serializers.SerializerMethodField()
    paymentMethod = serializers.CharField(source='payment_method', allow_blank=True, read_only=True)
    autoRenew = serializers.BooleanField(source='auto_renew', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', format="%Y-%m-%dT%H:%M:%S.%fZ", read_only=True)
    startDate = serializers.DateField(source='start_date', format="%Y-%m-%d", allow_null=True, read_only=True)
    endDate = serializers.DateField(source='end_date', format="%Y-%m-%d", allow_null=True, read_only=True)
    renewalDate = serializers.DateField(source='renewal_date', format="%Y-%m-%d", allow_null=True, read_only=True)

    class Meta:
        model = Subscription
        fields = "__all__"
        read_only_fields = ("razorpay_subscription_id", "created_at", "updated_at", "modified_by", "is_deleted")

    def get_userName(self, obj):
        full_name = obj.user.get_full_name() if hasattr(obj.user, 'get_full_name') else ''
        return full_name or getattr(obj.user, 'username', '') or getattr(obj.user, 'email', '')

    def get_planName(self, obj):
        return obj.plan.name if obj.plan else 'Free'

    def get_amountFormatted(self, obj):
        try:
            amount = obj.amount or 0
            return f"₹{amount:,.2f}"
        except Exception:
            return str(obj.amount or "₹0")


class CreateOrderSerializer(serializers.Serializer):
    planId = serializers.CharField(required=True)
    currency = serializers.ChoiceField(choices=["INR", "USD", "EUR"], default="INR")
    idempotencyKey = serializers.CharField(required=False, allow_blank=True)
    
    def validate_planId(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError("Plan ID cannot be empty")

        if not plan_by_identifier(value):
            raise serializers.ValidationError("Plan not found")

        return value


class VerifyPaymentSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(required=False, allow_blank=True)
    razorpay_payment_id = serializers.CharField(required=True, allow_blank=False)
    razorpay_signature = serializers.CharField(required=False, allow_blank=True)
    order_id = serializers.CharField(required=False, allow_blank=True)
    local_order_id = serializers.CharField(required=False, allow_blank=True)
    planId = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Strictly validate required verification identifiers."""
        if not str(data.get("razorpay_payment_id", "")).strip():
            raise serializers.ValidationError("razorpay_payment_id is required")

        has_order_reference = any([
            str(data.get("razorpay_order_id", "")).strip(),
            str(data.get("order_id", "")).strip(),
            str(data.get("local_order_id", "")).strip(),
        ])
        if not has_order_reference:
            raise serializers.ValidationError(
                "One of razorpay_order_id, order_id, or local_order_id is required"
            )
        return data


class CreateSubscriptionSerializer(serializers.Serializer):
    planId = serializers.CharField(required=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    currency = serializers.ChoiceField(choices=["INR", "USD", "EUR"], default="INR")
    interval = serializers.ChoiceField(choices=["monthly", "yearly"], required=False)
    
    def validate_amount(self, value):
        if value <= Decimal("0"):
            raise serializers.ValidationError("Amount must be greater than 0")
        return value
    
    def validate_planId(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError("Plan ID cannot be empty")
        return value


class CancelSubscriptionSerializer(serializers.Serializer):
    subscriptionId = serializers.IntegerField(required=True)
    
    def validate_subscriptionId(self, value):
        if value <= 0:
            raise serializers.ValidationError("Subscription ID must be positive")
        return value
