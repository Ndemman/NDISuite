"""
Script to fix user activation issues by properly handling verification tokens
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ndisuite.settings')
django.setup()

from django.contrib.auth.models import User
from ndisuite.models import EmailVerificationToken

def activate_user_by_id(user_id):
    """
    Activate a user and handle all associated verification tokens
    to prevent foreign key constraint errors.
    """
    try:
        # Get the user
        user = User.objects.get(id=user_id)
        print(f"Found user: {user.email} (currently {'active' if user.is_active else 'inactive'})")
        
        # Get all associated tokens
        tokens = EmailVerificationToken.objects.filter(user=user)
        print(f"Found {tokens.count()} verification tokens associated with this user")
        
        # Mark all tokens as used to prevent foreign key constraint issues
        for token in tokens:
            print(f"Marking token {token.token} as used")
            token.is_used = True
            token.save()
        
        # Activate the user
        user.is_active = True
        user.save()
        print(f"User {user.email} has been activated successfully")
        
        return True
    except User.DoesNotExist:
        print(f"Error: User with ID {user_id} not found")
        return False
    except Exception as e:
        print(f"Error activating user: {str(e)}")
        return False

def list_inactive_users():
    """List all inactive users in the system"""
    inactive_users = User.objects.filter(is_active=False)
    if not inactive_users:
        print("No inactive users found")
        return
    
    print(f"Found {inactive_users.count()} inactive users:")
    for user in inactive_users:
        tokens = EmailVerificationToken.objects.filter(user=user).count()
        print(f"ID: {user.id}, Email: {user.email}, Name: {user.first_name} {user.last_name}, Verification Tokens: {tokens}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python fix_user_activation.py list - List all inactive users")
        print("  python fix_user_activation.py activate USER_ID - Activate a specific user")
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "list":
        list_inactive_users()
    elif command == "activate" and len(sys.argv) >= 3:
        try:
            user_id = int(sys.argv[2])
            activate_user_by_id(user_id)
        except ValueError:
            print("Error: USER_ID must be an integer")
    else:
        print("Invalid command")
        print("Usage:")
        print("  python fix_user_activation.py list - List all inactive users")
        print("  python fix_user_activation.py activate USER_ID - Activate a specific user")
