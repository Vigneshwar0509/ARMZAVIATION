import os
import sys
import importlib
from datetime import timedelta
from pathlib import Path
from urllib.parse import unquote_plus, urlparse

from decouple import Config, Csv, RepositoryEnv, config as decouple_config
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent


def _module_available(module_name: str) -> bool:
    try:
        importlib.import_module(module_name)
        return True
    except ModuleNotFoundError:
        return False

env_file_path = BASE_DIR / os.getenv("DJANGO_ENV_FILE", ".env")
if env_file_path.exists():
    config = Config(RepositoryEnv(env_file_path))
else:
    config = decouple_config


class EnvWrapper:
    def __init__(self, config):
        self._config = config

    def __call__(self, key: str, default=None, cast=None):
        if cast is None:
            return self._config(key, default=default)
        return self._config(key, default=default, cast=cast)

    def int(self, key: str, default=0):
        return self(key, default=default, cast=int)

    def bool(self, key: str, default=False):
        return self(key, default=default, cast=bool)

    def list(self, key: str, default="", cast=Csv()):
        return self(key, default=default, cast=cast)


env = EnvWrapper(config)


def parse_database_url(url: str) -> dict:
    parsed = urlparse(url)
    engine_map = {
        "postgres": "django.db.backends.postgresql",
        "postgresql": "django.db.backends.postgresql",
        "mysql": "django.db.backends.mysql",
        "sqlite": "django.db.backends.sqlite3",
    }
    engine = engine_map.get(parsed.scheme)
    if not engine:
        raise ImproperlyConfigured(f"Unsupported DATABASE_URL scheme: {parsed.scheme}")

    if engine == "django.db.backends.sqlite3":
        name = parsed.path[1:] or os.getenv("DB_NAME", ":memory:")
        return {"default": {"ENGINE": engine, "NAME": name}}

    return {
        "default": {
            "ENGINE": engine,
            "NAME": parsed.path[1:],
            "USER": unquote_plus(parsed.username or ""),
            "PASSWORD": unquote_plus(parsed.password or ""),
            "HOST": parsed.hostname or "",
            "PORT": parsed.port or "",
        }
    }

DEBUG = env("DEBUG", default=False, cast=bool)
SECRET_KEY = env("SECRET_KEY", default="django-insecure-change-me-in-env")
ALLOWED_HOSTS = env("ALLOWED_HOSTS", default="localhost,127.0.0.1,testserver", cast=Csv())
RUNNING_TESTS = any(arg in sys.argv for arg in ("test", "pytest"))

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "accounts",
    "core",
    "services.apps.ServicesConfig",
    "bookings",
    "payments",
    "reviews",
    "contact",
    "tenants",
]

if _module_available("django_prometheus"):
    INSTALLED_APPS.append("django_prometheus")

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "config.middleware.GlobalExceptionMiddleware",
    "config.middleware.SecurityRequestBlockingMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "tenants.middleware.TenantMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "config.rbac.RBACMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "config.middleware.SecurityHeadersMiddleware",
]

if _module_available("django_prometheus"):
    MIDDLEWARE.insert(1, "django_prometheus.middleware.PrometheusBeforeMiddleware")
    MIDDLEWARE.append("django_prometheus.middleware.PrometheusAfterMiddleware")

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASE_URL = env("DATABASE_URL")
DB_ENGINE = env("DATABASE_ENGINE")
DB_CONN_MAX_AGE = env.int("DB_CONN_MAX_AGE", 60)

if DATABASE_URL:
    DATABASES = parse_database_url(DATABASE_URL)
elif DB_ENGINE == "django.db.backends.postgresql":
    DATABASES = {
        "default": {
            "ENGINE": DB_ENGINE,
            "NAME": env("POSTGRES_DB"),
            "USER": env("POSTGRES_USER"),
            "PASSWORD": env("POSTGRES_PASSWORD"),
            "HOST": env("POSTGRES_HOST"),
            "PORT": env("POSTGRES_PORT"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": env("MYSQL_DB"),
            "USER": env("MYSQL_USER"),
            "PASSWORD": env("MYSQL_PASSWORD"),
            "HOST": env("MYSQL_HOST"),
            "PORT": env("MYSQL_PORT"),
            "OPTIONS": {
                "charset": "utf8mb4",
                "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        }
    }

DATABASES["default"]["CONN_MAX_AGE"] = DB_CONN_MAX_AGE
DATABASES["default"]["ATOMIC_REQUESTS"] = True

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = env("STATIC_URL", default="/static/")
STATIC_ROOT = env("STATIC_ROOT", default=str(BASE_DIR / "staticfiles"))
if not os.path.isabs(STATIC_ROOT):
    STATIC_ROOT = str(BASE_DIR / STATIC_ROOT)
STATICFILES_STORAGE = env(
    "STATICFILES_STORAGE",
    default="whitenoise.storage.CompressedManifestStaticFilesStorage",
)
MEDIA_URL = env("MEDIA_URL", default="/media/")
MEDIA_ROOT = env("MEDIA_ROOT", default=str(BASE_DIR / "media"))
if not os.path.isabs(MEDIA_ROOT):
    MEDIA_ROOT = str(BASE_DIR / MEDIA_ROOT)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

REDIS_URL = env("REDIS_URL")
CELERY_BROKER_URL = env("CELERY_BROKER_URL") or REDIS_URL
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND") or REDIS_URL

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
        },
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"
SESSION_CACHE_ALIAS = "default"
SESSION_COOKIE_AGE = 1209600
SESSION_SAVE_EVERY_REQUEST = False

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default="", cast=Csv())
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default="", cast=Csv())
CORS_ALLOW_CREDENTIALS = True

SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT") and not DEBUG
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE") and not DEBUG
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE") and not DEBUG
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", 0) if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
X_FRAME_OPTIONS = "DENY"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin-allow-popups"

GOOGLE_CLIENT_IDS = env.list("GOOGLE_CLIENT_IDS", default="", cast=Csv())
PRIME_ADMIN_EMAIL = env("PRIME_ADMIN_EMAIL", default="")
PRIME_ADMIN_PASSWORD = env("PRIME_ADMIN_PASSWORD", default="")

EMAIL_BACKEND = env("EMAIL_BACKEND")
EMAIL_HOST = env("EMAIL_HOST")
EMAIL_PORT = env.int("EMAIL_PORT")
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS")
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL")
CONTACT_INBOX_EMAIL = env("CONTACT_INBOX_EMAIL")
BREVO_API_KEY = env("BREVO_API_KEY", default="")

# Feature flag to enable/disable email OTP verification
# Set to False in production if external SMTP/email services are unreachable
# Set to True in development for testing OTP flow
ENABLE_EMAIL_OTP = env.bool("ENABLE_EMAIL_OTP", default=False)

AUTH_COOKIE_ACCESS = env("AUTH_COOKIE_ACCESS", default="access_token")
AUTH_COOKIE_REFRESH = env("AUTH_COOKIE_REFRESH", default="refresh_token")
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER")

SENTRY_DSN = env("SENTRY_DSN")
RAZORPAY_KEY_ID = env("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = env("RAZORPAY_KEY_SECRET")

SIMPLE_JWT = {
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("ACCESS_TOKEN_LIFETIME_MINUTES", 30)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("REFRESH_TOKEN_LIFETIME_DAYS", 7)),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
    "TOKEN_USER_CLASS": "accounts.models.User",
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "config.authentication.CookieJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": (
        "config.renderers.StandardizedJSONRenderer",
    ),
    "DEFAULT_PAGINATION_CLASS": "config.pagination.StandardPageNumberPagination",
    "DEFAULT_FILTER_BACKENDS": (
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
    "DEFAULT_VERSION": "v1",
    "ALLOWED_VERSIONS": ("v1", "v2"),
    "EXCEPTION_HANDLER": "config.exception_handler.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": (
        "config.throttling.GlobalUserRateThrottle",
        "config.throttling.GlobalAnonRateThrottle",
        "config.throttling.IPRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "user": "1200/minute",
        "anon": "300/minute",
        "ip": "300/minute",
        "auth_login": "5/minute",
        "auth_register": "3/minute",
        "password_reset": "3/hour",
        "otp_send": "3/minute",
        "otp_verify": "3/minute",
        "payments": "20/minute",
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "ARMZ API",
    "DESCRIPTION": "ARMZ SaaS API for authentication, bookings, payments, and tenant-aware operations.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": r"/api/v[0-9]/",
    "COMPONENT_SPLIT_REQUEST": True,
    "PREPROCESSING_HOOKS": ["config.openapi.custom_preprocessing_hook"],
}

LOG_LEVEL = env("LOG_LEVEL")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "config.logging_utils.StructuredJsonFormatter",
        },
        "simple": {
            "format": "%(levelname)s %(asctime)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "api.request": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
    },
}

if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
        from sentry_sdk.integrations.redis import RedisIntegration

        sentry_logging = LoggingIntegration(level=None, event_level=None)
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[DjangoIntegration(), CeleryIntegration(), sentry_logging, RedisIntegration()],
            send_default_pii=True,
            traces_sample_rate=0.05,
            environment="production" if not DEBUG else "development",
            release=os.getenv("SENTRY_RELEASE"),
        )
    except ImportError:
        pass

TENANT_API_KEY = env("TENANT_API_KEY")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "structured": {
            "()": "config.logging_utils.StructuredConsoleFormatter",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "structured",
        }
    },
    "loggers": {
        "": {"handlers": ["console"], "level": "INFO"},
        "django.server": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "api.request": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}

# ========== PRODUCTION ENHANCEMENTS ==========

# API Versioning
API_VERSION = "v1"
API_DEFAULT_VERSION = "v1"

# Sentry Configuration for Error Tracking
SENTRY_DSN = env("SENTRY_DSN", default="")
SENTRY_RELEASE = env("SENTRY_RELEASE", default="1.0.0")
SENTRY_ENVIRONMENT = env("SENTRY_ENVIRONMENT", default="development")
SENTRY_TRACE_SAMPLE_RATE = float(env("SENTRY_TRACE_SAMPLE_RATE", default=0.1 if not DEBUG else 0.0))
SENTRY_PROFILE_SAMPLE_RATE = float(env("SENTRY_PROFILE_SAMPLE_RATE", default=0.1 if not DEBUG else 0.0))
SENTRY_MAX_REQUEST_BODY_SIZE = 4096
SENTRY_SERVER_NAME = env("SENTRY_SERVER_NAME", default="")
ENVIRONMENT = env("ENVIRONMENT", default="development")

# Initialize Sentry
if SENTRY_DSN:
    from config.sentry import initialize_sentry
    initialize_sentry()

# Redis Configuration (Cache & Sessions)
REDIS_URL = env("REDIS_URL", default="")

if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "PARSER_KWARGS": {"encoding": "utf8"},
                "POOL_KWARGS": {"max_connections": 50},
                # Keep API reads working if Redis is temporarily unavailable.
                "IGNORE_EXCEPTIONS": True,
            },
            "TIMEOUT": 300,
        }
    }
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "armz-local-cache",
            "TIMEOUT": 300,
        }
    }
    SESSION_ENGINE = "django.contrib.sessions.backends.db"

# DRF Spectacular (Swagger/OpenAPI Documentation)
INSTALLED_APPS.extend([
    "drf_spectacular",
    "drf_spectacular_sidecar",
])

SPECTACULAR_SETTINGS = {
    "TITLE": "ARMZ Aviation Platform API",
    "DESCRIPTION": "Production-grade aviation institute management platform",
    "VERSION": API_VERSION,
    "SERVE_INCLUDE_SCHEMA": True,
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "filter": True,
    },
    "SCHEMA_PATH_PREFIX": r"/api/v\d+/",
    "DEFAULT_GENERATOR_CLASS": "drf_spectacular.generators.SchemaGenerator",
    "PREPROCESSING_HOOKS": ["config.openapi.custom_preprocessing_hook"],
    "POSTPROCESSING_HOOKS": ["drf_spectacular.openapi.postprocess_schema_enum_names"],
    "ENUM_USE_INTEGER_VALUES": False,
    "APPEND_COMPONENTS": {
        "securitySchemes": {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            },
            "cookieAuth": {
                "type": "apiKey",
                "in": "cookie",
                "name": AUTH_COOKIE_ACCESS,
            }
        }
    },
    "SECURITY": [
        {"bearerAuth": []},
        {"cookieAuth": []}
    ],
}

# Enhanced Rate Limiting
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

class StrictAnonRateThrottle(AnonRateThrottle):
    scope = "anon_strict"

class StrictUserRateThrottle(UserRateThrottle):
    scope = "user_strict"

REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"].update({
    "anon_strict": "20/minute",  # Strict for login, register
    "user_strict": "100/minute",  # Strict for sensitive ops
    "auth_login": "5/minute",
    "auth_register": "3/minute",
    "password_reset": "3/minute",
    "otp_send": "3/minute",
    "otp_verify": "3/minute",
    "ip": "600/minute",
})

# Content Security Policy Headers
CSP_DIRECTIVES = {
    "default-src": ("'self'",),
    "script-src": ("'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "accounts.google.com"),
    "style-src": ("'self'", "'unsafe-inline'", "fonts.googleapis.com"),
    "img-src": ("'self'", "data:", "https:", "gravatar.com"),
    "font-src": ("'self'", "fonts.gstatic.com"),
    "connect-src": ("'self'", "accounts.google.com", "sentry.io"),
    "frame-src": ("'self'", "accounts.google.com"),
    "base-uri": ("'self'",),
    "form-action": ("'self'",),
}

# Webhook Security for Payments
RAZORPAY_WEBHOOK_SECRET = env("RAZORPAY_WEBHOOK_SECRET")
PAYMENT_WEBHOOK_TIMEOUT = 30  # seconds
PAYMENT_WEBHOOK_RETRIES = 3
PAYMENT_WEBHOOK_SIGNATURE_ALGO = "sha256"

# Database Connection Pooling
if DATABASES["default"]["ENGINE"] == "django.db.backends.mysql":
    DATABASES["default"]["CONN_MAX_AGE"] = 600
    DATABASES["default"].setdefault("OPTIONS", {})["autocommit"] = True

# Celery Configuration (if using async tasks)
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes

# API Documentation  
REST_FRAMEWORK["DEFAULT_SCHEMA_CLASS"] = "drf_spectacular.openapi.AutoSchema"
