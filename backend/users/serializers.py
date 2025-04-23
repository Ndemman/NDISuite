from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.crypto import get_random_string
from django.utils import timezone
import uuid

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model - used for profile views and updates
    """
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 
                  'organization', 'job_title', 'profile_image', 'account_type',
                  'can_manage_users', 'can_manage_billing', 'can_export_reports',
                  'can_create_templates', 'can_access_analytics', 'is_active',
                  'date_joined', 'created_at', 'updated_at']
        read_only_fields = ['id', 'email', 'account_type', 'date_joined', 'created_at', 'updated_at']

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for registering new user accounts
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    account_type = serializers.ChoiceField(choices=[('PARENT', 'Parent Account'), ('LONE', 'Individual Account')])
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm', 'first_name', 
                  'last_name', 'organization', 'job_title', 'account_type']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'organization': {'required': False},
        }
    
    def validate(self, data):
        # Check that passwords match
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match"})
        
        # Validate password complexity
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})
        
        # Child accounts can only be created by parent accounts, not during registration
        if data.get('account_type') == 'CHILD':
            raise serializers.ValidationError({"account_type": "Child accounts can only be created by parent accounts"})
            
        return data
    
    def create(self, validated_data):
        # Remove password confirmation field
        validated_data.pop('password_confirm')
        
        # Generate verification token
        verification_token = str(uuid.uuid4())
        
        # Create user with encrypted password
        user = User.objects.create(
            email=validated_data['email'],
            username=validated_data['email'],  # Use email as username
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            organization=validated_data.get('organization', ''),
            job_title=validated_data.get('job_title', ''),
            account_type=validated_data['account_type'],
            verification_token=verification_token,
            verification_token_created=timezone.now(),
            is_active=True,  # Account is active but not verified
            is_verified=False
        )
        
        user.set_password(validated_data['password'])
        user.save()
        
        return user

class ChildAccountSerializer(serializers.ModelSerializer):
    """
    Serializer for managing child accounts (used by parent accounts)
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'first_name', 'last_name', 
                  'job_title', 'can_export_reports', 'can_create_templates', 
                  'can_access_analytics', 'is_active']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, data):
        # Validate password complexity
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})
        
        return data
    
    def create(self, validated_data):
        # Get parent user from context
        parent_user = self.context['request'].user
        
        # Ensure the creating user is a parent account
        if parent_user.account_type != 'PARENT':
            raise serializers.ValidationError({"detail": "Only parent accounts can create child accounts"})
        
        # Create user with encrypted password
        user = User.objects.create(
            email=validated_data['email'],
            username=validated_data['email'],  # Use email as username
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            job_title=validated_data.get('job_title', ''),
            organization=parent_user.organization,  # Inherit from parent
            account_type='CHILD',
            parent_account=parent_user,
            can_export_reports=validated_data.get('can_export_reports', True),
            can_create_templates=validated_data.get('can_create_templates', False),
            can_access_analytics=validated_data.get('can_access_analytics', False),
            can_manage_users=False,  # Child accounts can never manage users
            can_manage_billing=False,  # Child accounts can never manage billing
            is_active=True,
            is_verified=True  # Child accounts are auto-verified
        )
        
        user.set_password(validated_data['password'])
        user.save()
        
        return user

class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for requesting a password reset
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        # Check that a user with this email exists
        if not User.objects.filter(email=value).exists():
            # We don't reveal whether a user exists for security reasons
            # but we still need to validate for our internal logic
            self._user_exists = False
        else:
            self._user_exists = True
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for confirming a password reset
    """
    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    def validate(self, data):
        # Check that passwords match
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match"})
        
        # Validate password complexity
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})
        
        # Validate token
        try:
            user = User.objects.get(password_reset_token=data['token'])
            
            # Check if token is expired (24 hours)
            if not user.password_reset_token_created or \
               (timezone.now() - user.password_reset_token_created).total_seconds() > 86400:
                raise serializers.ValidationError({"token": "Reset token has expired"})
            
            self.user = user
        except User.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid reset token"})
        
        return data

class EmailVerificationSerializer(serializers.Serializer):
    """
    Serializer for email verification
    """
    token = serializers.CharField(required=True)
    
    def validate_token(self, value):
        try:
            user = User.objects.get(verification_token=value)
            
            # Check if token is expired (72 hours)
            if not user.verification_token_created or \
               (timezone.now() - user.verification_token_created).total_seconds() > 259200:
                raise serializers.ValidationError("Verification token has expired")
            
            self.user = user
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token")
        
        return value
