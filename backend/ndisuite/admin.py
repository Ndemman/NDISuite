"""
Admin interface configuration for NDISuite core app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import EmailVerificationToken
import logging

logger = logging.getLogger('ndisuite')


class SafeUserAdmin(UserAdmin):
    """
    Custom User admin that safely handles deletion operations
    by bypassing the admin logging that causes foreign key constraint errors.
    """
    def delete_model(self, request, obj):
        """
        Override delete_model to bypass admin logging
        """
        try:
            # Get all tokens for this user first
            tokens = EmailVerificationToken.objects.filter(user=obj)
            # Delete all tokens
            for token in tokens:
                token.delete()
                
            # Delete the user without logging
            obj.delete()
            logger.info(f"Successfully deleted user: {obj.username}")
        except Exception as e:
            logger.error(f"Error deleting user: {str(e)}")
            raise
    
    def delete_queryset(self, request, queryset):
        """
        Override delete_queryset to bypass admin logging for bulk deletions
        """
        try:
            # For each user in the queryset, delete their tokens first
            for user in queryset:
                tokens = EmailVerificationToken.objects.filter(user=user)
                for token in tokens:
                    token.delete()
            
            # Then delete the users without logging
            queryset.delete()
            logger.info(f"Successfully deleted {queryset.count()} users")
        except Exception as e:
            logger.error(f"Error deleting users: {str(e)}")
            raise


class SafeEmailVerificationTokenAdmin(admin.ModelAdmin):
    """
    Custom EmailVerificationToken admin that safely handles deletion operations
    by bypassing the admin logging that causes foreign key constraint errors.
    """
    list_display = ('user', 'token', 'created_at', 'expires_at', 'is_used')
    search_fields = ('user__username', 'user__email', 'token')
    list_filter = ('is_used', 'created_at')
    readonly_fields = ('token',)
    
    def delete_model(self, request, obj):
        """
        Override delete_model to bypass admin logging
        """
        try:
            # Delete directly without admin logging
            obj.delete()
            logger.info(f"Successfully deleted token: {obj.token}")
        except Exception as e:
            logger.error(f"Error deleting token: {str(e)}")
            raise
    
    def delete_queryset(self, request, queryset):
        """
        Override delete_queryset to bypass admin logging for bulk deletions
        """
        try:
            # Delete directly without admin logging
            queryset.delete()
            logger.info(f"Successfully deleted {queryset.count()} tokens")
        except Exception as e:
            logger.error(f"Error deleting tokens: {str(e)}")
            raise


# Unregister the default User admin and register our safe version
admin.site.unregister(User)
admin.site.register(User, SafeUserAdmin)

# Register our safe EmailVerificationToken admin
admin.site.register(EmailVerificationToken, SafeEmailVerificationTokenAdmin)
