"""
Django settings for ndisuite project.
"""
import os
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-temporary-dev-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Application definition
INSTALLED_APPS = [
    # Django core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',  # required by allauth

    # Authentication apps
    'rest_framework.authtoken',  # required for dj-rest-auth
    'allauth',
    'allauth.account',
    'allauth.socialaccount',  # keep even if no social providers yet
    'allauth.socialaccount.providers.google',  # Added Google social login
    'dj_rest_auth',
    'dj_rest_auth.registration',

    # Third-party
    'rest_framework',
    'corsheaders',
    'django_filters',
    'channels',
    'django_celery_beat',
    'django_celery_results',

    # Local apps (custom users app removed for fresh start)
    'ndisuite',  # Core app for auth and email verification
    'reports',
    'transcription',
    'files',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # Replace standard CSRF middleware with our custom one
    'ndisuite.csrf.BrowserPreviewCsrfMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'ndisuite.middleware.CleanInvalidUserSessionMiddleware',
    # Required by django-allauth
    'allauth.account.middleware.AccountMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ndisuite.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ndisuite.wsgi.application'
ASGI_APPLICATION = 'ndisuite.asgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# MongoDB configuration for storing transcript data
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017')
MONGODB_DB = os.environ.get('MONGODB_DB', 'ndisuite')

# Redis connection for caching and Channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(os.environ.get('REDIS_HOST', 'localhost'), 
                      int(os.environ.get('REDIS_PORT', 6379)))],
        },
    },
}

# Caching with Redis
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f"redis://{os.environ.get('REDIS_HOST', 'localhost')}:{os.environ.get('REDIS_PORT', '6379')}/1",
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Fresh start: rely on default User model; custom user model removed
# AUTH_USER_MODEL = 'users.User'  # removed

# Django Allauth Settings
SITE_ID = 1

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",  # default
    "allauth.account.auth_backends.AuthenticationBackend",
]

# Django Allauth settings
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_USERNAME_REQUIRED = True  # Standard django-allauth requires username
ACCOUNT_AUTHENTICATION_METHOD = 'email'  # Use email for login

# Set stricter verification settings in production
if not DEBUG:
    ACCOUNT_EMAIL_VERIFICATION = 'mandatory'  # Force email verification in production
    ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = True
    ACCOUNT_SESSION_REMEMBER = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOWED_ORIGINS = [
        os.environ.get('FRONTEND_URL', 'https://app.ndisuite.com'),
    ]
else:
    ACCOUNT_EMAIL_VERIFICATION = 'optional'  # Optional in development for easier testing

# Frontend URL for auth redirect links
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Email settings
# For development (prints emails to console)
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    print("DEBUG MODE: Emails will be output to console")
# For production (uses Outlook SMTP)
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'smtp-mail.outlook.com'  # Outlook SMTP server
    EMAIL_PORT = 587  # Port for TLS
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')  # Outlook email address
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')  # Outlook email password

# Email settings common to both environments
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@ndisuite.app')

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # JWT authentication
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    # Rate limiting settings
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/hour',  # Limit anonymous users to 20 requests per hour
        'user': '1000/day',  # Limit authenticated users to 1000 requests per day
        'auth_login': '5/minute',  # Limit login attempts to 5 per minute
        'auth_register': '10/hour',  # Limit registration attempts to 10 per hour
        'password_reset': '5/hour',  # Limit password reset requests to 5 per hour
    },
}

# dj-rest-auth and JWT settings
REST_USE_JWT = True
JWT_AUTH_COOKIE = 'ndisuite-auth'  # Cookie name to store the access token
JWT_AUTH_REFRESH_COOKIE = 'ndisuite-refresh'  # Cookie name to store the refresh token
JWT_AUTH_SECURE = not DEBUG  # Only use secure cookies in production
JWT_AUTH_SAMESITE = 'Lax'  # Cookie security setting
OLD_PASSWORD_FIELD_ENABLED = True  # Enable old password field for password change

# Configure JWT token lifetime settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),  # Short-lived access tokens
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),  # Longer-lived refresh tokens
    'ROTATE_REFRESH_TOKENS': True,  # Generate new refresh token when refreshed
    'BLACKLIST_AFTER_ROTATION': True,  # Blacklist old refresh tokens
    'UPDATE_LAST_LOGIN': True,  # Update last login timestamp
    
    # Stronger algorithm in production
    'ALGORITHM': 'HS512' if not DEBUG else 'HS256',
    
    # Only validate the audience claim in production
    'AUDIENCE': os.environ.get('JWT_AUDIENCE') if not DEBUG else None,
    
    # Auth header prefix
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Social Authentication settings
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': os.environ.get('GOOGLE_CLIENT_ID', ''),
            'secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
            'key': ''
        },
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {
            'access_type': 'online',
        }
    },
    'facebook': {
        'APP': {
            'client_id': os.environ.get('FACEBOOK_CLIENT_ID', ''),
            'secret': os.environ.get('FACEBOOK_CLIENT_SECRET', ''),
            'key': ''
        },
        'SCOPE': ['email', 'public_profile'],
        'FIELDS': ['id', 'email', 'name', 'first_name', 'last_name', 'picture']
    },
    'microsoft': {
        'APP': {
            'client_id': os.environ.get('MICROSOFT_CLIENT_ID', ''),
            'secret': os.environ.get('MICROSOFT_CLIENT_SECRET', ''),
            'key': ''
        },
        'SCOPE': ['openid', 'email', 'profile'],
        'TENANT': 'common',
    }
}

# Custom serializers for dj-rest-auth
REST_AUTH_REGISTER_SERIALIZERS = {
    'REGISTER_SERIALIZER': 'ndisuite.serializers.CustomRegisterSerializer',
}

# JWT configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,  # Set to True if using token blacklist app
}

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True  # For development only
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# For specific origins if needed
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://127.0.0.1:62380,http://localhost:62380').split(',')

# CSRF settings - allow requests from browser preview proxy
# Our custom middleware will dynamically add origins with localhost/127.0.0.1
CSRF_TRUSTED_ORIGINS = [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'http://127.0.0.1:53737',  # Browser preview proxy port
    'http://localhost:53737',
]
CSRF_COOKIE_SAMESITE = None  # Allow cross-site cookies for development
CSRF_USE_SESSIONS = True  # Store CSRF token in the session instead of cookie
CSRF_COOKIE_SECURE = False  # Don't require HTTPS in development
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript to access the cookie
CSRF_FAILURE_VIEW = 'ndisuite.views.csrf_failure'  # Custom CSRF failure view

# Celery settings
CELERY_BROKER_URL = f"redis://{os.environ.get('REDIS_HOST', 'localhost')}:{os.environ.get('REDIS_PORT', '6379')}/0"
CELERY_RESULT_BACKEND = 'django-db'
CELERY_CACHE_BACKEND = 'default'
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# S3 Storage settings (if using S3 for media files)
DEFAULT_FILE_STORAGE = os.environ.get('DEFAULT_FILE_STORAGE', 'django.core.files.storage.FileSystemStorage')
if DEFAULT_FILE_STORAGE == 'storages.backends.s3boto3.S3Boto3Storage':
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME')
    AWS_S3_ENDPOINT_URL = os.environ.get('AWS_S3_ENDPOINT_URL')
    AWS_S3_CUSTOM_DOMAIN = os.environ.get('AWS_S3_CUSTOM_DOMAIN')
    AWS_DEFAULT_ACL = 'private'
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }

# OpenAI API settings for transcription and report generation
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
TRANSCRIPTION_MODEL = os.environ.get('TRANSCRIPTION_MODEL', 'whisper-1')
GENERATION_MODEL = os.environ.get('GENERATION_MODEL', 'gpt-4-turbo')
EMBEDDING_MODEL = os.environ.get('EMBEDDING_MODEL', 'text-embedding-3-large')
REFINING_MODEL = os.environ.get('REFINING_MODEL', 'gpt-4-turbo')
GEMMA_API_KEY = os.environ.get('GEMMA_API_KEY', '')
GENERATION_MODEL_GEMMA = os.environ.get('GENERATION_MODEL_GEMMA', 'gemma-27b')

# RAG settings
RAG_TOP_K = int(os.environ.get('RAG_TOP_K', '5'))

# OAuth settings for social authentication
# Frontend URL for building OAuth callback URLs
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Google OAuth settings
GOOGLE_OAUTH_CLIENT_ID = os.environ.get('GOOGLE_OAUTH_CLIENT_ID', '')
GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET', '')
GOOGLE_OAUTH_REDIRECT_URI = f"{os.environ.get('BACKEND_URL', 'http://localhost:8000')}/api/v1/auth/social/google/callback/"

# Microsoft OAuth settings
MICROSOFT_OAUTH_CLIENT_ID = os.environ.get('MICROSOFT_OAUTH_CLIENT_ID', '')
MICROSOFT_OAUTH_CLIENT_SECRET = os.environ.get('MICROSOFT_OAUTH_CLIENT_SECRET', '')
MICROSOFT_OAUTH_REDIRECT_URI = f"{os.environ.get('BACKEND_URL', 'http://localhost:8000')}/api/v1/auth/social/microsoft/callback/"

# OAuth scopes
GOOGLE_OAUTH_SCOPES = ['email', 'profile', 'openid']
MICROSOFT_OAUTH_SCOPES = ['openid', 'email', 'profile', 'User.Read']

# OAuth security settings
# Set to a list of domains to restrict social login to specific email domains
# Leave as None to allow all domains
ALLOWED_EMAIL_DOMAINS = os.environ.get('ALLOWED_EMAIL_DOMAINS', '').split(',') if os.environ.get('ALLOWED_EMAIL_DOMAINS') else None

# Provider-specific domain restrictions
ALLOWED_GOOGLE_EMAIL_DOMAINS = os.environ.get('ALLOWED_GOOGLE_EMAIL_DOMAINS', '').split(',') if os.environ.get('ALLOWED_GOOGLE_EMAIL_DOMAINS') else None
ALLOWED_MICROSOFT_EMAIL_DOMAINS = os.environ.get('ALLOWED_MICROSOFT_EMAIL_DOMAINS', '').split(',') if os.environ.get('ALLOWED_MICROSOFT_EMAIL_DOMAINS') else None

# Whether to enforce email domain restrictions
ENFORCE_EMAIL_DOMAIN_RESTRICTIONS = os.environ.get('ENFORCE_EMAIL_DOMAIN_RESTRICTIONS', 'False').lower() == 'true'

# LangChain settings
VECTOR_STORE_TYPE = os.environ.get('VECTOR_STORE_TYPE', 'chroma')
VECTOR_STORE_PATH = os.environ.get('VECTOR_STORE_PATH', os.path.join(BASE_DIR, 'vector_db'))

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'ndisuite.log'),
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': True,
        },
        'ndisuite': {
            'handlers': ['console', 'file'],
            'level': os.environ.get('APP_LOG_LEVEL', 'DEBUG'),
            'propagate': True,
        },
    },
}

# --- Allauth: e‑mail‑only login
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'optional'

