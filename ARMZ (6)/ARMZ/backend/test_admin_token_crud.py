#!/usr/bin/env python
import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from rest_framework_simplejwt.tokens import RefreshToken

BASE_URL = 'http://localhost:8000/api'

# Ensure admin user exists
admin_user, created = User.objects.get_or_create(
    email='admin@test.com',
    defaults={
        'username': 'admin',
        'role': 'admin',
        'is_staff': True,
        'is_superuser': False,
        'is_active': True,
    }
)
if created:
    admin_user.set_password('AdminPass123!')
    admin_user.save()
    print('Created admin user admin@test.com')
else:
    print('Admin user already exists')

refresh = RefreshToken.for_user(admin_user)
access_token = str(refresh.access_token)
headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}
print('Generated admin access token')

# GET plans
print('\nGET /api/admin/plans')
resp = requests.get(f'{BASE_URL}/admin/plans', headers=headers, timeout=10)
print(resp.status_code, resp.text[:400])

# Create plan
new_plan = {
    'name': 'Automated Test Plan',
    'description': 'Plan created during automated admin CRUD check',
    'price': '1234.00',
    'razorpay_fee_percentage': '2.00',
    'gst_percentage': '18.00',
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
print('\nPOST /api/admin/plans')
resp = requests.post(f'{BASE_URL}/admin/plans', json=new_plan, headers=headers, timeout=10)
print(resp.status_code, resp.text[:400])

if resp.status_code in (200, 201):
    created = resp.json().get('data', resp.json())
    plan_id = created.get('id')
    print('Created plan id:', plan_id)
    # Update plan
    update_payload = {'name': 'Automated Test Plan Updated', 'tier': 6, 'tabs': [{'name':'Updated','content':'Updated content'}]}
    print(f'\nPUT /api/admin/plans/{plan_id}')
    resp2 = requests.put(f'{BASE_URL}/admin/plans/{plan_id}', json=update_payload, headers=headers, timeout=10)
    print(resp2.status_code, resp2.text[:400])
    # Delete plan
    print(f'\nDELETE /api/admin/plans/{plan_id}')
    resp3 = requests.delete(f'{BASE_URL}/admin/plans/{plan_id}', headers=headers, timeout=10)
    print(resp3.status_code, resp3.text[:400])
    # Confirm delete
    print(f'\nGET /api/admin/plans/{plan_id}')
    resp4 = requests.get(f'{BASE_URL}/admin/plans/{plan_id}', headers=headers, timeout=10)
    print(resp4.status_code, resp4.text[:400])
else:
    print('Create failed, skipping update/delete')
