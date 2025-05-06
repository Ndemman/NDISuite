import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress

User = get_user_model()

@pytest.fixture
def dev_user():
    """Create a test dev user with verified email for testing."""
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='StrongPassword123!',
        is_active=True
    )
    
    # Create verified email address for allauth
    EmailAddress.objects.create(
        user=user,
        email='test@example.com',
        verified=True,
        primary=True
    )
    
    return user

@pytest.mark.django_db
def test_login_success(dev_user):
    """Test that login endpoint returns a token on successful login."""
    client = APIClient()
    response = client.post(
        reverse('rest_login'),
        {'email': 'test@example.com', 'password': 'StrongPassword123!'},
        format='json'
    )
    
    assert response.status_code == 200
    assert 'key' in response.data
    
@pytest.mark.django_db
def test_login_fail():
    """Test that login endpoint returns an error with invalid credentials."""
    client = APIClient()
    response = client.post(
        reverse('rest_login'),
        {'email': 'test@example.com', 'password': 'WrongPassword123!'},
        format='json'
    )
    
    assert response.status_code == 400

@pytest.mark.django_db
def test_registration():
    """Test user registration endpoint."""
    client = APIClient()
    response = client.post(
        reverse('rest_register'),
        {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password1': 'NewPassword123!',
            'password2': 'NewPassword123!'
        },
        format='json'
    )
    
    assert response.status_code == 201
    assert User.objects.filter(email='newuser@example.com').exists()

@pytest.mark.django_db
def test_protected_endpoint_access(dev_user):
    """Test that a protected endpoint can be accessed with a valid token."""
    client = APIClient()
    
    # First login to get a token
    login_response = client.post(
        reverse('rest_login'),
        {'email': 'test@example.com', 'password': 'StrongPassword123!'},
        format='json'
    )
    
    # Set the token in the client
    token = login_response.data['key']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Try to access the sessions endpoint (which should be protected)
    response = client.get('/api/v1/reports/sessions/')
    
    assert response.status_code == 200
