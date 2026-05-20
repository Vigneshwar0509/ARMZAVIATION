from .settings import *  # noqa: F401,F403

DEBUG = False
DATABASE_ENGINE = env("DATABASE_ENGINE", default="django.db.backends.mysql")
DATABASE_URL = env("DATABASE_URL", default="")

if DATABASE_URL:
    DATABASES = parse_database_url(DATABASE_URL)
elif DATABASE_ENGINE == "django.db.backends.postgresql":
    DATABASES = {
        "default": {
            "ENGINE": DATABASE_ENGINE,
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

DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", 60)
DATABASES["default"]["ATOMIC_REQUESTS"] = True
