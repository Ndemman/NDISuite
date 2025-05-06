from rest_framework.throttling import ScopedRateThrottle

class AuthRateThrottle(ScopedRateThrottle):
    """
    Throttling class for authentication endpoints.
    
    This applies different rate limits based on the throttle_scope attribute set on views:
    - auth_login: 5 per minute
    - auth_register: 10 per hour
    - password_reset: 5 per hour
    
    These rates are defined in settings.py under REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']
    """
    scope_attr = 'throttle_scope'
    
    def get_cache_key(self, request, view):
        """
        Generate a cache key based on the request's IP address and the throttle scope.
        
        For extra security, we could also consider tracking by username for login attempts
        to prevent brute force attacks on specific accounts.
        """
        # Get the scope from the view
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }
