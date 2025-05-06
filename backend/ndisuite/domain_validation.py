"""
Email domain validation utilities for NDISuite.

This module provides functions to validate email domains for 
OAuth and other authentication methods.
"""
from django.conf import settings
import logging

logger = logging.getLogger('ndisuite')

def is_allowed_email_domain(email, provider=None):
    """
    Check if the email domain is allowed based on the configured allowed domains.
    
    Args:
        email: User email address
        provider: Optional OAuth provider ('google', 'microsoft', etc.)
        
    Returns:
        Boolean indicating if the domain is allowed
    """
    # If ALLOWED_EMAIL_DOMAINS is not configured or is empty, allow all domains
    allowed_domains = getattr(settings, 'ALLOWED_EMAIL_DOMAINS', None)
    
    # If there's no restriction, allow all emails
    if not allowed_domains:
        return True
    
    # If provider-specific domains are configured, use those
    if provider:
        provider_domains = getattr(settings, f'ALLOWED_{provider.upper()}_EMAIL_DOMAINS', None)
        if provider_domains:
            allowed_domains = provider_domains
    
    try:
        # Extract domain from email
        domain = email.split('@')[1].lower()
        
        # Check if domain is in allowed list
        is_allowed = domain in allowed_domains
        
        # Log the result for audit purposes
        if not is_allowed:
            logger.warning(f"Email domain not allowed: {domain} from provider {provider}")
        
        return is_allowed
    except Exception as e:
        # Log the error but don't block by default
        logger.error(f"Error validating email domain for {email}: {str(e)}")
        return True  # Allow by default in case of errors
