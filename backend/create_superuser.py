"""
Script to create a superuser programmatically
"""
import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ndisuite.settings')
django.setup()

from django.contrib.auth.models import User
from django.db import transaction

def create_superuser():
    """Create a superuser account for admin access"""
    username = 'admin'
    email = 'admin@example.com'
    password = 'adminpassword'
    
    try:
        with transaction.atomic():
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                print(f"User '{username}' already exists")
                return False
                
            # Create superuser
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                first_name='Admin',
                last_name='User'
            )
            print(f"Superuser created: {user.username} ({user.email})")
            print(f"You can login with username '{username}' and password '{password}'")
            return True
    except Exception as e:
        print(f"Error creating superuser: {e}")
        return False

if __name__ == "__main__":
    create_superuser()
