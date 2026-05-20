from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="EventRegistration",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("registration_code", models.CharField(max_length=64, unique=True)),
                ("registered_at", models.DateTimeField(auto_now_add=True)),
                ("event", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="registrations", to="services.event")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="event_registrations", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "unique_together": {("event", "user")},
            },
        ),
    ]
