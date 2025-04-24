from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
import uuid
import json

from django.contrib.auth import get_user_model
CustomUser = get_user_model()
from .models import Session, Template, Report, OutputField, ReportVersion


class SessionModelTests(TestCase):
    """Test cases for the Session model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = CustomUser.objects.create_user(
            email='testuser@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
    
    def test_create_session(self):
        """Test creating a session"""
        session = Session.objects.create(
            title='Test Session',
            description='This is a test session',
            client='John Smith',
            user=self.user
        )
        
        self.assertEqual(session.title, 'Test Session')
        self.assertEqual(session.description, 'This is a test session')
        self.assertEqual(session.client, 'John Smith')
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.status, 'draft')  # Default status should be draft
        self.assertTrue(isinstance(session.id, uuid.UUID))
    
    def test_session_status_choices(self):
        """Test session status choices"""
        session = Session.objects.create(
            title='Test Session',
            description='This is a test session',
            client='John Smith',
            user=self.user,
            status='in-progress'
        )
        
        self.assertEqual(session.status, 'in-progress')
        
        # Update status to completed
        session.status = 'completed'
        session.save()
        
        updated_session = Session.objects.get(id=session.id)
        self.assertEqual(updated_session.status, 'completed')


class TemplateModelTests(TestCase):
    """Test cases for the Template model"""
    
    def test_create_template(self):
        """Test creating a template"""
        template = Template.objects.create(
            name='Progress Report',
            description='Template for NDIS progress reports',
            category='NDIS',
            sections=json.dumps([
                {'title': 'Client Details', 'required': True, 'order': 1},
                {'title': 'Goals Progress', 'required': True, 'order': 2},
                {'title': 'Recommendations', 'required': True, 'order': 3}
            ])
        )
        
        self.assertEqual(template.name, 'Progress Report')
        self.assertEqual(template.description, 'Template for NDIS progress reports')
        self.assertEqual(template.category, 'NDIS')
        self.assertEqual(len(json.loads(template.sections)), 3)


class ReportModelTests(TestCase):
    """Test cases for the Report model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = CustomUser.objects.create_user(
            email='testuser@example.com',
            password='testpassword123'
        )
        
        self.session = Session.objects.create(
            title='Test Session',
            description='This is a test session',
            client='John Smith',
            user=self.user
        )
        
        self.template = Template.objects.create(
            name='Progress Report',
            description='Template for NDIS progress reports',
            category='NDIS',
            sections=json.dumps([
                {'title': 'Client Details', 'required': True, 'order': 1},
                {'title': 'Goals Progress', 'required': True, 'order': 2},
                {'title': 'Recommendations', 'required': True, 'order': 3}
            ])
        )
    
    def test_create_report(self):
        """Test creating a report"""
        report = Report.objects.create(
            title='John Smith Progress Report',
            session=self.session,
            template=self.template,
            content=json.dumps({
                'client_details': 'John Smith is a 42-year-old male...',
                'goals_progress': 'John has made significant progress...',
                'recommendations': 'Continue with weekly therapy sessions...'
            }),
            status='draft'
        )
        
        self.assertEqual(report.title, 'John Smith Progress Report')
        self.assertEqual(report.session, self.session)
        self.assertEqual(report.template, self.template)
        self.assertEqual(report.status, 'draft')
        self.assertEqual(report.version, 1)
        
        # Test content as JSON
        content = json.loads(report.content)
        self.assertIn('client_details', content)
        self.assertIn('goals_progress', content)
        self.assertIn('recommendations', content)
    
    def test_report_versioning(self):
        """Test report versioning"""
        # Create initial report
        report = Report.objects.create(
            title='John Smith Progress Report',
            session=self.session,
            template=self.template,
            content=json.dumps({
                'client_details': 'Initial content'
            }),
            status='draft'
        )
        
        self.assertEqual(report.version, 1)
        
        # Update report content and save - should create a new version
        report.content = json.dumps({
            'client_details': 'Updated content'
        })
        report.save()
        
        # Reload the report
        updated_report = Report.objects.get(id=report.id)
        self.assertEqual(updated_report.version, 2)
        
        # Check report versions
        versions = ReportVersion.objects.filter(report_id=report.id).order_by('version')
        self.assertEqual(versions.count(), 1)  # Original version (v1) stored in ReportVersion
        self.assertEqual(versions.first().version, 1)
        self.assertEqual(json.loads(versions.first().content)['client_details'], 'Initial content')


class ReportsAPITests(APITestCase):
    """Test cases for the Reports API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create user
        self.user = CustomUser.objects.create_user(
            email='testuser@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
        
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Create session
        self.session = Session.objects.create(
            title='Test Session',
            description='This is a test session',
            client='John Smith',
            user=self.user
        )
        
        # Create template
        self.template = Template.objects.create(
            name='Progress Report',
            description='Template for NDIS progress reports',
            category='NDIS',
            sections=json.dumps([
                {'title': 'Client Details', 'required': True, 'order': 1},
                {'title': 'Goals Progress', 'required': True, 'order': 2},
                {'title': 'Recommendations', 'required': True, 'order': 3}
            ])
        )
        
        # API URLs
        self.sessions_url = reverse('session-list')
        self.session_detail_url = reverse('session-detail', args=[self.session.id])
        self.templates_url = reverse('template-list')
        self.template_detail_url = reverse('template-detail', args=[self.template.id])
        
        # Session data
        self.valid_session_data = {
            'title': 'New Session',
            'description': 'This is a new session',
            'client': 'Sarah Johnson'
        }
    
    def test_get_sessions(self):
        """Test retrieving all sessions for a user"""
        response = self.client.get(self.sessions_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Should have one session created in setUp
        self.assertEqual(response.data[0]['title'], 'Test Session')
    
    def test_create_session(self):
        """Test creating a new session"""
        response = self.client.post(
            self.sessions_url,
            self.valid_session_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Session.objects.count(), 2)  # Including the session created in setUp
        self.assertEqual(response.data['title'], 'New Session')
        self.assertEqual(response.data['client'], 'Sarah Johnson')
        self.assertEqual(response.data['status'], 'draft')
    
    def test_get_session_detail(self):
        """Test retrieving a specific session"""
        response = self.client.get(self.session_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Session')
        self.assertEqual(response.data['client'], 'John Smith')
    
    def test_update_session(self):
        """Test updating a session"""
        update_data = {
            'title': 'Updated Session',
            'status': 'in-progress'
        }
        
        response = self.client.patch(
            self.session_detail_url,
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Session')
        self.assertEqual(response.data['status'], 'in-progress')
        
        # Verify the update in the database
        updated_session = Session.objects.get(id=self.session.id)
        self.assertEqual(updated_session.title, 'Updated Session')
        self.assertEqual(updated_session.status, 'in-progress')
    
    def test_delete_session(self):
        """Test deleting a session"""
        response = self.client.delete(self.session_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Session.objects.count(), 0)
    
    def test_get_templates(self):
        """Test retrieving all templates"""
        response = self.client.get(self.templates_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Should have one template created in setUp
        self.assertEqual(response.data[0]['name'], 'Progress Report')
    
    def test_get_template_detail(self):
        """Test retrieving a specific template"""
        response = self.client.get(self.template_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Progress Report')
        self.assertEqual(response.data['category'], 'NDIS')
        self.assertEqual(len(response.data['sections']), 3)
