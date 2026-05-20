"""Razorpay webhook security and signature verification."""

import hmac
import hashlib
import json
from typing import Dict, Tuple, Optional
from django.conf import settings
from django.core.exceptions import SuspiciousOperation
from rest_framework.exceptions import ValidationError


class RazorpayWebhookValidator:
    """Validate and verify Razorpay webhook signatures."""
    
    SIGNATURE_ALGO = "sha256"
    TIMEOUT = 30  # seconds
    
    @classmethod
    def verify_signature(cls, payload: bytes, signature: str, secret: Optional[str] = None) -> bool:
        """
        Verify Razorpay webhook signature.
        
        Args:
            payload: Raw request body
            signature: X-Razorpay-Signature header
            secret: Webhook secret (defaults to settings.RAZORPAY_WEBHOOK_SECRET)
        
        Returns:
            True if signature is valid, False otherwise
        
        Raises:
            SuspiciousOperation: If signature verification fails
        """
        
        secret = secret or settings.RAZORPAY_WEBHOOK_SECRET
        
        if not secret:
            raise SuspiciousOperation("RAZORPAY_WEBHOOK_SECRET not configured")
        
        if not signature:
            raise SuspiciousOperation("Missing X-Razorpay-Signature header")
        
        # Generate expected signature
        expected_signature = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Constant-time comparison to prevent timing attacks
        is_valid = hmac.compare_digest(expected_signature, signature)
        
        if not is_valid:
            raise SuspiciousOperation("Invalid Razorpay webhook signature")
        
        return True
    
    @classmethod
    def extract_event(cls, payload: bytes) -> Tuple[str, Dict]:
        """
        Extract event type and data from webhook payload.
        
        Args:
            payload: Raw request body
        
        Returns:
            Tuple of (event_type, event_data)
        
        Raises:
            ValidationError: If payload is invalid JSON
        """
        
        try:
            data = json.loads(payload.decode())
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            raise ValidationError(f"Invalid webhook payload: {str(e)}")
        
        event_type = data.get("event")
        event_data = data.get("payload", {})
        
        if not event_type:
            raise ValidationError("Missing 'event' field in webhook payload")
        
        return event_type, event_data
    
    @classmethod
    def validate_webhook_timestamp(cls, timestamp: int, tolerance: int = TIMEOUT) -> bool:
        """
        Validate webhook timestamp to prevent replay attacks.
        
        Args:
            timestamp: Webhook timestamp (Unix)
            tolerance: Time tolerance in seconds
        
        Returns:
            True if timestamp is within tolerance
        
        Raises:
            SuspiciousOperation: If timestamp is outside tolerance
        """
        
        import time
        current_time = int(time.time())
        time_diff = abs(current_time - timestamp)
        
        if time_diff > tolerance:
            raise SuspiciousOperation(
                f"Webhook timestamp too old: {time_diff}s > {tolerance}s"
            )
        
        return True


# Supported Razorpay webhook events
RAZORPAY_EVENTS = {
    "payment.authorized": "payment_authorized",
    "payment.failed": "payment_failed",
    "payment.captured": "payment_captured",
    "invoice.issued": "invoice_issued",
    "invoice.paid": "invoice_paid",
    "invoice.expired": "invoice_expired",
    "subscription.authenticated": "subscription_authenticated",
    "subscription.pending": "subscription_pending",
    "subscription.activated": "subscription_activated",
    "subscription.paused": "subscription_paused",
    "subscription.resumed": "subscription_resumed",
    "subscription.completed": "subscription_completed",
    "subscription.cancelled": "subscription_cancelled",
    "subscription.halted": "subscription_halted",
}


def is_supported_event(event_type: str) -> bool:
    """Check if event type is supported."""
    return event_type in RAZORPAY_EVENTS


def get_event_handler_name(event_type: str) -> Optional[str]:
    """Get handler function name for event type."""
    return RAZORPAY_EVENTS.get(event_type)


# Retry configuration
WEBHOOK_RETRY_CONFIG = {
    "max_retries": settings.PAYMENT_WEBHOOK_RETRIES or 3,
    "timeout": settings.PAYMENT_WEBHOOK_TIMEOUT or 30,
    "backoff_factor": 2,
}
