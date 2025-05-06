"""
Models for NDISuite core functionality.
"""
from django.db import models
from django.contrib.auth.models import User
import uuid
import json
from datetime import timedelta
from django.utils import timezone

class EmailVerificationToken(models.Model):
    """
    Stores email verification tokens for user account activation.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_tokens')
    token = models.CharField(max_length=36, editable=False, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Email Verification Token'
        verbose_name_plural = 'Email Verification Tokens'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Token expires in 24 hours
            self.expires_at = timezone.now() + timedelta(hours=24)
        
        # Generate a UUID string if token is not set
        if not self.token:
            self.token = str(uuid.uuid4())
            
        super().save(*args, **kwargs)
    
    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at
    
    def __str__(self):
        return f"Verification token for {self.user.email} ({'Used' if self.is_used else 'Active'})"


class PasswordResetToken(models.Model):
    """
    Stores password reset tokens for user password recovery.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=36, editable=False, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Token expires in 24 hours
            self.expires_at = timezone.now() + timedelta(hours=24)
        
        # Generate a UUID string if token is not set
        if not self.token:
            self.token = str(uuid.uuid4())
            
        super().save(*args, **kwargs)
    
    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at
    
    def __str__(self):
        return f"Password reset token for {self.user.email} ({'Used' if self.is_used else 'Active'})"


class SocialAccount(models.Model):
    """
    Stores OAuth account information linked to Django users.
    """
    PROVIDER_CHOICES = (
        ('google', 'Google'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_accounts')
    provider = models.CharField(max_length=30, choices=PROVIDER_CHOICES)
    provider_user_id = models.CharField(max_length=255)
    email = models.EmailField()
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    profile_picture = models.URLField(blank=True, null=True)
    access_token = models.TextField(blank=True, null=True)
    refresh_token = models.TextField(blank=True, null=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    extra_data = models.TextField(blank=True, null=True)  # JSON encoded extra data
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Social Account'
        verbose_name_plural = 'Social Accounts'
        unique_together = ('provider', 'provider_user_id')
        ordering = ['-last_login']
    
    def set_extra_data(self, extra_data):
        """
        Sets extra_data by converting the dictionary to a JSON string.
        """
        self.extra_data = json.dumps(extra_data)
    
    def get_extra_data(self):
        """
        Returns the extra_data as a dictionary.
        """
        if self.extra_data:
            return json.loads(self.extra_data)
        return {}
    
    def __str__(self):
        return f"{self.provider} account for {self.user.email}"
