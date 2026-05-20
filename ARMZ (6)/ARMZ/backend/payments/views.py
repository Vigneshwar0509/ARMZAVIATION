from datetime import date, timedelta
from decimal import Decimal
import time

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.utils import IntegrityError
from django.db.models import Sum, Count, Q, Avg
import logging
from rest_framework import permissions, status
from rest_framework import serializers as drf_serializers
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from payments.models import PaymentOrder, PaymentTransaction, Subscription
from payments.permissions import IsAdminRole
from config.rbac import require_roles
from payments.serializers import (
    CancelSubscriptionSerializer,
    CreateOrderSerializer,
    CreateSubscriptionSerializer,
    PaymentTransactionSerializer,
    SubscriptionSerializer,
    VerifyPaymentSerializer,
)
from config.throttling import (
    PaymentCreateOrderRateThrottle,
    PaymentSubscriptionRateThrottle,
    PaymentVerifyRateThrottle,
)
from payments import services as payment_services
from payments.subscription_service import SubscriptionService
from services.models import Plan
from services.notification_dispatch import send_direct_notification
from services.utils import build_plan_code
from payments.selectors import plan_by_identifier, payment_transactions_queryset, subscriptions_queryset


logger = logging.getLogger(__name__)


class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PaymentCreateOrderRateThrottle]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            order_data = payment_services.create_payment_order(
                request.user, data.get('planId'), data.get('currency', 'INR')
            )
        except ValueError as exc:
            raise ValidationError({
                'planId': str(exc) or 'Plan not found',
            })

        return Response({'order': order_data})


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PaymentVerifyRateThrottle]

    def post(self, request):
        """Atomic, idempotent payment verification with safe fallbacks."""
        try:
            serializer = VerifyPaymentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            result = payment_services.verify_payment(request.user, data)
            status_code = status.HTTP_200_OK if result.get("success") else status.HTTP_400_BAD_REQUEST
            return Response(result, status=status_code)

        except drf_serializers.ValidationError as exc:
            logger.warning("Payment verification validation error for user=%s: %s", request.user.id, exc)
            return Response(
                {"success": False, "message": str(exc.detail) if hasattr(exc, "detail") else "Invalid payment verification payload"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except APIException:
            raise
        except IntegrityError:
            logger.exception("Payment verification integrity error for user=%s", request.user.id)
            return Response(
                {"success": False, "message": "Duplicate payment verification request"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.exception('Critical Payment verification crash: %s', exc)
            return Response({"success": False, "message": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PaymentSubscriptionRateThrottle]

    def post(self, request):
        serializer = CreateSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        subscription = payment_services.create_subscription(request.user, data)
        return Response({"success": True, "subscription": SubscriptionSerializer(subscription).data})


class PaymentHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = request.query_params.get("userId")
        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))
        
        return Response(payment_services.get_payment_history(request.user, user_id, limit, offset))


class CancelSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CancelSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = payment_services.cancel_subscription(request.user, serializer.validated_data["subscriptionId"])
        return Response(result)


class SubscriptionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, subscription_id):
        sub = payment_services.get_subscription_detail(request.user, subscription_id)
        return Response(SubscriptionSerializer(sub).data)


@require_roles('admin')
class AdminPaymentsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        limit = int(request.query_params.get("limit", 50))
        offset = int(request.query_params.get("offset", 0))
        status_filter = request.query_params.get("status")
        
        return Response(payment_services.get_admin_payments(request.user, limit, offset, status_filter))


@require_roles('admin')
class AdminSubscriptionsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        limit = int(request.query_params.get("limit", 50))
        offset = int(request.query_params.get("offset", 0))
        status_filter = request.query_params.get("status")
        
        return Response(payment_services.get_admin_subscriptions(request.user, limit, offset, status_filter))


@require_roles('admin')
class AdminSubscriptionStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, subscription_id):
        new_status = request.data.get("status")
        sub = payment_services.update_subscription_status(request.user, subscription_id, new_status)
        return Response({"data": SubscriptionSerializer(sub).data})


@require_roles('admin')
class AdminSubscriptionDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def delete(self, request, subscription_id):
        result = payment_services.delete_subscription(request.user, subscription_id)
        return Response({"data": result})


class PlanChangeView(APIView):
    """Handle plan upgrades and downgrades."""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PaymentSubscriptionRateThrottle]

    def post(self, request):
        """Request a plan change (upgrade or downgrade)."""
        try:
            target_plan_id = request.data.get("planId")
            if not target_plan_id:
                return Response(
                    {"success": False, "message": "planId is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            target_plan = get_object_or_404(Plan, id=target_plan_id)
            
            # Get current subscription
            current_sub = Subscription.objects.filter(
                user=request.user,
                status="active"
            ).first()
            
            if not current_sub or not current_sub.plan:
                return Response(
                    {"success": False, "message": "No active subscription found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            current_plan = current_sub.plan
            
            # Determine if upgrade or downgrade
            is_upgrade = SubscriptionService.is_upgrade(current_plan, target_plan)
            
            # Request the plan change
            result = SubscriptionService.request_plan_change(
                request.user,
                target_plan,
                is_upgrade
            )
            
            return Response(result, status=status.HTTP_200_OK)
        
        except Exception as exc:
            logger.exception("Plan change error for user=%s: %s", request.user.id, exc)
            return Response(
                {"success": False, "message": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request):
        """Get subscription status including pending changes."""
        try:
            status_info = SubscriptionService.get_subscription_status(request.user)
            return Response({"success": True, "data": status_info}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception("Failed to get subscription status for user=%s: %s", request.user.id, exc)
            return Response(
                {"success": False, "message": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )