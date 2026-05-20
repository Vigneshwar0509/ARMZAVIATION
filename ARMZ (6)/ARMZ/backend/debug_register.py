import os
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from accounts.serializers import RegisterSerializer
from accounts.services import register_user

payload = {
    'name': 'Test User',
    'email': 'testuser@example.com',
    'password': 'TestPass123!',
    'confirmPassword': 'TestPass123!',
    'phone': '',
    'role': 'student',
    'company_name': '',
    'hr_name': '',
    'company_details': '',
}

serializer = RegisterSerializer(data=payload)
print('is_valid', serializer.is_valid())
print('errors', serializer.errors)
try:
    result, refresh = register_user(serializer)
    print('success', result)
except Exception:
    traceback.print_exc()
