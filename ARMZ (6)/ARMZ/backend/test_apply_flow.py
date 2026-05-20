#!/usr/bin/env python
"""
Test script to verify the apply flow works correctly
"""
import os
import sys
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from services.models import Job, Internship
from bookings.models import Application

User = get_user_model()

def test_apply_flow():
    """Test applying to jobs and internships"""
    print("\n" + "="*60)
    print("TESTING APPLY FLOW")
    print("="*60)
    
    # Create test user
    user, _ = User.objects.get_or_create(
        email='testuser@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'is_active': True,
        }
    )
    user.set_password('password123')
    user.save()
    print("[OK] Created/got user: {} (ID: {})".format(user.email, user.id))
    
    # Get or create test jobs and internships
    jobs = Job.objects.all()[:2]
    internships = Internship.objects.all()[:2]
    
    if not jobs:
        print("[ERROR] No jobs found. Please add some jobs first.")
        return
    
    if not internships:
        print("[WARN] No internships found. Will only test job applications.")
        internships = []
    
    print("\nFound {} jobs and {} internships".format(len(jobs), len(internships)))
    
    # Test applying to jobs
    print("\n" + "-"*60)
    print("Testing Job Applications")
    print("-"*60)
    
    for job in jobs:
        # Create application
        app, created = Application.objects.get_or_create(
            job=job,
            user=user,
            defaults={'status': 'pending'}
        )
        status = "Created" if created else "Already exists"
        print("[OK] {}: Job '{}' (ID: {})".format(status, job.title, job.id))
        print("     Application ID: {}, Status: {}".format(app.id, app.status))
    
    # Test applying to internships
    if internships:
        print("\n" + "-"*60)
        print("Testing Internship Applications")
        print("-"*60)
        
        for internship in internships:
            # Create application
            app, created = Application.objects.get_or_create(
                internship=internship,
                user=user,
                defaults={'status': 'pending'}
            )
            status = "Created" if created else "Already exists"
            print("[OK] {}: Internship '{}' (ID: {})".format(status, internship.title, internship.id))
            print("     Application ID: {}, Status: {}".format(app.id, app.status))
    
    # Test fetching applications
    print("\n" + "-"*60)
    print("Testing Fetch Applications")
    print("-"*60)
    
    client = Client()
    
    # Get or create token for this user
    from rest_framework.authtoken.models import Token
    token, _ = Token.objects.get_or_create(user=user)
    print("\n[OK] Got/created API token for user")
    
    # Fetch applications for this user with token auth
    response = client.get(
        '/api/applications?userId={}'.format(user.id),
        HTTP_AUTHORIZATION='Token {}'.format(token.key)
    )
    print("\nFetch applications response:")
    print("  Status: {}".format(response.status_code))
    
    if response.status_code == 200:
        data = response.json()
        apps = data.get('data', [])
        print("  Found {} applications".format(len(apps)))
        
        for i, app in enumerate(apps[:5]):  # Show first 5
            print("\n  App {}:".format(i+1))
            print("    ID: {}".format(app.get('id')))
            print("    jobId: {}".format(app.get('jobId')))
            print("    applicationType: {}".format(app.get('applicationType')))
            print("    job_id: {}".format(app.get('job_id')))
            print("    internship_id: {}".format(app.get('internship_id')))
            print("    status: {}".format(app.get('status')))
            print("    userId: {}".format(app.get('userId')))
    else:
        print("  Error: {}".format(response.content.decode()))
    
    # Verify applications in DB
    print("\n" + "-"*60)
    print("Database Verification")
    print("-"*60)
    
    user_apps = Application.objects.filter(user=user)
    print("\n[OK] User has {} applications in database".format(user_apps.count()))
    
    for app in user_apps:
        app_type = "Internship" if app.internship_id else "Job"
        job_id = app.internship_id or app.job_id
        print("  - {} ID {}: Status {}".format(app_type, job_id, app.status))
    
    print("\n" + "="*60)
    print("[OK] TEST COMPLETE")
    print("="*60 + "\n")

if __name__ == '__main__':
    test_apply_flow()
