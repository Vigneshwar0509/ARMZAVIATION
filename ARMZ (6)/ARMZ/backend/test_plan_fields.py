#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from services.models import Plan

print("=" * 60)
print("PLAN MANAGEMENT - LIVE TEST")
print("=" * 60)

plans = Plan.objects.all()[:5]

if not plans:
    print("\n⚠️  No plans found in database")
else:
    print(f"\n✅ Found {Plan.objects.count()} plans total\n")
    
    for i, plan in enumerate(plans, 1):
        print(f"{i}. Plan: {plan.name}")
        print(f"   Price: ₹{plan.price}")
        print(f"   Tier: {plan.tier} {'✅' if hasattr(plan, 'tier') else '❌'}")
        print(f"   Tabs: {plan.tabs} {'✅' if hasattr(plan, 'tabs') else '❌'}")
        print(f"   Permissions: {len(plan.permissions) if plan.permissions else 0}")
        print()

# Test tier comparison logic
print("=" * 60)
print("TIER COMPARISON TEST")
print("=" * 60)

if plans.count() >= 2:
    plan1 = plans[0]
    plan2 = plans[1]
    print(f"\nPlan 1: {plan1.name} (Tier: {plan1.tier})")
    print(f"Plan 2: {plan2.name} (Tier: {plan2.tier})")
    
    if plan1.tier < plan2.tier:
        print(f"Result: Plan 2 is UPGRADE ✅")
    elif plan1.tier > plan2.tier:
        print(f"Result: Plan 2 is DOWNGRADE ✅")
    else:
        print(f"Result: Same tier")
else:
    print("\n⚠️  Need at least 2 plans for tier comparison")

print("\n" + "=" * 60)
