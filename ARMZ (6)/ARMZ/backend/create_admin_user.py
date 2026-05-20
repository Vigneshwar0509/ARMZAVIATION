#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

# Create admin user
email = "vigneshramesh.0509@gmail.com"
password = "Vigneshwar.0509"

try:
    user = User.objects.create_user(
        email=email,
        username=email,
        password=password,
        role="admin",
        is_superuser=True,
        is_staff=True,
        is_verified=True,
        profile_complete=True
    )
    print(f"✓ Admin user created successfully!")
    print(f"  Email: {user.email}")
    print(f"  Role: {user.role}")
    print(f"  Is Superuser: {user.is_superuser}")
except Exception as e:
    print(f"✗ Error creating user: {e}")
