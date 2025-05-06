from django.db import migrations
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress

def create_dev_user(apps, schema_editor):
    User = get_user_model()
    
    # Check if dev user already exists
    if not User.objects.filter(email='dev@example.com').exists():
        # Create the dev user
        user = User.objects.create_user(
            username='dev_user',
            email='dev@example.com',
            password='Pass1234!',
            is_staff=True,
            is_active=True
        )
        
        # Create the verified email address entry for allauth
        EmailAddress.objects.create(
            user=user,
            email='dev@example.com',
            verified=True,
            primary=True
        )
        
        print("Created default development user: dev@example.com")
    else:
        # User exists but may need the EmailAddress record
        user = User.objects.get(email='dev@example.com')
        if not EmailAddress.objects.filter(user=user, email='dev@example.com').exists():
            EmailAddress.objects.create(
                user=user,
                email='dev@example.com',
                verified=True,
                primary=True
            )
            print("Added verified email address for existing dev user")

def reverse_dev_user(apps, schema_editor):
    User = get_user_model()
    # Only delete users created by this migration
    User.objects.filter(email='dev@example.com', username='dev_user').delete()
    # Email addresses will be removed via CASCADE

class Migration(migrations.Migration):
    dependencies = [
        ('ndisuite', '0007_alter_socialaccount_provider'),
    ]
    
    operations = [
        migrations.RunPython(create_dev_user, reverse_dev_user),
    ]
