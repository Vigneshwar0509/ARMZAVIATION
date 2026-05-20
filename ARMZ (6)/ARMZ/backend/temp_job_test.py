import os
import django
import json
from django.test import Client

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

email = 'employer@test.com'
user, created = User.objects.get_or_create(email=email, defaults={'username': email, 'role': 'employer'})
if created:
    user.set_password('password123')
    user.save()
    print('Created employer user')
else:
    print('Employer exists')

c = Client()
login = c.post('/api/auth/login', data=json.dumps({'email': email, 'password': 'password123'}), content_type='application/json')
print('login', login.status_code, login.content.decode())
if login.status_code != 200:
    raise SystemExit('Login failed')

payload = {
    'title': 'Test Captain',
    'company_name': 'Test Airline',
    'location': 'Test City',
    'description': 'This is a description of a job for testing.',
    'salary': '1000-2000',
    'category': 'Commercial Aviation',
    'type': 'Full-time',
    'experience': 'Mid Level',
    'requirements': ['must be qualified'],
    'responsibilities': ['fly aircraft'],
    'status': 'Active',
}
resp = c.post('/api/jobs', data=json.dumps(payload), content_type='application/json')
print('post job', resp.status_code, resp.content.decode())
