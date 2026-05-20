"""
Business logic for payments app
"""

import logging
import time
from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.utils import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import serializers as drf_serializers
from rest_framework.exceptions import APIException, PermissionDenied

from accounts.models import User
from payments.models import PaymentOrder, PaymentTransaction, Subscription
from payments.selectors import plan_by_identifier, payment_transactions_queryset, subscriptions_queryset
from payments.serializers import PaymentTransactionSerializer, SubscriptionSerializer
from payments.utils import verify_razorpay_signature
from services.models import Plan
from services.email_service import send_payment_receipt_email
from services.notification_dispatch import send_direct_notification
from services.utils import build_plan_code

logger = logging.getLogger(__name__)


def _client_or_none():
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        try:
            import razorpay
            return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        except Exception:
            return None


def _ensure_payment_gateway_configured():
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        return
    if settings.DEBUG:
        return
    raise PermissionDenied("Payment gateway is not configured.")


def resolve_plan(plan_id):
    """Resolve plan by ID, razorpay_plan_id, name, or normalized plan code."""
    return plan_by_identifier(plan_id)


def calculate_subscription_dates(plan):
    """Calculate subscription start, end, and renewal dates"""
    start = date.today()
    interval = getattr(plan, 'interval', 'monthly') or 'monthly'
    if interval == 'yearly':
        end = start + timedelta(days=365)
    else:
        end = start + timedelta(days=30)
    renewal = end
    return start, end, renewal


def sync_user_subscription(user, plan):
    """Sync user subscription to profile"""
    try:
        profile = getattr(user, 'profile', None)
        if profile:
            setattr(profile, 'subscription', getattr(plan, 'code', None) or getattr(plan, 'name', None))
            profile.save()
    except Exception:
        logger.debug('Could not sync user subscription to profile', exc_info=True)


def build_local_subscription_reference(user_id, plan_id):
    """Build local subscription reference"""
    return f"sub_local_{user_id}_{plan_id or 'na'}"


def ensure_subscription_access(request_or_user, subscription):
    """Ensure user has access to subscription.

    Accepts either a `request` with `.user`, a `user` object, or a dict containing `user`.
    """
    user = None
    # Request-like object
    if hasattr(request_or_user, "user"):
        user = request_or_user.user
    # User instance passed directly
    elif hasattr(request_or_user, "id") or hasattr(request_or_user, "pk"):
        user = request_or_user
    # Dict containing 'user'
    elif isinstance(request_or_user, dict):
        user = request_or_user.get("user")

    if not user:
        raise PermissionDenied("Authentication required")

    if subscription.user_id != getattr(user, "id", None) and not getattr(user, "is_admin_user", False):
        raise PermissionDenied("You do not have permission to access this subscription.")


def create_payment_order(user, plan_id, currency='INR'):
    """Create a payment order"""
    _ensure_payment_gateway_configured()
    plan = resolve_plan(plan_id)
    if not plan:
        raise ValueError("Plan not found")

    amount = getattr(plan, 'final_price', None)
    if amount is None:
        amount = getattr(plan, 'price', Decimal('0'))
    amount_in_paise = int((amount or Decimal('0')) * Decimal('100'))

    client = _client_or_none()
    razorpay_order_id = None
    if client:
        try:
            razor_order = client.order.create({
                'amount': amount_in_paise,
                'currency': currency,
                'receipt': f'user-{user.id}-{int(time.time())}',
            })
            razorpay_order_id = razor_order.get('id') or razor_order.get('order_id')
        except Exception:
            logger.exception('Failed to create razorpay order')

    if not razorpay_order_id:
        razorpay_order_id = f'order_local_{int(time.time())}'

    order = PaymentOrder.objects.create(
        user=user,
        plan=plan,
        amount=amount,
        currency=currency,
        status='created',
        razorpay_order_id=razorpay_order_id,
        created_by=user,
    )

    return {
        'id': order.razorpay_order_id,
        'local_id': order.id,
        'razorpay_order_id': order.razorpay_order_id,
        'amount': float(order.amount),
        'currency': order.currency,
        'planId': str(order.plan.id) if order.plan else "",
        'userId': str(order.user.id),
        'status': order.status,
        'createdAt': order.created_at.isoformat() if order.created_at else "",
    }


@transaction.atomic
def verify_payment(user, data):
    """Verify payment with atomic transaction"""
    _ensure_payment_gateway_configured()

    rzp_order_id = str(data.get("razorpay_order_id") or "").strip()
    payment_id = str(data.get("razorpay_payment_id") or "").strip()
    signature = str(data.get("razorpay_signature") or "").strip()
    local_id = str(data.get("order_id") or data.get("local_order_id") or "").strip()

    # Check for existing transaction
    existing_txn = PaymentTransaction.objects.select_related("order").filter(
        razorpay_payment_id=payment_id
    ).first()
    if existing_txn:
        if existing_txn.status == "success":
            return {
                "success": True,
                "paymentId": payment_id,
                "orderId": existing_txn.order.razorpay_order_id if existing_txn.order else rzp_order_id,
                "status": "captured",
                "message": "Payment already verified",
            }
        return {
            "success": False,
            "paymentId": payment_id,
            "status": "failed",
            "message": "Payment already marked as failed",
        }

    # Find order
    order = None
    if rzp_order_id:
        order = PaymentOrder.objects.select_for_update().filter(razorpay_order_id=rzp_order_id).first()

    if not order and local_id:
        if local_id.isdigit():
            order = PaymentOrder.objects.select_for_update().filter(id=int(local_id)).first()
        else:
            order = PaymentOrder.objects.select_for_update().filter(razorpay_order_id=local_id).first()

    # Create debug order if needed
    if not order and settings.DEBUG:
        plan = resolve_plan(data.get("planId"))
        if plan:
            fallback_amount = getattr(plan, 'final_price', None) or plan.price
            order = PaymentOrder.objects.create(
                user=user,
                plan=plan,
                amount=fallback_amount,
                currency="INR",
                status="created",
                razorpay_order_id=rzp_order_id or f"debug_{int(time.time())}",
                created_by=user,
            )

    if not order:
        logger.warning(
            "Payment verification rejected: order not found. payment_id=%s rzp_order_id=%s local_id=%s user=%s",
            payment_id, rzp_order_id, local_id, user.id,
        )
        raise ValueError("Order reference is invalid")

    if order.user_id != user.id and not user.is_admin_user:
        raise PermissionDenied("You do not have permission to verify this payment")

    if order.status == "paid":
        return {
            "success": True,
            "paymentId": payment_id,
            "orderId": order.razorpay_order_id,
            "status": "captured",
            "message": "Already paid"
        }

    # Verify payment
    valid = False
    if settings.RAZORPAY_KEY_SECRET and rzp_order_id and payment_id and signature:
        valid = verify_razorpay_signature(rzp_order_id, payment_id, signature, settings.RAZORPAY_KEY_SECRET)
    elif payment_id and settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        client = _client_or_none()
        if client:
            try:
                rzp_payment = client.payment.fetch(payment_id)
                if rzp_payment.get("status") in ["captured", "authorized"]:
                    valid = True
            except Exception:
                logger.exception("Razorpay payment fetch failed for payment_id=%s", payment_id)
    if not valid and settings.DEBUG:
        valid = True

    # Create transaction
    PaymentTransaction.objects.update_or_create(
        razorpay_payment_id=payment_id,
        defaults={
            "user": user,
            "plan": order.plan,
            "order": order,
            "amount": order.amount,
            "currency": order.currency,
            "status": "success" if valid else "failed",
            "payment_method": "razorpay",
            "razorpay_signature": signature,
            "modified_by": user,
        },
    )

    order.status = "paid" if valid else "failed"
    order.save(update_fields=["status", "updated_at"])

    if valid and order.plan:
        if not order.user.is_verified:
            order.user.is_verified = True
            order.user.save(update_fields=["is_verified"])

        start, end, renewal = calculate_subscription_dates(order.plan)
        Subscription.objects.update_or_create(
            user=order.user, plan=order.plan,
            defaults={
                "status": "active", "start_date": start, "end_date": end,
                "renewal_date": renewal, "auto_renew": True, "amount": order.amount,
                "currency": order.currency, "payment_method": "razorpay",
                "razorpay_subscription_id": build_local_subscription_reference(order.user_id, order.plan_id),
                "modified_by": user,
            }
        )
        sync_user_subscription(order.user, order.plan)
        send_direct_notification(
            order.user,
            title="Payment confirmed and subscription activated",
            description=f"Your {getattr(order.plan, 'name', 'selected')} subscription is now active.",
            notification_type="digest",
            action_url="/dashboard/subscriptions",
            priority="high",
        )
        try:
            send_payment_receipt_email(
                order.user,
                {
                    "plan_name": getattr(order.plan, "name", "Subscription Plan"),
                    "payment_id": payment_id,
                    "order_id": order.razorpay_order_id,
                    "amount": f"{order.amount:.2f}",
                    "currency": order.currency,
                    "purchase_date": order.created_at.strftime("%d %b %Y") if order.created_at else "N/A",
                    "start_date": start.strftime("%d %b %Y") if start else "N/A",
                    "end_date": end.strftime("%d %b %Y") if end else "N/A",
                    "renewal_date": renewal.strftime("%d %b %Y") if renewal else "N/A",
                },
            )
        except Exception:
            logger.exception("Failed to send payment receipt email for user %s", order.user.id)
        logger.info(f"Subscription activated for user {order.user.id}")

    return {
        "success": valid,
        "paymentId": payment_id,
        "orderId": order.razorpay_order_id,
        "status": "captured" if valid else "failed",
    }


def create_subscription(user, data):
    """Create a subscription"""
    plan = resolve_plan(data["planId"])
    if not plan:
        raise ValueError("Plan not found")

    subscription = Subscription.objects.create(
        user=user,
        plan=plan,
        status="pending",
        start_date=None,
        end_date=None,
        renewal_date=None,
        auto_renew=True,
        amount=data.get("amount", Decimal("0")),
        currency=data.get("currency", "INR"),
        payment_method="razorpay",
        razorpay_subscription_id=build_local_subscription_reference(user.id, plan.id),
        created_by=user,
    )
    return subscription


def get_payment_history(user, user_id=None, limit=20, offset=0):
    """Get payment history for user"""
    queryset = payment_transactions_queryset()
    
    if not user.is_admin_user:
        queryset = queryset.filter(user=user)
    elif user_id:
        queryset = queryset.filter(user_id=user_id)

    total_count = queryset.count()
    paginated_qs = queryset[offset:offset + limit]

    payments = [
        {
            "id": str(item.id),
            "paymentId": item.razorpay_payment_id,
            "orderId": item.order.razorpay_order_id if item.order else "",
            "amount": str(item.amount),
            "currency": item.currency,
            "status": item.status,
            "planId": str(item.plan_id) if item.plan_id else "",
            "planName": item.plan.name if item.plan else "",
            "userId": str(item.user_id),
            "createdAt": item.created_at.isoformat(),
        }
        for item in paginated_qs
    ]
    
    return {
        "payments": payments,
        "data": payments,
        "pagination": {
            "total": total_count,
            "limit": limit,
            "offset": offset,
        }
    }


def cancel_subscription(user, subscription_id):
    """Cancel a subscription"""
    from django.shortcuts import get_object_or_404
    sub = get_object_or_404(Subscription, pk=subscription_id, is_deleted=False)
    ensure_subscription_access({"user": user}, sub)
    sub.status = "cancelled"
    sub.auto_renew = False
    sub.modified_by = user
    sub.save(update_fields=["status", "auto_renew", "modified_by"])
    return {"success": True}


def get_subscription_detail(user, subscription_id):
    """Get subscription details"""
    from django.shortcuts import get_object_or_404
    sub = get_object_or_404(Subscription, pk=subscription_id, is_deleted=False)
    ensure_subscription_access({"user": user}, sub)
    return sub


def get_admin_payments(user, limit=50, offset=0, status_filter=None):
    """Get admin payment view"""
    queryset = payment_transactions_queryset()
    
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    total_count = queryset.count()
    paginated_qs = queryset[offset:offset + limit]

    transactions = PaymentTransactionSerializer(paginated_qs, many=True).data
    
    # Calculate summary statistics
    from django.db.models import Sum, Count, Q, Avg
    summary_stats = queryset.aggregate(
        total_amount=Sum('amount'),
        success_count=Count('id', filter=Q(status='success')),
        failed_count=Count('id', filter=Q(status='failed')),
        pending_count=Count('id', filter=Q(status='pending')),
        failed_amount=Sum('amount', filter=Q(status='failed')),
        avg_amount=Avg('amount'),
    )

    total_revenue = summary_stats.get('total_amount') or 0
    failed_amount = summary_stats.get('failed_amount') or 0

    return {
        "data": {
            "transactions": transactions,
            "summary": {
                "totalRevenue": total_revenue,
                "totalRevenueFormatted": f"₹{total_revenue:,.2f}",
                "activeSubscriptions": summary_stats.get('success_count') or 0,
                "pendingPayments": summary_stats.get('failed_count') or 0,
                "pendingAmount": failed_amount,
                "pendingAmountFormatted": f"₹{failed_amount:,.2f}",
                "averageTransactionValue": summary_stats.get('avg_amount') or 0,
            },
            "pagination": {
                "total": total_count,
                "limit": limit,
                "offset": offset,
            }
        }
    }


def get_admin_subscriptions(user, limit=50, offset=0, status_filter=None):
    """Get admin subscriptions view"""
    queryset = subscriptions_queryset()

    all_subscriptions = list(queryset)
    subscription_user_ids = {sub.user_id for sub in all_subscriptions}

    free_users = User.objects.filter(
        role__in=["student", "employer"],
        is_active=True
    ).exclude(id__in=subscription_user_ids)

    free_subscription_rows = [
        {
            "id": f"free-{free_user.id}",
            "user": free_user.id,
            "userId": free_user.id,
            "userName": free_user.get_full_name() or free_user.username or free_user.email,
            "userEmail": free_user.email,
            "plan": None,
            "planId": None,
            "planName": "Free" if not free_user.subscription or free_user.subscription.lower() == 'free' else free_user.subscription.replace('_', ' ').title(),
            "status": "free",
            "startDate": None,
            "endDate": None,
            "renewalDate": None,
            "amount": 0,
            "amountFormatted": "₹0.00",
            "paymentMethod": "",
            "autoRenew": False,
            "createdAt": None,
        }
        for free_user in free_users
    ]

    if status_filter and status_filter != 'all':
        if status_filter == 'free':
            actual_subscriptions = []
        else:
            actual_subscriptions = list(queryset.filter(status=status_filter))
    else:
        actual_subscriptions = all_subscriptions

    total_count = len(actual_subscriptions) + (len(free_subscription_rows) if status_filter in (None, 'all', 'free') else 0)

    subscription_records = SubscriptionSerializer(actual_subscriptions, many=True).data
    merged_records = subscription_records
    if status_filter in (None, 'all', 'free'):
        if status_filter == 'free':
            merged_records = free_subscription_rows
        else:
            merged_records = subscription_records + free_subscription_rows

    paginated_rows = merged_records[offset:offset + limit]

    # Calculate statistics
    from django.db.models import Sum, Count, Q, Avg
    stats = queryset.aggregate(
        total_active=Count('id', filter=Q(status='active')),
        total_cancelled=Count('id', filter=Q(status='cancelled')),
        total_pending=Count('id', filter=Q(status='pending')),
        total_expired=Count('id', filter=Q(status='expired')),
        total_revenue=Sum('amount'),
        avg_subscription_value=Avg('amount'),
        auto_renew_count=Count('id', filter=Q(auto_renew=True)),
    )
    stats.update({
        "totalSubscriptions": (stats.get('total_active') or 0) + (stats.get('total_cancelled') or 0) + (stats.get('total_pending') or 0) + (stats.get('total_expired') or 0) + len(free_subscription_rows),
        "activeSubscriptions": stats.get('total_active') or 0,
        "cancelledSubscriptions": stats.get('total_cancelled') or 0,
        "pendingSubscriptions": stats.get('total_pending') or 0,
        "expiredSubscriptions": stats.get('total_expired') or 0,
        "freeSubscriptions": len(free_subscription_rows),
        "totalRevenueFormatted": f"₹{(stats.get('total_revenue') or 0):,.2f}",
        "averageSubscriptionValueFormatted": f"₹{(stats.get('avg_subscription_value') or 0):,.2f}",
        "monthlyRecurringRevenue": stats.get('total_revenue') or 0,
        "monthlyRecurringRevenueFormatted": f"₹{(stats.get('total_revenue') or 0):,.2f}",
        "totalRevenue": stats.get('total_revenue') or 0,
        "churnRate": 0,
    })

    return {
        "data": {
            "subscriptions": paginated_rows,
            "stats": stats,
            "pagination": {
                "total": total_count,
                "limit": limit,
                "offset": offset,
            }
        }
    }


def update_subscription_status(user, subscription_id, new_status):
    """Update subscription status by admin"""
    from django.shortcuts import get_object_or_404
    sub = get_object_or_404(Subscription, pk=subscription_id, is_deleted=False)
    
    # Validate status transition
    valid_statuses = [choice[0] for choice in Subscription.STATUS_CHOICES]
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of {valid_statuses}")
    
    sub.status = new_status
    sub.modified_by = user
    sub.save(update_fields=["status", "modified_by"])
    
    logger.info(f"Admin {user.id} updated subscription {subscription_id} status to {new_status}")
    return sub


def delete_subscription(user, subscription_id):
    """Soft delete subscription by admin"""
    from django.shortcuts import get_object_or_404
    sub = get_object_or_404(Subscription, pk=subscription_id, is_deleted=False)
    
    # Soft delete instead of hard delete
    sub.is_deleted = True
    sub.modified_by = user
    sub.save(update_fields=["is_deleted", "modified_by"])
    
    logger.info(f"Admin {user.id} soft-deleted subscription {subscription_id}")
    return {"success": True}