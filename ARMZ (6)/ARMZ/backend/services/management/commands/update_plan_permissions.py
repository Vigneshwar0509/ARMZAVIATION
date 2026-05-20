from django.core.management.base import BaseCommand
from services.models import Plan


class Command(BaseCommand):
    help = 'Update student and employer plans with proper permissions and pricing'

    def handle(self, *args, **options):
        # Update Student Plans with proper permissions
        student_plans_config = {
            'Basic': {
                'permissions': ['view_jobs', 'view_internships', 'basic_profile'],
                'price': 199.00,
            },
            'Prime': {
                'permissions': ['view_jobs', 'view_internships', 'apply_jobs', 'apply_internships', 'advanced_profile', 'resume_upload'],
                'price': 499.00,
            },
            'Placement': {
                'permissions': ['view_jobs', 'view_internships', 'apply_jobs', 'apply_internships', 'advanced_profile', 'resume_upload', 'priority_placement', 'interview_prep', 'mentorship'],
                'price': 49999.00,  # Changed from 99999 to avoid collision
            },
        }

        for plan_name, config in student_plans_config.items():
            plan, created = Plan.objects.update_or_create(
                name=plan_name,
                type='student',
                defaults={
                    'price': config['price'],
                    'permissions': config['permissions'],
                    'is_active': True,
                }
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(
                self.style.SUCCESS(f'{status} student plan: {plan.name} (₹{plan.price}/month) with {len(config["permissions"])} permissions')
            )

        # Employer plans already have permissions, but verify they're correct
        employer_plans_config = {
            'Starter': {
                'permissions': ['job_posting', 'view_applications', 'basic_analytics'],
                'price': 9999.00,
            },
            'Professional': {
                'permissions': ['job_posting', 'unlimited_jobs', 'view_applications', 'advanced_analytics', 'featured_listings', 'bulk_operations', 'interviews.manage'],
                'price': 24999.00,
            },
            'Enterprise': {
                'permissions': ['job_posting', 'unlimited_jobs', 'view_applications', 'advanced_analytics', 'featured_listings', 'bulk_operations', 'api_access', 'white_label', 'custom_integrations', 'sso', 'dedicated_support', 'interviews.manage', 'custom.campaigns'],
                'price': 99999.00,
            },
        }

        for plan_name, config in employer_plans_config.items():
            plan, created = Plan.objects.update_or_create(
                name=plan_name,
                type='employer',
                defaults={
                    'price': config['price'],
                    'permissions': config['permissions'],
                    'is_active': True,
                }
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(
                self.style.SUCCESS(f'{status} employer plan: {plan.name} (₹{plan.price}/month) with {len(config["permissions"])} permissions')
            )

        self.stdout.write(
            self.style.SUCCESS('\n✅ Successfully updated all plans with proper permissions and pricing')
        )
