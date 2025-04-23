from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.crypto import get_random_string
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q
import uuid

from .models import User
from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    ChildAccountSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerificationSerializer
)

class IsParentAccount(permissions.BasePermission):
    """
    Permission check for parent accounts
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.account_type == 'PARENT'

class IsAccountOwnerOrParent(permissions.BasePermission):
    """
    Permission check for account owner or parent account
    """
    def has_object_permission(self, request, view, obj):
        # Check if user is the object owner
        if obj.id == request.user.id:
            return True
        
        # Check if user is the parent of this account
        if obj.account_type == 'CHILD' and obj.parent_account == request.user:
            return True
            
        return False

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()  # Default queryset for router registration
    
    def get_queryset(self):
        user = self.request.user
        
        # Parent accounts can see themselves and their child accounts
        if user.account_type == 'PARENT':
            return User.objects.filter(Q(id=user.id) | Q(parent_account=user))
        
        # Other account types can only see themselves
        return User.objects.filter(id=user.id)
    
    def get_permissions(self):
        """
        Override permissions:
        - Detail routes need IsAccountOwnerOrParent
        - List route needs IsParentAccount (only parent accounts can list users)
        """
        if self.action == 'list':
            permission_classes = [IsAuthenticated, IsParentAccount]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsAccountOwnerOrParent]
        else:
            permission_classes = [IsAuthenticated]
            
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Return the currently authenticated user
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def child_accounts(self, request):
        """
        Return all child accounts for the parent account
        """
        if request.user.account_type != 'PARENT':
            return Response(
                {"detail": "Only parent accounts can view child accounts"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        children = User.objects.filter(parent_account=request.user)
        serializer = self.get_serializer(children, many=True)
        return Response(serializer.data)

class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Send verification email
        self._send_verification_email(user)
        
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "message": "User registered successfully. Please check your email to verify your account."
        }, status=status.HTTP_201_CREATED)
    
    def _send_verification_email(self, user):
        """
        Send verification email to user
        """
        verification_url = f"{settings.FRONTEND_URL}/auth/verify-email?token={user.verification_token}"
        
        # Prepare email content
        context = {
            'user': user,
            'verification_url': verification_url
        }
        
        email_subject = "Verify your NDISuite account"
        email_html_message = render_to_string('email/verify_email.html', context)
        email_plain_message = render_to_string('email/verify_email.txt', context)
        
        # Send email
        try:
            send_mail(
                subject=email_subject,
                message=email_plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=email_html_message,
                fail_silently=False,
            )
        except Exception as e:
            # Log the error but don't fail the registration
            print(f"Error sending verification email: {e}")

class VerifyEmailView(generics.GenericAPIView):
    """
    API endpoint for email verification
    """
    serializer_class = EmailVerificationSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Mark user as verified
        user = serializer.user
        user.is_verified = True
        user.verification_token = None
        user.verification_token_created = None
        user.save()
        
        return Response({
            "message": "Email verified successfully. You can now log in."
        })

class CreateChildAccountView(generics.CreateAPIView):
    """
    API endpoint for creating child accounts (only for parent accounts)
    """
    serializer_class = ChildAccountSerializer
    permission_classes = [IsAuthenticated, IsParentAccount]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Send welcome email to the new child account
        self._send_welcome_email(user)
        
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "message": "Child account created successfully. Login credentials have been sent to the user."
        }, status=status.HTTP_201_CREATED)
    
    def _send_welcome_email(self, user):
        """
        Send welcome email to the new child account
        """
        login_url = f"{settings.FRONTEND_URL}/auth/login"
        
        # Prepare email content
        context = {
            'user': user,
            'parent': user.parent_account,
            'login_url': login_url,
            'organization': user.organization
        }
        
        email_subject = f"Welcome to {user.organization} on NDISuite"
        email_html_message = render_to_string('email/welcome_child_account.html', context)
        email_plain_message = render_to_string('email/welcome_child_account.txt', context)
        
        # Send email
        try:
            send_mail(
                subject=email_subject,
                message=email_plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=email_html_message,
                fail_silently=False,
            )
        except Exception as e:
            # Log the error but don't fail the account creation
            print(f"Error sending welcome email: {e}")

class PasswordResetRequestView(generics.GenericAPIView):
    """
    API endpoint for requesting a password reset
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        # Always return success even if email doesn't exist (for security)
        if not hasattr(serializer, '_user_exists') or not serializer._user_exists:
            return Response({
                "message": "If an account with this email exists, a password reset link has been sent."
            })
        
        # Get user and generate reset token
        user = User.objects.get(email=email)
        reset_token = str(uuid.uuid4())
        user.password_reset_token = reset_token
        user.password_reset_token_created = timezone.now()
        user.save()
        
        # Send password reset email
        self._send_reset_email(user)
        
        return Response({
            "message": "If an account with this email exists, a password reset link has been sent."
        })
    
    def _send_reset_email(self, user):
        """
        Send password reset email
        """
        reset_url = f"{settings.FRONTEND_URL}/auth/password-reset-confirm?token={user.password_reset_token}"
        
        # Prepare email content
        context = {
            'user': user,
            'reset_url': reset_url
        }
        
        email_subject = "Reset your NDISuite password"
        email_html_message = render_to_string('email/password_reset.html', context)
        email_plain_message = render_to_string('email/password_reset.txt', context)
        
        # Send email
        try:
            send_mail(
                subject=email_subject,
                message=email_plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=email_html_message,
                fail_silently=False,
            )
        except Exception as e:
            # Log the error
            print(f"Error sending password reset email: {e}")

class PasswordResetConfirmView(generics.GenericAPIView):
    """
    API endpoint for confirming a password reset
    """
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Reset the password
        user = serializer.user
        user.set_password(serializer.validated_data['password'])
        user.password_reset_token = None
        user.password_reset_token_created = None
        user.save()
        
        return Response({
            "message": "Password has been reset successfully. You can now log in with your new password."
        })
