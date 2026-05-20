from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("contact", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="contactmessage",
            index=models.Index(fields=["email"], name="contact_con_email_6c6d15_idx"),
        ),
        migrations.AddIndex(
            model_name="contactmessage",
            index=models.Index(fields=["created_at"], name="contact_con_create_18b34e_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["email"], name="contact_lea_email_fc6847_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["status"], name="contact_lea_status_2e523a_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["source"], name="contact_lea_source_9016fd_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["created_at"], name="contact_lea_create_2e9550_idx"),
        ),
    ]
