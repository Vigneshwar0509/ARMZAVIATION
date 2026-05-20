from django.db import migrations


def create_499_full_access_plan(apps, schema_editor):
    Plan = apps.get_model("services", "Plan")

    Plan.objects.update_or_create(
        name="All Sections 499",
        defaults={
            "type": "student",
            "price": 499.00,
            "period": "month",
            "description": "Full access plan for testing with all sections enabled.",
            "features": [
                "Full section access",
                "Apply to jobs and internships",
                "Advanced profile and resume upload",
                "Priority placement support",
                "Interview prep and mentorship",
                "Webinar access and LinkedIn support",
            ],
            "permissions": [
                "view_jobs",
                "view_internships",
                "apply_jobs",
                "apply_internships",
                "advanced_profile",
                "resume_upload",
                "priority_placement",
                "interview_prep",
                "mentorship",
                "webinars",
                "linkedin_support",
            ],
            "razorpay_plan_id": "",
            "is_active": True,
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0005_create_default_testing_plans"),
    ]

    operations = [
        migrations.RunPython(create_499_full_access_plan),
    ]
