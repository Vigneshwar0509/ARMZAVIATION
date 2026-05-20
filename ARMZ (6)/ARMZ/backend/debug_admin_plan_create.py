#!/usr/bin/env python
import os
import django
import json
import sys
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from services.models import Plan
from services.serializers import PlanSerializer
from rest_framework_simplejwt.tokens import RefreshToken

BASE_URL = 'http://localhost:8000/api'

# Test data with proper decimal format
new_plan_data = {
    'name': 'Debug Test Plan',
    'description': 'Plan created for debugging',
    'price': '1234.50',  # String decimal
    'period': 'month',
    'tier': 5,
    'tabs': [
        {'name': 'Feature', 'content': 'Test content'},
        {'name': 'Benefit', 'content': 'More test content'}
    ],
    'features': ['Test feature 1', 'Test feature 2'],
    'permissions': ['perm_test'],
    'is_active': True,
    'type': 'student'
}

print("=" * 60)
print("Testing Plan Creation - Debug Version")
print("=" * 60)

print("\n1. Testing Serializer Directly")
print("-" * 60)
try:
    serializer = PlanSerializer(data=new_plan_data)
    if serializer.is_valid():
        print("✅ Serializer validation passed")
        print("Validated data:", json.dumps(serializer.validated_data, indent=2, default=str))
        
        # Try to save
        instance = serializer.save()
        print("✅ Plan created successfully")
        print(f"Created Plan ID: {instance.id}")
        print(f"Plan: {instance.name} - ${instance.price}")
        
        # Clean up
        instance.delete()
        print("✅ Test plan deleted")
    else:
        print("❌ Serializer validation failed")
        print("Errors:", json.dumps(serializer.errors, indent=2))
except Exception as e:
    print(f"❌ Error: {e}")
    traceback.print_exc()

print("\n2. Testing via HTTP Request")
print("-" * 60)
import requests

# Get admin user
admin_user, _ = User.objects.get_or_create(
    email='admin@test.com',
    defaults={
        'username': 'admin',
        'role': 'admin',
        'is_staff': True,
        'is_superuser': False,
        'is_active': True,
    }
)

# Set password if needed
if not admin_user.check_password('AdminPass123!'):
    admin_user.set_password('AdminPass123!')
    admin_user.save()

refresh = RefreshToken.for_user(admin_user)
access_token = str(refresh.access_token)
headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}

try:
    response = requests.post(
        f'{BASE_URL}/admin/plans',
        json=new_plan_data,
        headers=headers,
        timeout=10
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code in (200, 201):
        print("✅ Plan created via API successfully")
    else:
        print("❌ Plan creation failed via API")
        
except Exception as e:
    print(f"❌ Request error: {e}")
    traceback.print_exc()

print("\n3. Current Plans Count")
print("-" * 60)
plans_count = Plan.objects.count()
print(f"Total plans in database: {plans_count}")
