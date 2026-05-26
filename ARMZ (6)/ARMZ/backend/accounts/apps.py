import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        from django.conf import settings

        if getattr(settings, "RUNNING_TESTS", False):
            return

        try:
            from accounts.services import bootstrap_prime_admin

            bootstrap_prime_admin()
        except Exception as exc:
            logger.warning("Prime admin bootstrap skipped: %s", exc)
