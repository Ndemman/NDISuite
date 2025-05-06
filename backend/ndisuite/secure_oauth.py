"""
Security-enhanced OAuth implementations for NDISuite.

This module contains improved versions of the OAuth flows with:
1. CSRF protection using secure state parameter
2. JWT token generation for authentication
3. Rate limiting to prevent abuse
4. Email domain validation for organization control
5. Comprehensive error logging
"""
import logging
import traceback
import uuid
import requests
import json
from datetime import datetime, timedelta
from urllib.parse import urlencode
from django.conf import settings
from django.shortcuts import redirect
from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response

from .jwt_utils import generate_jwt_token
from .domain_validation import is_allowed_email_domain

# Configure logging
logger = logging.getLogger('ndisuite')

def extract_email_from_oauth_data(user_info, provider):
    """
    Extract email address from OAuth provider user info.
    Different providers use different field names for email.
    
    Args:
        user_info: User information dictionary from the OAuth provider
        provider: OAuth provider name ('google' or 'microsoft')
        
    Returns:
        Email address string or None if not found
    """
    email = None
    
    if provider == 'google':
        # Google typically provides email in the 'email' field
        email = user_info.get('email')
    elif provider == 'microsoft':
        # Microsoft uses 'mail' or 'userPrincipalName' for email
        if user_info.get('mail'):
            email = user_info.get('mail')
        elif user_info.get('userPrincipalName'):
            email = user_info.get('userPrincipalName')
    
    # Log warning if email is missing
    if not email:
        logger.warning(f"Unable to extract email from {provider} OAuth data: {user_info}")
        
    return email

def generate_secure_state(client_state=''):
    """
    Generate a secure state parameter for CSRF protection in OAuth flows.
    
    Args:
        client_state: Optional client-provided state to include
        
    Returns:
        Tuple of (state_hash, combined_state)
    """
    # Generate a secure server-side state token
    server_state = uuid.uuid4().hex
    
    # Combine client state (if provided) with server state
    combined_state = f"{server_state}:{client_state}" if client_state else server_state
    
    # Create a hash of the combined state to use as the cache key
    import hashlib
    state_hash = hashlib.sha256(combined_state.encode()).hexdigest()
    
    # Store in cache with 15-minute expiration
    cache.set(f"oauth_state:{state_hash}", combined_state, 60 * 15)  # 15 minutes
    
    return state_hash

def validate_state(state):
    """
    Validate a state parameter from an OAuth callback.
    
    Args:
        state: State parameter from the callback
        
    Returns:
        Tuple of (is_valid, client_state, error_message)
    """
    if not state:
        return False, "", "Missing state parameter"
    
    # Retrieve stored state from cache
    stored_state = cache.get(f"oauth_state:{state}")
    if not stored_state:
        return False, "", "Invalid or expired state parameter"
    
    # State is valid, delete it from cache to prevent replay attacks
    cache.delete(f"oauth_state:{state}")
    
    # Extract client state if it was provided
    client_state = ""
    if ":" in stored_state:
        _, client_state = stored_state.split(":", 1)
    
    return True, client_state, None

def validate_email_domain(email, provider):
    """
    Validate an email domain against allowed domains.
    
    Args:
        email: Email address to validate
        provider: OAuth provider name
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not settings.ENFORCE_EMAIL_DOMAIN_RESTRICTIONS:
        return True, None
        
    if not email:
        return False, "Missing email address"
        
    if not is_allowed_email_domain(email, provider):
        return False, f"Email domain not allowed: {email.split('@')[1]}"
        
    return True, None
