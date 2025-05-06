"""
OAuth utility functions for NDISuite.
"""
import logging

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
