from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["email"], name="accounts_us_email_14d0e2_idx"),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["role"], name="accounts_us_role_42bd80_idx"),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["subscription"], name="accounts_us_subscr_36b03f_idx"),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["is_verified"], name="accounts_us_is_ver_456dad_idx"),
        ),
        migrations.AddIndex(
            model_name="otpcode",
            index=models.Index(fields=["email", "otp_type", "created_at"], name="accounts_ot_email_e8af37_idx"),
        ),
        migrations.AddIndex(
            model_name="otpcode",
            index=models.Index(fields=["phone", "otp_type", "created_at"], name="accounts_ot_phone_93dd2f_idx"),
        ),
        migrations.AddIndex(
            model_name="otpcode",
            index=models.Index(fields=["otp", "otp_type", "is_used"], name="accounts_ot_otp_5a6af9_idx"),
        ),
        migrations.AddIndex(
            model_name="passwordresettoken",
            index=models.Index(fields=["token", "is_used"], name="accounts_pa_token_53d78d_idx"),
        ),
        migrations.AddIndex(
            model_name="passwordresettoken",
            index=models.Index(fields=["user", "created_at"], name="accounts_pa_user_i_fce444_idx"),
        ),
    ]
