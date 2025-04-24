"""Authentication-related API views.
This module currently contains a simple registration endpoint that allows anyone to
create a new user account. It relies on Django's built-in User model so that we
can avoid the extra complexity of the previous custom user implementation.

If/when a more sophisticated auth system is introduced (JWT, social auth, etc.)
this file can either be expanded or replaced with a dedicated Django app.
"""
import logging
import traceback
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import connection, OperationalError
from rest_framework import serializers, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

# Configure logging
logger = logging.getLogger('ndisuite')


class RegisterSerializer(serializers.Serializer):
    """Validate and create a new Django User instance."""

    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    # Extra fields coming from the frontend. We store them for now so that the
    # serializer does not raise an unknown-field error. They are *not* persisted
    # because the default User model has nowhere to put them, but capturing them
    # here gives us forward-compatibility once a profile model is added.
    account_type = serializers.ChoiceField(
        choices=["PARENT", "CHILD", "LONE"], required=False, allow_blank=True
    )
    organization = serializers.CharField(required=False, allow_blank=True, max_length=255)
    job_title = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate_email(self, value: str) -> str:
        try:
            # Check if the auth_user table exists by running a simple query
            with connection.cursor() as cursor:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_user'")
                if not cursor.fetchone():
                    # If table doesn't exist, log this and just return the value
                    # This will be handled properly in the create method
                    logger.warning("auth_user table does not exist")
                    return value
                
            # If we get here, the table exists, so check for existing user
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("A user with this email already exists.")
            return value
        except Exception as e:
            logger.error(f"Error in validate_email: {str(e)}")
            # Return the value and handle the error in create method
            return value

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        # Remove fields that do not exist on the User model
        validated_data.pop("password_confirm", None)
        validated_data.pop("account_type", None)
        validated_data.pop("organization", None)
        validated_data.pop("job_title", None)

        # Use the email as the username for simplicity
        validated_data["username"] = validated_data["email"]

        password = validated_data.pop("password")
        try:
            # Create the user
            user = User.objects.create_user(password=password, **validated_data)
            return user
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}\n{traceback.format_exc()}")
            raise serializers.ValidationError(f"Could not create user: {str(e)}")


class RegisterView(APIView):
    """POST /api/v1/auth/register/ to create a new user account."""

    # Anyone can access the registration endpoint.
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                
                # Handle both User model instances and dictionary results
                if isinstance(user, dict):
                    # Already formatted as a dict with the right fields
                    data = user
                else:
                    # Standard User model instance
                    data = {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    }
                
                return Response(data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unhandled exception in registration: {str(e)}\n{traceback.format_exc()}")
            # Return a friendly error message
            return Response(
                {"detail": "Registration service is temporarily unavailable. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginSerializer(serializers.Serializer):
    """Validate user credentials and authenticate."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        return attrs


class LoginView(APIView):
    """POST /api/v1/auth/login/ to authenticate user credentials."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            # Process login with database authentication
            serializer = LoginSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data["user"]
                # Dummy tokens for development; replace with real JWT later
                tokens = {
                    "access": "dev-access-token",
                    "refresh": "dev-refresh-token",
                }
                data = {
                    "tokens": tokens,
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    },
                }
                return Response(data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Unhandled exception in login: {str(e)}\n{traceback.format_exc()}")
            # Return a friendly error message
            return Response(
                {"detail": "Login service is temporarily unavailable. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
