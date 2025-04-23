from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
import uuid

from .models import CustomUser


class CustomUserModelTests(TestCase):
    """Test cases for the CustomUser model"""
    
    def test_create_user(self):
        """Test creating a normal user with email"""
        user = CustomUser.objects.create_user(
            email='testuser@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
        
        self.assertEqual(user.email, 'testuser@example.com')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(isinstance(user.id, uuid.UUID))
    
    def test_create_superuser(self):
        """Test creating a superuser"""
        admin_user = CustomUser.objects.create_superuser(
            email='admin@example.com',
            password='adminpassword123'
        )
        
        self.assertEqual(admin_user.email, 'admin@example.com')
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
    
    def test_email_required(self):
        """Test that email is required for user creation"""
        with self.assertRaises(ValueError):
            CustomUser.objects.create_user(email='', password='testpassword123')


class AuthenticationAPITests(APITestCase):
    """Test cases for the authentication API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        
        # Create a user for testing login
        self.user = CustomUser.objects.create_user(
            email='existinguser@example.com',
            password='existingpassword123',
            first_name='Existing',
            last_name='User'
        )
        
        # Registration data
        self.valid_registration_data = {
            'email': 'newuser@example.com',
            'password': 'newpassword123',
            'password_confirm': 'newpassword123',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        # Login data
        self.valid_login_data = {
            'email': 'existinguser@example.com',
            'password': 'existingpassword123'
        }
    
    def test_user_registration(self):
        """Test user registration with valid data"""
        response = self.client.post(
            self.register_url,
            self.valid_registration_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CustomUser.objects.count(), 2)  # Including the user created in setUp
        self.assertEqual(response.data['email'], 'newuser@example.com')
        self.assertEqual(response.data['first_name'], 'New')
        self.assertEqual(response.data['last_name'], 'User')
        self.assertNotIn('password', response.data)  # Password should not be returned
    
    def test_user_registration_with_invalid_data(self):
        """Test user registration with invalid data"""
        # Test with different password and password_confirm
        invalid_data = self.valid_registration_data.copy()
        invalid_data['password_confirm'] = 'differentpassword'
        
        response = self.client.post(
            self.register_url,
            invalid_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with existing email
        invalid_data = self.valid_registration_data.copy()
        invalid_data['email'] = 'existinguser@example.com'
        
        response = self.client.post(
            self.register_url,
            invalid_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_user_login(self):
        """Test user login with valid credentials"""
        response = self.client.post(
            self.login_url,
            self.valid_login_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'existinguser@example.com')
    
    def test_user_login_with_invalid_credentials(self):
        """Test user login with invalid credentials"""
        invalid_data = self.valid_login_data.copy()
        invalid_data['password'] = 'wrongpassword'
        
        response = self.client.post(
            self.login_url,
            invalid_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
