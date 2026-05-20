from .settings import *

DEBUG = True
ALLOWED_HOSTS = ["testserver", "localhost", "127.0.0.1"]

# Update throttle rates for tests
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"].update({
    "payments_verify": "100/minute",
    "payments_create_order": "100/minute",
    "payments_subscription": "100/minute",
})

# Use local in-memory cache during tests to avoid Redis dependency.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-cache",
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",
    }
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
