#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from services.models import Plan

print("=" * 60)
print("SETTING UP TIER VALUES FOR TESTING")
print("=" * 60)

# Update plans with proper tiers
updates = {
    "Basic": 1,
    "All Sections 499": 2,
    "All Sections": 3,
}

for name, tier in updates.items():
    plan = Plan.objects.filter(name=name).first()
    if plan:
        plan.tier = tier
        plan.save()
        print(f"✅ Updated {name} -> Tier {tier}")

# Also add sample tabs to one plan
basic_plan = Plan.objects.filter(name="Basic").first()
if basic_plan:
    basic_plan.tabs = [
        {"name": "Features", "content": "High-speed flight training with certified instructors"},
        {"name": "Support", "content": "24/7 email support and community access"}
    ]
    basic_plan.save()
    print(f"✅ Added tabs to Basic plan")

print("\n" + "=" * 60)
print("UPDATED PLANS")
print("=" * 60)

plans = Plan.objects.all()
for plan in plans:
    print(f"\nPlan: {plan.name}")
    print(f"  Tier: {plan.tier}")
    print(f"  Tabs: {len(plan.tabs) if plan.tabs else 0} tab(s)")
    if plan.tabs:
        for tab in plan.tabs:
            print(f"    - {tab.get('name', 'Unnamed')}")

print("\n" + "=" * 60)
