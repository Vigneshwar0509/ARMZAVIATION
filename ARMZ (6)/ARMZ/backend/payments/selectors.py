"""
Selector functions for payments app - consolidate payment query logic
Last Updated: April 26, 2026
"""

from django.db.models import QuerySet, Q
from services.models import Plan
from services.utils import build_plan_code
from payments.models import PaymentTransaction, PaymentOrder, Subscription


# ============================================================================
# PLAN SELECTORS (Consolidates _resolve_plan logic)
# ============================================================================

def plan_by_identifier(plan_id):
    """
    Get plan by multiple identifier types: ID, razorpay_plan_id, name, or normalized plan code.
    This consolidates the plan resolution logic used by payments.
    """
    if not plan_id:
        return None

    plan_id_str = str(plan_id).strip()
    if not plan_id_str:
        return None

    # Try numeric ID first
    if plan_id_str.isdigit():
        plan = Plan.objects.filter(id=int(plan_id_str)).first()
        if plan:
            return plan

    # Try razorpay_plan_id (case-insensitive)
    plan = Plan.objects.filter(razorpay_plan_id__iexact=plan_id_str).first()
    if plan:
        return plan

    # Try plan name (case-insensitive)
    plan = Plan.objects.filter(name__iexact=plan_id_str).first()
    if plan:
        return plan

    # Try normalized plan code derived from the plan name
    normalized_plan_id = build_plan_code(plan_id_str)
    for plan in Plan.objects.all():
        if build_plan_code(plan.name) == normalized_plan_id:
            return plan

    return None


def plan_by_id(plan_id: int) -> Plan | None:
    """Get plan by ID"""
    return Plan.objects.filter(id=plan_id).first()


def active_plans() -> QuerySet[Plan]:
    """Get all active plans"""
    return Plan.objects.filter(is_active=True).order_by("price")


# ============================================================================
# PAYMENT TRANSACTION SELECTORS (Consolidates duplicates at lines 384, 450)
# ============================================================================

def payment_transactions_queryset() -> QuerySet[PaymentTransaction]:
    """
    Get non-deleted payment transactions, most recent first
    Includes order and user details to prevent N+1 queries
    """
    return PaymentTransaction.objects.filter(is_deleted=False).select_related(
        "order", "order__user", "order__plan"
    ).order_by("-created_at")


def payment_transaction_by_payment_id(payment_id: str) -> PaymentTransaction | None:
    """Get transaction by Razorpay payment ID with order details"""
    return PaymentTransaction.objects.select_related("order").filter(
        razorpay_payment_id=payment_id
    ).first()


def payment_transaction_by_id(transaction_id: int) -> PaymentTransaction | None:
    """Get transaction by ID with full details"""
    return PaymentTransaction.objects.select_related(
        "order__user", "order__plan"
    ).filter(id=transaction_id).first()


# ============================================================================
# PAYMENT ORDER SELECTORS
# ============================================================================

def payment_order_by_razorpay_id(order_id: str) -> PaymentOrder | None:
    """Get payment order by Razorpay order ID with user and plan"""
    return PaymentOrder.objects.select_related("user", "plan").filter(
        razorpay_order_id=order_id
    ).first()


def payment_order_by_id(order_id: int) -> PaymentOrder | None:
    """Get payment order by ID with user and plan"""
    return PaymentOrder.objects.select_related("user", "plan").filter(
        id=order_id
    ).first()


def payment_orders_by_user(user_id: int) -> QuerySet[PaymentOrder]:
    """Get all payment orders for user, most recent first"""
    return PaymentOrder.objects.select_related("plan").filter(
        user_id=user_id
    ).order_by("-created_at")


# ============================================================================
# SUBSCRIPTION SELECTORS (Optimizes line 490)
# ============================================================================

def subscriptions_queryset() -> QuerySet[Subscription]:
    """
    Get non-deleted subscriptions, most recent first
    Includes user and plan details to prevent N+1 queries
    """
    return Subscription.objects.filter(is_deleted=False).select_related(
        "user", "plan"
    ).order_by("-created_at")


def subscription_by_razorpay_id(subscription_id: str) -> Subscription | None:
    """Get subscription by Razorpay subscription ID with user/plan"""
    return Subscription.objects.select_related("user", "plan").filter(
        razorpay_subscription_id=subscription_id
    ).first()


def subscription_by_id(subscription_id: int) -> Subscription | None:
    """Get subscription by ID with user/plan"""
    return Subscription.objects.select_related("user", "plan").filter(
        id=subscription_id
    ).first()


def subscriptions_by_user(user_id: int) -> QuerySet[Subscription]:
    """Get all subscriptions for user, most recent first"""
    return Subscription.objects.select_related("plan").filter(
        user_id=user_id
    ).order_by("-created_at")
