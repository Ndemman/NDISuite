from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress

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
    
    # If the EmailAddress record doesn't exist, create it
    if not EmailAddress.objects.filter(user=user, email='dev@example.com').exists():
        EmailAddress.objects.create(
            user=user,
            email='dev@example.com',
            verified=True,
            primary=True
        )
        print("Added verified email address for existing dev user")
    else:
        # Make sure the email address is verified and primary
        email_address = EmailAddress.objects.get(user=user, email='dev@example.com')
        if not email_address.verified or not email_address.primary:
            email_address.verified = True
            email_address.primary = True
            email_address.save()
            print("Updated email address to be verified and primary")
        else:
            print("Dev user already exists with verified primary email")
