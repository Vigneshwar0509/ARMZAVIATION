import os
import sys

if __name__ == "__main__":
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    import django
    django.setup()

    from django.conf import settings
    from accounts.models import User

    email = os.environ.get("PRIME_ADMIN_EMAIL") or getattr(settings, "PRIME_ADMIN_EMAIL", "")
    password = os.environ.get("PRIME_ADMIN_PASSWORD")

    if not email:
        raise SystemExit("PRIME_ADMIN_EMAIL must be set in the environment or settings.")
    if not password:
        raise SystemExit("PRIME_ADMIN_PASSWORD must be set in the environment.")

    normalized_email = email.strip().lower()
    user = User.objects.filter(email__iexact=normalized_email).first()

    if not user:
        raise SystemExit(f"Prime admin user not found for email '{normalized_email}'.")

    user.set_password(password)
    user.save(update_fields=["password"])

    print(f"Updated password for prime admin '{normalized_email}'.")
