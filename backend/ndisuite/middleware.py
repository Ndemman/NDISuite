"""Custom middleware to clean up invalid user session data.

This addresses a ValidationError that occurs when the session contains an
invalid value (e.g., a UUID string) for the authenticated user primary key.
If the value stored in ``request.session[SESSION_KEY]`` cannot be converted to
an integer (the default type for ``auth_user.id``), the session is flushed so
that Django treats the request as anonymous. This prevents the error from
bubbling up and breaking the admin interface or any authenticated views.
"""
from django.contrib.auth import SESSION_KEY
from django.utils.deprecation import MiddlewareMixin


class CleanInvalidUserSessionMiddleware(MiddlewareMixin):
    """Flush the session if the stored user id is not a valid integer."""

    def process_request(self, request):
        user_id = request.session.get(SESSION_KEY)
        # Only act if there *is* a user id in the session.
        if user_id is None:
            return  # Nothing to clean

        try:
            # Django's default ``User`` PK is an integer. Attempt to cast.
            int(user_id)
        except (TypeError, ValueError):
            # Invalid value => clear session so request is anonymous
            request.session.flush()
