"""
Development authentication module for Django REST Framework.
This module provides a custom authentication class that accepts a development token.
Only use this in development environments, never in production.
"""
from rest_framework import authentication
from rest_framework import exceptions
from django.contrib.auth.models import User
from django.conf import settings

class DevelopmentAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class that accepts a development token.
    This should only be used in development environments.
    """
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header:
            return None
            
        try:
            # Extract the token
            auth_parts = auth_header.split()
            
            if auth_parts[0].lower() != 'bearer':
                return None
                
            if len(auth_parts) != 2:
                return None
                
            token = auth_parts[1]
            
            # Accept the development token only in DEBUG mode
            if settings.DEBUG and token == 'dev-access-token':
                # Get or create a development user
                user, created = User.objects.get_or_create(
                    username='dev_user',
                    defaults={
                        'email': 'dev@example.com',
                        'first_name': 'Development',
                        'last_name': 'User',
                        'is_active': True
                    }
                )
                
                return (user, None)
                
            # For other tokens, let other authentication classes handle them
            return None
                
        except Exception as e:
            return None
            
    def authenticate_header(self, request):
        return 'Bearer'
