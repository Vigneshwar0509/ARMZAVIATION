from django.db import migrations


def create_default_testing_plans(apps, schema_editor):
    Plan = apps.get_model("services", "Plan")

    default_plans = [
        {
            "name": "Basic",
            "type": "student",
            "price": 5000.00,
            "period": "month",
            "description": "Basic test plan with minimal section access for testing.",
            "features": [
                "Basic section access",
                "Browse jobs and internships",
                "Standard profile features",
            ],
            "permissions": [
                "view_jobs",
                "view_internships",
                "basic_profile",
            ],
            "is_active": True,
        },
        {
            "name": "All Sections",
            "type": "student",
            "price": 10000.00,
            "period": "month",
            "description": "Full access test plan with all sections enabled.",
            "features": [
                "Full section access",
                "Apply to jobs and internships",
                "Resume upload and advanced profile",
                "Placement support and webinar access",
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
            "is_active": True,
        },
    ]

    for plan_data in default_plans:
        Plan.objects.update_or_create(
            name=plan_data["name"],
            defaults=plan_data,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0004_courseenrollment_services_co_user_id_9a3e17_idx_and_more"),
    ]

    operations = [
        migrations.RunPython(create_default_testing_plans),
    ]
