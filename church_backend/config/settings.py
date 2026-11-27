"""
Django settings for FGPC Yelahanka
Church Finance Management System.
"""

from pathlib import Path
import os
import dj_database_url

from dotenv import load_dotenv


# ==========================================
# BASE DIRECTORY
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


# ==========================================
# SECURITY CONFIGURATION
# ==========================================

SECRET_KEY = os.environ["SECRET_KEY"]

DEBUG = (
    os.environ.get("DEBUG", "False").lower()
    == "true"
)


ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get(
        "ALLOWED_HOSTS",
        "localhost,127.0.0.1"
    ).split(",")
    if host.strip()
]


# Automatically allow Render hostname

RENDER_EXTERNAL_HOSTNAME = os.environ.get(
    "RENDER_EXTERNAL_HOSTNAME"
)

if RENDER_EXTERNAL_HOSTNAME:

    if RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:

        ALLOWED_HOSTS.append(
            RENDER_EXTERNAL_HOSTNAME
        )


# ==========================================
# INSTALLED APPLICATIONS
# ==========================================

INSTALLED_APPS = [

    # Django applications

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party applications

    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "django_filters",

    # Church finance applications

    "families",
    "offerings",
    "expenses",
    "receipts",
    "vouchers",
    "reports",
    "accounts",
    "church_settings",
    "backups",
    "audit_logs",

]


# ==========================================
# MIDDLEWARE
# ==========================================

MIDDLEWARE = [

    "django.middleware.security.SecurityMiddleware",

    "corsheaders.middleware.CorsMiddleware",

    "whitenoise.middleware.WhiteNoiseMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",

]


# ==========================================
# URL CONFIGURATION
# ==========================================

ROOT_URLCONF = "config.urls"


# ==========================================
# TEMPLATES
# ==========================================

TEMPLATES = [

    {
        "BACKEND": (
            "django.template.backends.django.DjangoTemplates"
        ),

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


# ==========================================
# DATABASE CONFIGURATION
# ==========================================

DATABASE_URL = os.environ.get("DATABASE_URL")


if DATABASE_URL:

    # PostgreSQL - Render production database

    DATABASES = {

        "default": dj_database_url.parse(

            DATABASE_URL,

            conn_max_age=600,

            conn_health_checks=True,

        )

    }

else:

    # Prevent accidental SQLite usage in production

    if not DEBUG:

        raise RuntimeError(
            "DATABASE_URL is required in production."
        )

    # SQLite - Local development

    DATABASES = {

        "default": {

            "ENGINE": "django.db.backends.sqlite3",

            "NAME": BASE_DIR / "db.sqlite3",

        }

    }


# ==========================================
# PASSWORD VALIDATION
# ==========================================

AUTH_PASSWORD_VALIDATORS = [

    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },

    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),

        "OPTIONS": {

            "min_length": 12,

        },
    },

    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },

    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },

]


# ==========================================
# INTERNATIONALIZATION
# ==========================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True


# ==========================================
# STATIC FILES
# ==========================================

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# ==========================================
# MEDIA FILES
# ==========================================

MEDIA_URL = "/media/"


MEDIA_ROOT = Path(

    os.environ.get(

        "MEDIA_ROOT",

        str(BASE_DIR / "media"),

    )

)


# ==========================================
# FILE STORAGE CONFIGURATION
# ==========================================

STORAGES = {

    "default": {

        "BACKEND": (
            "django.core.files.storage.FileSystemStorage"
        ),

    },

    "staticfiles": {

        "BACKEND": (

            "django.contrib.staticfiles.storage.StaticFilesStorage"

            if DEBUG

            else

            "whitenoise.storage.CompressedManifestStaticFilesStorage"

        ),

    },

}


# ==========================================
# DATABASE BACKUP
# ==========================================

BACKUP_ROOT = Path(

    os.environ.get(

        "BACKUP_ROOT",

        str(BASE_DIR / "database_backups"),

    )

)


# ==========================================
# DEFAULT PRIMARY KEY
# ==========================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ==========================================
# EMAIL CONFIGURATION
# ==========================================

MAILERS = {

    "default": {

        "BACKEND": (

            "django.core.mail.backends.console.EmailBackend"

            if DEBUG

            else

            "django.core.mail.backends.dummy.EmailBackend"

        ),

    },

}


# ==========================================
# FRONTEND CONNECTION - CORS
# ==========================================

CORS_ALLOW_ALL_ORIGINS = False


CORS_ALLOWED_ORIGINS = [

    origin.strip()

    for origin in os.environ.get(

        "CORS_ALLOWED_ORIGINS",

        (
            "http://localhost:5173,"
            "http://127.0.0.1:5173"
            if DEBUG
            else ""
        )

    ).split(",")

    if origin.strip()

]


# ==========================================
# CSRF TRUSTED ORIGINS
# ==========================================

CSRF_TRUSTED_ORIGINS = [

    origin.strip()

    for origin in os.environ.get(

        "CSRF_TRUSTED_ORIGINS",

        (
            "http://localhost:5173,"
            "http://127.0.0.1:5173"
            if DEBUG
            else ""
        )

    ).split(",")

    if origin.strip()

]


# Automatically trust Render HTTPS origin

if RENDER_EXTERNAL_HOSTNAME:

    render_origin = (
        f"https://{RENDER_EXTERNAL_HOSTNAME}"
    )

    if render_origin not in CSRF_TRUSTED_ORIGINS:

        CSRF_TRUSTED_ORIGINS.append(
            render_origin
        )


# ==========================================
# DJANGO REST FRAMEWORK
# ==========================================

REST_FRAMEWORK = {

    "DEFAULT_AUTHENTICATION_CLASSES": [

        "rest_framework.authentication.TokenAuthentication",

        "rest_framework.authentication.SessionAuthentication",

    ],

    "DEFAULT_PERMISSION_CLASSES": [

        "rest_framework.permissions.IsAuthenticated",

    ],

    "DEFAULT_FILTER_BACKENDS": [

        "django_filters.rest_framework.DjangoFilterBackend",

        "rest_framework.filters.SearchFilter",

        "rest_framework.filters.OrderingFilter",

    ],

}


# ==========================================
# SESSION SECURITY
# ==========================================

SESSION_COOKIE_HTTPONLY = True

# 8 hours

SESSION_COOKIE_AGE = 28800

SESSION_EXPIRE_AT_BROWSER_CLOSE = True

SESSION_COOKIE_SAMESITE = "Lax"

CSRF_COOKIE_SAMESITE = "Lax"


# ==========================================
# BROWSER SECURITY
# ==========================================

SECURE_CONTENT_TYPE_NOSNIFF = True

X_FRAME_OPTIONS = "DENY"

SECURE_REFERRER_POLICY = "same-origin"


# ==========================================
# PRODUCTION SECURITY
# ==========================================

if not DEBUG:

    # Render HTTPS proxy configuration

    SECURE_PROXY_SSL_HEADER = (

        "HTTP_X_FORWARDED_PROTO",

        "https",

    )

    SECURE_SSL_REDIRECT = True

    SESSION_COOKIE_SECURE = True

    CSRF_COOKIE_SECURE = True