#!/usr/bin/env python
import os
import django
import json
import sys
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.test_settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory, APIClient
from accounts.models import User
from services.models import Plan
from services.serializers import PlanSerializer
from rest_framework_simplejwt.tokens import RefreshToken
import logging

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

new_plan_data = {
    'name': 'API Debug Test Plan',
    'description': 'Plan created for API debugging',
    'price': '1234.50',
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
print("Testing via APIClient")
print("=" * 60)

# Get or create admin user
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

if not admin_user.check_password('AdminPass123!'):
    admin_user.set_password('AdminPass123!')
    admin_user.save()

# Generate token
refresh = RefreshToken.for_user(admin_user)
access_token = str(refresh.access_token)

# Use APIClient
client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

print("\n1. Testing POST /api/admin/plans")
print("-" * 60)

try:
    response = client.post(
        '/api/admin/plans',
        data=json.dumps(new_plan_data),
        content_type='application/json'
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code in (200, 201):
        print("✅ Success")
    else:
        print("❌ Failed")
        
except Exception as e:
    print(f"❌ Error: {e}")
    logger.exception("Error in API request")
    traceback.print_exc()

print("\n2. Testing GET /api/admin/plans")  
print("-" * 60)

try:
    response = client.get('/api/admin/plans')
    
    print(f"Status Code: {response.status_code}")
    data = response.json()
    if 'data' in data and 'plans' in data['data']:
        print(f"Plans returned: {len(data['data']['plans'])}")
        print("✅ Success")
    else:
        print(f"Response: {json.dumps(data, indent=2)}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    traceback.print_exc()
