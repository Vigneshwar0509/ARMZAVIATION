"""
Subscription management service for handling plan upgrades, downgrades, and transitions.
"""

from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction
from payments.models import Subscription
from services.models import Plan
from accounts.models import User


class SubscriptionService:
    """Service for managing subscription state transitions."""

    @staticmethod
    def get_plan_tier(plan: Plan) -> int:
        """Get numeric tier for a plan, preferring explicit tier, falling back to price."""
        if plan.tier:
            return plan.tier
        return int(plan.price)  # Use price as tier if not explicitly set

    @staticmethod
    def is_upgrade(current_plan: Plan, target_plan: Plan) -> bool:
        """Check if target plan is an upgrade from current plan."""
        current_tier = SubscriptionService.get_plan_tier(current_plan)
        target_tier = SubscriptionService.get_plan_tier(target_plan)
        return target_tier > current_tier

    @staticmethod
    def is_downgrade(current_plan: Plan, target_plan: Plan) -> bool:
        """Check if target plan is a downgrade from current plan."""
        current_tier = SubscriptionService.get_plan_tier(current_plan)
        target_tier = SubscriptionService.get_plan_tier(target_plan)
        return target_tier < current_tier

    @staticmethod
    def get_plan_change_type(current_plan: Plan, target_plan: Plan) -> str:
        """
        Determine the type of plan change.
        
        Returns:
            'upgrade', 'downgrade', or 'same'
        """
        if SubscriptionService.is_upgrade(current_plan, target_plan):
            return "upgrade"
        elif SubscriptionService.is_downgrade(current_plan, target_plan):
            return "downgrade"
        return "same"

    @staticmethod
    @transaction.atomic
    def request_plan_change(user: User, target_plan: Plan, is_upgrade: bool) -> dict:
        """
        Request a plan change. Upgrades are immediate, downgrades are deferred.
        
        Args:
            user: User requesting the plan change
            target_plan: Target plan to change to
            is_upgrade: Whether this is an upgrade (vs downgrade)
        
        Returns:
            dict with result status and message
        """
        if is_upgrade:
            # Immediate upgrade
            return SubscriptionService.apply_immediate_change(user, target_plan, "upgrade")
        else:
            # Deferred downgrade
            return SubscriptionService.schedule_downgrade(user, target_plan)

    @staticmethod
    @transaction.atomic
    def apply_immediate_change(user: User, target_plan: Plan, change_type: str = "upgrade") -> dict:
        """Apply an immediate plan change (typically for upgrades)."""
        user.pending_plan_id = None
        user.pending_change_type = None
        user.save(update_fields=['pending_plan_id', 'pending_change_type'])
        
        return {
            "success": True,
            "message": f"Plan changed to {target_plan.name} successfully",
            "planId": target_plan.id,
            "planName": target_plan.name,
            "immediate": True,
        }

    @staticmethod
    @transaction.atomic
    def schedule_downgrade(user: User, target_plan: Plan) -> dict:
        """Schedule a downgrade to occur after current plan expires."""
        user.pending_plan_id = target_plan.id
        user.pending_change_type = "downgrade"
        user.save(update_fields=['pending_plan_id', 'pending_change_type'])
        
        # Get current subscription end date
        current_subscription = Subscription.objects.filter(
            user=user, 
            status="active"
        ).first()
        
        end_date_str = ""
        if current_subscription and current_subscription.end_date:
            end_date_str = f" on {current_subscription.end_date.strftime('%B %d, %Y')}"
        
        return {
            "success": True,
            "message": f"Downgrade to {target_plan.name} scheduled{end_date_str}",
            "planId": target_plan.id,
            "planName": target_plan.name,
            "immediate": False,
            "scheduledFor": current_subscription.end_date.isoformat() if current_subscription else None,
        }

    @staticmethod
    @transaction.atomic
    def apply_pending_downgrade(user: User) -> bool:
        """Apply any pending downgrade when subscription expires."""
        if not user.pending_plan_id or user.pending_change_type != "downgrade":
            return False
        
        try:
            target_plan = Plan.objects.get(id=user.pending_plan_id)
            user.pending_plan_id = None
            user.pending_change_type = None
            user.save(update_fields=['pending_plan_id', 'pending_change_type'])
            return True
        except Plan.DoesNotExist:
            # Plan was deleted, clear the pending fields
            user.pending_plan_id = None
            user.pending_change_type = None
            user.save(update_fields=['pending_plan_id', 'pending_change_type'])
            return False

    @staticmethod
    def get_subscription_status(user: User) -> dict:
        """Get comprehensive subscription status for a user."""
        current_sub = Subscription.objects.filter(
            user=user,
            status="active"
        ).first()
        
        pending_plan = None
        if user.pending_plan_id:
            try:
                pending_plan = Plan.objects.get(id=user.pending_plan_id)
            except Plan.DoesNotExist:
                pass
        
        current_plan = None
        if current_sub and current_sub.plan:
            current_plan = current_sub.plan
        
        return {
            "currentPlan": {
                "id": current_plan.id if current_plan else None,
                "name": current_plan.name if current_plan else "None",
                "price": float(current_plan.price) if current_plan else 0,
                "tier": SubscriptionService.get_plan_tier(current_plan) if current_plan else 0,
            },
            "pendingChange": {
                "type": user.pending_change_type,
                "planId": user.pending_plan_id,
                "planName": pending_plan.name if pending_plan else None,
                "scheduledFor": current_sub.end_date.isoformat() if current_sub and current_sub.end_date else None,
            } if user.pending_plan_id else None,
            "subscriptionStatus": current_sub.status if current_sub else "none",
            "expiresAt": current_sub.end_date.isoformat() if current_sub and current_sub.end_date else None,
        }

    @staticmethod
    def get_plan_action_label(current_plan: Plan, target_plan: Plan) -> str:
        """Get the action label for a plan change."""
        if current_plan.id == target_plan.id:
            return "Current Plan"
        elif SubscriptionService.is_upgrade(current_plan, target_plan):
            return "Upgrade"
        elif SubscriptionService.is_downgrade(current_plan, target_plan):
            return "Downgrade"
        return "Change Plan"
