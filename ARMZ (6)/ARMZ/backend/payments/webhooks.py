"""Razorpay webhook handlers for payment events."""

import logging
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from config.webhook_security import RazorpayWebhookValidator
from payments.models import PaymentOrder, PaymentTransaction, Subscription
from payments.serializers import SubscriptionSerializer
from services.notification_dispatch import send_direct_notification
from accounts.models import User

logger = logging.getLogger("payments.webhooks")


class RazorpayWebhookView(APIView):
    """
    Handle incoming Razorpay webhooks with signature verification.
    
    Security:
    - Verifies HMAC-SHA256 signature
    - Validates timestamp to prevent replay attacks
    - Logs all webhook events for audit trail
    """
    
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        """Process incoming Razorpay webhook."""
        
        # Extract signature from headers
        signature = request.META.get("HTTP_X_RAZORPAY_SIGNATURE", "")
        
        try:
            # Get raw body
            payload = request.body
            
            # Verify signature
            RazorpayWebhookValidator.verify_signature(payload, signature)
            
            # Extract event
            event_type, event_data = RazorpayWebhookValidator.extract_event(payload)
            
            # Log webhook event
            logger.info(
                "Razorpay webhook received",
                extra={
                    "event_type": event_type,
                    "payment_id": event_data.get("payment", {}).get("id"),
                    "order_id": event_data.get("payment", {}).get("order_id"),
                }
            )
            
            # Route to appropriate handler
            handler = self._get_handler(event_type)
            
            if handler:
                with transaction.atomic():
                    handler(event_type, event_data)
            else:
                logger.warning(f"No handler for event: {event_type}")
            
            return Response({"success": True}, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(
                f"Webhook processing failed: {str(e)}",
                exc_info=True,
                extra={"signature_valid": False}
            )
            # Always return 200 to prevent retries for invalid signatures
            return Response({"success": False}, status=status.HTTP_200_OK)
    
    @staticmethod
    def _get_handler(event_type: str):
        """Get handler for event type."""
        handlers = {
            "payment.authorized": RazorpayWebhookView._handle_payment_authorized,
            "payment.captured": RazorpayWebhookView._handle_payment_captured,
            "payment.failed": RazorpayWebhookView._handle_payment_failed,
            "invoice.paid": RazorpayWebhookView._handle_invoice_paid,
            "subscription.activated": RazorpayWebhookView._handle_subscription_activated,
            "subscription.cancelled": RazorpayWebhookView._handle_subscription_cancelled,
        }
        return handlers.get(event_type)
    
    @staticmethod
    def _handle_payment_authorized(event_type: str, event_data: dict):
        """Handle payment.authorized event."""
        payment = event_data.get("payment", {})
        payment_id = payment.get("id")
        order_id = payment.get("order_id")
        amount = Decimal(str(payment.get("amount", 0))) / 100  # Convert paise to rupees
        
        logger.info(f"Payment authorized: {payment_id} for order {order_id}")
        
        # Update payment transaction
        PaymentTransaction.objects.filter(razorpay_payment_id=payment_id).update(
            status="authorized",
            amount=amount
        )
    
    @staticmethod
    def _handle_payment_captured(event_type: str, event_data: dict):
        """Handle payment.captured event (successful payment)."""
        payment = event_data.get("payment", {})
        payment_id = payment.get("id")
        order_id = payment.get("order_id")
        amount = Decimal(str(payment.get("amount", 0))) / 100
        
        logger.info(f"Payment captured: {payment_id} for order {order_id}")
        
        try:
            # Find payment order
            payment_order = PaymentOrder.objects.filter(razorpay_order_id=order_id).first()
            
            if not payment_order:
                logger.warning(f"Payment order not found for order_id: {order_id}")
                return
            
            user = payment_order.user
            
            # Update payment transaction
            PaymentTransaction.objects.filter(razorpay_payment_id=payment_id).update(
                status="captured",
                amount=amount
            )
            
            # Mark payment order as paid
            payment_order.status = "paid"
            payment_order.save()
            
            # Update user verification
            if not user.is_verified:
                user.is_verified = True
                user.save()
            
            # Send notification
            send_direct_notification(
                user_id=user.id,
                title="Payment Successful",
                body=f"Your payment of ₹{amount} has been processed successfully.",
                notification_type="payment_success"
            )
            
            logger.info(f"Payment order {order_id} marked as paid for user {user.id}")
        
        except Exception as e:
            logger.error(f"Failed to process payment capture: {str(e)}", exc_info=True)
            raise
    
    @staticmethod
    def _handle_payment_failed(event_type: str, event_data: dict):
        """Handle payment.failed event."""
        payment = event_data.get("payment", {})
        payment_id = payment.get("id")
        order_id = payment.get("order_id")
        reason = payment.get("description", "Unknown error")
        
        logger.warning(f"Payment failed: {payment_id} for order {order_id}. Reason: {reason}")
        
        try:
            payment_order = PaymentOrder.objects.filter(razorpay_order_id=order_id).first()
            
            if payment_order:
                payment_order.status = "failed"
                payment_order.save()
                
                user = payment_order.user
                send_direct_notification(
                    user_id=user.id,
                    title="Payment Failed",
                    body=f"Your payment could not be processed. Reason: {reason}",
                    notification_type="payment_failed"
                )
        
        except Exception as e:
            logger.error(f"Failed to process payment failure: {str(e)}", exc_info=True)
    
    @staticmethod
    def _handle_invoice_paid(event_type: str, event_data: dict):
        """Handle invoice.paid event (subscription payment)."""
        invoice = event_data.get("invoice", {})
        invoice_id = invoice.get("id")
        subscription_id = invoice.get("subscription_id")
        amount = Decimal(str(invoice.get("amount", 0))) / 100
        
        logger.info(f"Invoice paid: {invoice_id} for subscription {subscription_id}")
        
        try:
            subscription = Subscription.objects.filter(
                razorpay_subscription_id=subscription_id
            ).first()
            
            if subscription:
                # Log transaction
                PaymentTransaction.objects.create(
                    user=subscription.user,
                    razorpay_order_id=invoice_id,
                    amount=amount,
                    status="captured",
                    payment_method="subscription"
                )
                
                send_direct_notification(
                    user_id=subscription.user.id,
                    title="Subscription Payment",
                    body=f"Your subscription payment of ₹{amount} has been processed.",
                    notification_type="subscription_payment"
                )
                
                logger.info(f"Subscription {subscription_id} payment processed")
        
        except Exception as e:
            logger.error(f"Failed to process invoice payment: {str(e)}", exc_info=True)
    
    @staticmethod
    def _handle_subscription_activated(event_type: str, event_data: dict):
        """Handle subscription.activated event."""
        subscription_data = event_data.get("subscription", {})
        subscription_id = subscription_data.get("id")
        
        logger.info(f"Subscription activated: {subscription_id}")
        
        try:
            subscription = Subscription.objects.filter(
                razorpay_subscription_id=subscription_id
            ).first()
            
            if subscription:
                subscription.status = "active"
                subscription.save()
                
                send_direct_notification(
                    user_id=subscription.user.id,
                    title="Subscription Activated",
                    body="Your subscription is now active.",
                    notification_type="subscription_activated"
                )
        
        except Exception as e:
            logger.error(f"Failed to activate subscription: {str(e)}", exc_info=True)
    
    @staticmethod
    def _handle_subscription_cancelled(event_type: str, event_data: dict):
        """Handle subscription.cancelled event."""
        subscription_data = event_data.get("subscription", {})
        subscription_id = subscription_data.get("id")
        
        logger.info(f"Subscription cancelled: {subscription_id}")
        
        try:
            subscription = Subscription.objects.filter(
                razorpay_subscription_id=subscription_id
            ).first()
            
            if subscription:
                subscription.status = "cancelled"
                subscription.save()
                
                send_direct_notification(
                    user_id=subscription.user.id,
                    title="Subscription Cancelled",
                    body="Your subscription has been cancelled.",
                    notification_type="subscription_cancelled"
                )
        
        except Exception as e:
            logger.error(f"Failed to cancel subscription: {str(e)}", exc_info=True)
