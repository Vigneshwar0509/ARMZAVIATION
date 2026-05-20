from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0002_eventregistration"),
    ]

    operations = [
        migrations.AddField(
            model_name="student",
            name="resume_data",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
