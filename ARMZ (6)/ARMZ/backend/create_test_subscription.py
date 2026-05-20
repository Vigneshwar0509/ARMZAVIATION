import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from payments.models import Subscription
from services.models import Plan

# Get the test user
user = User.objects.get(email='testuser@example.com')

# Get the 499 plan
plan = Plan.objects.get(price=499)

# Delete any existing subscription
Subscription.objects.filter(user=user).delete()

# Create a subscription
subscription = Subscription.objects.create(
    user=user,
    plan=plan,
    status='active',
    start_date=timezone.now(),
    end_date=timezone.now() + timedelta(days=30),
    amount=plan.price,
    currency='INR',
)

print(f"✅ Subscription created: {subscription.id}")
print(f"Plan: {subscription.plan.name} (₹{subscription.plan.price})")
print(f"Tier: {subscription.plan.tier}")
print(f"User: {user.email}")
