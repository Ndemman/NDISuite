"""Custom CSRF middleware to handle browser preview requests.

This module provides a custom CSRF middleware that allows requests from
the browser preview proxy to pass CSRF validation by dynamically adding
the request's origin to the trusted origins list.
"""
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware


class BrowserPreviewCsrfMiddleware(CsrfViewMiddleware):
    """
    Custom CSRF middleware that dynamically adds the origin of the request
    to the trusted origins list if it contains '127.0.0.1' or 'localhost'.
    
    This allows browser preview requests to pass CSRF validation without
    having to hardcode specific port numbers in settings.
    """
    
    def process_request(self, request):
        """Process the request and add its origin to trusted origins if needed."""
        # Get the Origin header from the request
        origin = request.META.get('HTTP_ORIGIN')
        
        # If the origin contains localhost or 127.0.0.1, add it to trusted origins
        if origin and ('127.0.0.1' in origin or 'localhost' in origin):
            # Initialize CSRF_TRUSTED_ORIGINS if it doesn't exist
            if not hasattr(settings, 'CSRF_TRUSTED_ORIGINS'):
                settings.CSRF_TRUSTED_ORIGINS = []
            
            # Add the origin to trusted origins if it's not already there
            if origin not in settings.CSRF_TRUSTED_ORIGINS:
                settings.CSRF_TRUSTED_ORIGINS.append(origin)
        
        # Call the parent's process_request method
        return super().process_request(request)
