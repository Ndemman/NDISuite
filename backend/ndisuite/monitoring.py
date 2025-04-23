"""
Monitoring configuration for the NDISuite application.
"""
import os
import logging
from django.conf import settings
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.celery import CeleryIntegration

logger = logging.getLogger(__name__)

def initialize_monitoring():
    """
    Initialize application monitoring and error tracking.
    """
    environment = os.environ.get("ENVIRONMENT", "development")
    
    # Initialize Sentry for error tracking if DSN is provided
    sentry_dsn = os.environ.get("SENTRY_DSN")
    if sentry_dsn:
        logger.info(f"Initializing Sentry monitoring for {environment} environment")
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                DjangoIntegration(),
                RedisIntegration(),
                CeleryIntegration(),
            ],
            traces_sample_rate=0.2 if environment == "production" else 1.0,
            environment=environment,
            send_default_pii=False,
            # Associate users with errors based on their ID
            release=os.environ.get("GIT_COMMIT_SHA", "development"),
        )
        logger.info("Sentry monitoring initialized successfully")
    else:
        logger.warning("Sentry DSN not provided, skipping error tracking setup")

    # Initialize performance monitoring
    if settings.DEBUG is False:
        logger.info("Setting up production performance monitoring")
        # Additional performance monitoring setup can go here
    else:
        logger.info("Development environment detected, using debug monitoring")

def capture_exception(exception, context=None):
    """
    Capture an exception and send to monitoring tools.
    
    Args:
        exception: The exception to capture
        context: Additional context to include
    """
    if os.environ.get("SENTRY_DSN"):
        sentry_sdk.capture_exception(exception)
    
    # Log the exception
    logger.exception(f"Error captured: {str(exception)}")
    
    # Add additional monitoring logic here if needed
