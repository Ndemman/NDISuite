from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import uuid
from django.utils import timezone


class User(AbstractUser):
    """
    Custom User model with UUID primary key and hierarchical account structure
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    organization = models.CharField(max_length=255, blank=True)
    job_title = models.CharField(max_length=255, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    
    # Account type and hierarchy fields
    ACCOUNT_TYPES = [
        ('PARENT', 'Parent Account'),
        ('CHILD', 'Child Account'),
        ('LONE', 'Individual Account'),
    ]
    account_type = models.CharField(max_length=10, choices=ACCOUNT_TYPES, default='LONE')
    parent_account = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, 
                                      related_name='child_accounts')
    
    # Permission fields
    can_manage_users = models.BooleanField(default=False)
    can_manage_billing = models.BooleanField(default=False)
    can_export_reports = models.BooleanField(default=True)
    can_create_templates = models.BooleanField(default=False)
    can_access_analytics = models.BooleanField(default=False)
    
    # Verification fields
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=255, blank=True, null=True)
    verification_token_created = models.DateTimeField(null=True, blank=True)
    
    # Password reset fields
    password_reset_token = models.CharField(max_length=255, blank=True, null=True)
    password_reset_token_created = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email
    
    def save(self, *args, **kwargs):
        # Automatically set permissions based on account type
        if self.account_type == 'PARENT':
            self.can_manage_users = True
            self.can_manage_billing = True
            self.can_create_templates = True
            self.can_access_analytics = True
        elif self.account_type == 'LONE':
            self.can_manage_users = False
            self.can_manage_billing = True
            self.can_create_templates = True
            self.can_access_analytics = True
        
        # Ensure child accounts are linked to parent
        if self.account_type == 'CHILD' and not self.parent_account:
            raise ValueError("Child accounts must have a parent account")
            
        super().save(*args, **kwargs)
