#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from services.email_service import send_email_async

print(f'BREVO_API_KEY length: {len(getattr(settings, "BREVO_API_KEY", ""))}')
print(f'BREVO_API_KEY first 20 chars: {getattr(settings, "BREVO_API_KEY", "")[:20]}')
print(f'DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}')

print("\n--- Attempting to send test email via Brevo ---")
result = send_email_async('Test Email from Brevo', 'This is a test email from Brevo API', ['dev@armzaviation.com'])
print(f'Email send result: {result}')
