"""
MindBridge — Django Settings
==============================
Uses SQLite by default (no database setup required).
All heavy AI models are optional — keyword fallback is built in.
"""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY — change this before deploying to production!
SECRET_KEY = 'mindbridge-local-dev-secret-key-change-in-production-xyz789'

DEBUG = True
ALLOWED_HOSTS = ['*']  # Fine for local development

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'corsheaders',
    'channels',
    # MindBridge apps
    'apps.users',
    'apps.chat',
    'apps.moderation',
    'apps.dashboard',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be first
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mindbridge.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

# ── Database ─────────────────────────────────────────────
# SQLite — works out of the box, no setup needed
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# To use PostgreSQL instead, replace the above with:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'mindbridge_db',
#         'USER': 'postgres',
#         'PASSWORD': 'yourpassword',
#         'HOST': 'localhost',
#         'PORT': '5432',
#     }
# }

# ── WebSocket (Django Channels) ───────────────────────────
ASGI_APPLICATION = 'mindbridge.asgi.application'

# In-memory layer — no Redis needed for local development
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

# For production with Redis, use:
# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels_redis.core.RedisChannelLayer',
#         'CONFIG': {'hosts': [('127.0.0.1', 6379)]},
#     }
# }

# ── CORS (allow React dev server to call Django) ──────────
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# ── REST Framework ────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'],
    'DEFAULT_RENDERER_CLASSES':   ['rest_framework.renderers.JSONRenderer'],
}

# ── Static Files ──────────────────────────────────────────
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Console logging ───────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': { 'format': '[%(levelname)s] %(name)s: %(message)s' },
    },
    'handlers': {
        'console': { 'class': 'logging.StreamHandler', 'formatter': 'simple' },
    },
    'root': { 'handlers': ['console'], 'level': 'INFO' },
    'loggers': {
        'django': { 'handlers': ['console'], 'level': 'WARNING', 'propagate': False },
    },
}
