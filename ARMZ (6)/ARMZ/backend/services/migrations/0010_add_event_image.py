from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0009_add_job_skills'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='image',
            field=models.ImageField(upload_to='events/', null=True, blank=True),
        ),
    ]
