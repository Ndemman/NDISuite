"""
Rate limiting utilities and custom rate limiting functions for NDISuite.
"""
from functools import wraps
from django.http import HttpResponse
from django.core.cache import cache
from django.conf import settings
import time
import logging

logger = logging.getLogger('ndisuite')

def get_client_ip(request):
    """
    Get the client IP address from the request.
    
    Args:
        request: The Django request object
    
    Returns:
        String IP address
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def rate_limit(key_prefix, limit=5, period=60, block=True):
    """
    Rate limit decorator with customizable key, limit, and period.
    
    Args:
        key_prefix: Prefix for the cache key
        limit: Maximum number of requests allowed in the period
        period: Time period in seconds
        block: Whether to block the request if rate limited
        
    Returns:
        Decorator function
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(self, request, *args, **kwargs):
            # Get client IP
            client_ip = get_client_ip(request)
            
            # Create a cache key using the prefix and IP
            key = f"{key_prefix}:{client_ip}"
            
            # Get current count and timestamp from cache
            cache_data = cache.get(key)
            
            current_time = time.time()
            if cache_data is None:
                # First request, set initial data
                cache_data = {
                    'count': 1,
                    'timestamp': current_time
                }
                cache.set(key, cache_data, period)
            else:
                # Check if period has elapsed
                if current_time - cache_data['timestamp'] > period:
                    # Period elapsed, reset counter
                    cache_data = {
                        'count': 1,
                        'timestamp': current_time
                    }
                    cache.set(key, cache_data, period)
                else:
                    # Increment counter
                    cache_data['count'] += 1
                    if cache_data['count'] > limit:
                        # Rate limit exceeded
                        logger.warning(f"Rate limit exceeded for {key_prefix} by {client_ip}")
                        if block:
                            return HttpResponse(
                                "Too many requests. Please try again later.",
                                status=429
                            )
                    cache.set(key, cache_data, period)
                
            # Log rate limiting information for debugging
            if getattr(settings, 'DEBUG', False):
                logger.debug(f"Rate limit for {key}: {cache_data['count']}/{limit}")
                
            # Call the original view function
            return view_func(self, request, *args, **kwargs)
        return _wrapped_view
    return decorator
