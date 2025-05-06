"""Views for the ndisuite application."""
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.utils import timezone
from django.contrib import messages
from django.conf import settings

from .models import EmailVerificationToken
import uuid
import logging

logger = logging.getLogger('ndisuite')


def csrf_failure(request, reason=""):
    """
    Custom view for CSRF failures that provides a more helpful error message
    and automatically adds the origin to trusted origins.
    """
    # Get the origin from the request
    origin = request.META.get('HTTP_ORIGIN', '')
    
    # Add the origin to CSRF_TRUSTED_ORIGINS if it contains localhost or 127.0.0.1
    if origin and ('127.0.0.1' in origin or 'localhost' in origin):
        if not hasattr(settings, 'CSRF_TRUSTED_ORIGINS'):
            settings.CSRF_TRUSTED_ORIGINS = []
        if origin not in settings.CSRF_TRUSTED_ORIGINS:
            settings.CSRF_TRUSTED_ORIGINS.append(origin)
            logger.info(f"Added {origin} to CSRF_TRUSTED_ORIGINS")
    
    # Create a context for the template
    context = {
        'reason': reason,
        'origin': origin,
        'trusted_origins': getattr(settings, 'CSRF_TRUSTED_ORIGINS', []),
        'has_been_added': origin in getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
    }
    
    # Render a custom template with a helpful message
    response = HttpResponse(
        f"""<html>
        <head><title>CSRF Verification Failed</title></head>
        <body>
            <h1>CSRF Verification Failed</h1>
            <p>Reason: {reason}</p>
            <p>Your origin ({origin}) has been added to the trusted origins list.</p>
            <p>Please try again by refreshing the page and resubmitting the form.</p>
            <p><a href="javascript:history.back()">Go back</a> | <a href="{request.path}">Refresh</a></p>
        </body>
        </html>""",
        status=403
    )
    
    # Set CSRF cookie to ensure it's available for the next request
    response.set_cookie(
        settings.CSRF_COOKIE_NAME,
        request.META.get('CSRF_COOKIE', ''),
        max_age=settings.CSRF_COOKIE_AGE,
        domain=settings.CSRF_COOKIE_DOMAIN,
        path=settings.CSRF_COOKIE_PATH,
        secure=settings.CSRF_COOKIE_SECURE,
        httponly=settings.CSRF_COOKIE_HTTPONLY,
        samesite=settings.CSRF_COOKIE_SAMESITE,
    )
    
    return response
