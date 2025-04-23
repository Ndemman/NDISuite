from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
import os
import uuid
import json
from unittest.mock import patch, MagicMock

from users.models import CustomUser
from reports.models import Session
from .models import InputFile, ProcessedChunk


class FilesModelTests(TestCase):
    """Test cases for the Files models"""
    
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
        
        # Create an input file
        self.input_file = InputFile.objects.create(
            session=self.session,
            title='Test Document',
            file_name='test-document.pdf',
            file_type='application/pdf',
            file_size=1024,
            status='completed'
        )
    
    def test_input_file_creation(self):
        """Test creating an input file"""
        self.assertEqual(self.input_file.title, 'Test Document')
        self.assertEqual(self.input_file.session, self.session)
        self.assertEqual(self.input_file.file_name, 'test-document.pdf')
        self.assertEqual(self.input_file.file_type, 'application/pdf')
        self.assertEqual(self.input_file.file_size, 1024)
        self.assertEqual(self.input_file.status, 'completed')
        self.assertTrue(isinstance(self.input_file.id, uuid.UUID))
    
    def test_create_processed_chunks(self):
        """Test creating processed chunks from input file"""
        # Create chunks
        chunk1 = ProcessedChunk.objects.create(
            file=self.input_file,
            sequence=1,
            text='This is the first chunk of the document.',
            metadata=json.dumps({
                'page': 1,
                'position': 'top'
            })
        )
        
        chunk2 = ProcessedChunk.objects.create(
            file=self.input_file,
            sequence=2,
            text='This is the second chunk of the document.',
            metadata=json.dumps({
                'page': 1,
                'position': 'middle'
            })
        )
        
        # Check chunk data
        self.assertEqual(chunk1.sequence, 1)
        self.assertEqual(chunk1.text, 'This is the first chunk of the document.')
        metadata1 = json.loads(chunk1.metadata)
        self.assertEqual(metadata1['page'], 1)
        self.assertEqual(metadata1['position'], 'top')
        
        self.assertEqual(chunk2.sequence, 2)
        self.assertEqual(chunk2.text, 'This is the second chunk of the document.')
        metadata2 = json.loads(chunk2.metadata)
        self.assertEqual(metadata2['page'], 1)
        self.assertEqual(metadata2['position'], 'middle')
        
        # Check chunks are associated with the input file
        chunks = ProcessedChunk.objects.filter(file=self.input_file).order_by('sequence')
        self.assertEqual(chunks.count(), 2)
        self.assertEqual(chunks[0].text, 'This is the first chunk of the document.')
        self.assertEqual(chunks[1].text, 'This is the second chunk of the document.')


class FilesAPITests(APITestCase):
    """Test cases for the Files API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create user
        self.user = CustomUser.objects.create_user(
            email='testuser@example.com',
            password='testpassword123'
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
        
        # Create an input file
        self.input_file = InputFile.objects.create(
            session=self.session,
            title='Test Document',
            file_name='test-document.pdf',
            file_type='application/pdf',
            file_size=1024,
            status='completed'
        )
        
        # Create processed chunks
        self.chunk1 = ProcessedChunk.objects.create(
            file=self.input_file,
            sequence=1,
            text='This is the first chunk of the document.',
            metadata=json.dumps({
                'page': 1,
                'position': 'top'
            })
        )
        
        self.chunk2 = ProcessedChunk.objects.create(
            file=self.input_file,
            sequence=2,
            text='This is the second chunk of the document.',
            metadata=json.dumps({
                'page': 1,
                'position': 'middle'
            })
        )
        
        # API URLs
        self.files_url = reverse('file-list')
        self.file_detail_url = reverse('file-detail', args=[self.input_file.id])
        self.file_content_url = reverse('file-content', args=[self.input_file.id])
        self.file_chunks_url = reverse('file-chunks', args=[self.input_file.id])
        self.upload_url = reverse('file-upload')
    
    @patch('files.views.process_document')
    def test_upload_file(self, mock_process):
        """Test uploading a document file"""
        # Mock the process_document function
        mock_process.return_value = {
            'status': 'completed',
            'chunks': [
                {'sequence': 1, 'text': 'This is a mocked document chunk 1.'},
                {'sequence': 2, 'text': 'This is a mocked document chunk 2.'}
            ]
        }
        
        # Create a simple PDF file for testing
        pdf_file = SimpleUploadedFile(
            "test_document.pdf",
            b"file_content",
            content_type="application/pdf"
        )
        
        data = {
            'title': 'Uploaded Document',
            'session_id': str(self.session.id),
            'file': pdf_file
        }
        
        response = self.client.post(
            self.upload_url,
            data,
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Uploaded Document')
        self.assertEqual(response.data['status'], 'completed')
        
        # Verify a new file was created in the database
        self.assertEqual(InputFile.objects.count(), 2)  # Including the one created in setUp
        
        # Verify process_document was called
        mock_process.assert_called_once()
    
    def test_get_files(self):
        """Test getting all files for a session"""
        response = self.client.get(
            f"{self.files_url}?session_id={self.session.id}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Should have one file created in setUp
        self.assertEqual(response.data[0]['title'], 'Test Document')
    
    def test_get_file_detail(self):
        """Test getting a specific file"""
        response = self.client.get(self.file_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Document')
        self.assertEqual(response.data['file_type'], 'application/pdf')
    
    def test_get_file_content(self):
        """Test getting file content"""
        response = self.client.get(self.file_content_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming the content is concatenated from all chunks
        self.assertIn('This is the first chunk of the document.', response.data['content'])
        self.assertIn('This is the second chunk of the document.', response.data['content'])
    
    def test_get_file_chunks(self):
        """Test getting file chunks"""
        response = self.client.get(self.file_chunks_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Should have two chunks created in setUp
        self.assertEqual(response.data[0]['text'], 'This is the first chunk of the document.')
        self.assertEqual(response.data[1]['text'], 'This is the second chunk of the document.')
    
    def test_delete_file(self):
        """Test deleting a file"""
        response = self.client.delete(self.file_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(InputFile.objects.count(), 0)
        
        # Check that chunks are also deleted (cascade delete)
        self.assertEqual(ProcessedChunk.objects.count(), 0)


class DocumentProcessingTests(TestCase):
    """Test cases for document processing functionality"""
    
    @patch('files.services.extract_text_from_pdf')
    def test_process_pdf_document(self, mock_extract):
        """Test processing a PDF document"""
        from files.services import process_document
        
        # Mock the extract_text_from_pdf function
        mock_extract.return_value = "This is the extracted text from a PDF document."
        
        # Create a simple session
        user = CustomUser.objects.create_user(
            email='testuser@example.com',
            password='testpassword123'
        )
        
        session = Session.objects.create(
            title='Test Session',
            description='This is a test session',
            client='John Smith',
            user=user
        )
        
        # Create an input file
        input_file = InputFile.objects.create(
            session=session,
            title='Test PDF',
            file_name='test.pdf',
            file_type='application/pdf',
            file_size=1024,
            status='processing'
        )
        
        # Test processing
        with patch('files.services.chunk_text', return_value=[
            {'text': 'Chunk 1', 'sequence': 1},
            {'text': 'Chunk 2', 'sequence': 2}
        ]):
            result = process_document(input_file, 'path/to/file.pdf')
        
        # Check result
        self.assertEqual(result['status'], 'completed')
        self.assertEqual(len(result['chunks']), 2)
        
        # Verify extract_text_from_pdf was called
        mock_extract.assert_called_once_with('path/to/file.pdf')
        
        # Check database updates
        updated_file = InputFile.objects.get(id=input_file.id)
        self.assertEqual(updated_file.status, 'completed')
        
        # Check chunks were created
        chunks = ProcessedChunk.objects.filter(file=input_file).order_by('sequence')
        self.assertEqual(chunks.count(), 2)
        self.assertEqual(chunks[0].text, 'Chunk 1')
        self.assertEqual(chunks[1].text, 'Chunk 2')
    
    @patch('files.services.extract_text_from_docx')
    def test_process_docx_document(self, mock_extract):
        """Test processing a DOCX document"""
        from files.services import process_document
        
        # Mock the extract_text_from_docx function
        mock_extract.return_value = "This is the extracted text from a DOCX document."
        
        # Create a simple session
        user = CustomUser.objects.create_user(
            email='testuser@example.com',
            password='testpassword123'
        )
        
        session = Session.objects.create(
            title='Test Session',
            description='This is a test session',
            client='John Smith',
            user=user
        )
        
        # Create an input file
        input_file = InputFile.objects.create(
            session=session,
            title='Test DOCX',
            file_name='test.docx',
            file_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            file_size=1024,
            status='processing'
        )
        
        # Test processing
        with patch('files.services.chunk_text', return_value=[
            {'text': 'Chunk 1', 'sequence': 1},
            {'text': 'Chunk 2', 'sequence': 2}
        ]):
            result = process_document(input_file, 'path/to/file.docx')
        
        # Check result
        self.assertEqual(result['status'], 'completed')
        self.assertEqual(len(result['chunks']), 2)
        
        # Verify extract_text_from_docx was called
        mock_extract.assert_called_once_with('path/to/file.docx')
        
        # Check database updates
        updated_file = InputFile.objects.get(id=input_file.id)
        self.assertEqual(updated_file.status, 'completed')
        
        # Check chunks were created
        chunks = ProcessedChunk.objects.filter(file=input_file).order_by('sequence')
        self.assertEqual(chunks.count(), 2)
        self.assertEqual(chunks[0].text, 'Chunk 1')
        self.assertEqual(chunks[1].text, 'Chunk 2')
    
    def test_chunk_text(self):
        """Test chunking text into smaller segments"""
        from files.services import chunk_text
        
        # Create a long text to chunk
        long_text = "This is a long text that should be split into chunks. " * 20
        
        # Test chunking
        chunks = chunk_text(long_text, chunk_size=100, overlap=20)
        
        # Check result
        self.assertTrue(len(chunks) > 1)
        for i, chunk in enumerate(chunks):
            self.assertIn('text', chunk)
            self.assertIn('sequence', chunk)
            self.assertEqual(chunk['sequence'], i + 1)
            
            # Check chunk size is reasonable
            self.assertTrue(len(chunk['text']) <= 120)  # chunk_size + overlap
            
            # Check for overlap between chunks
            if i > 0:
                prev_chunk = chunks[i - 1]['text']
                curr_chunk = chunk['text']
                
                # At least some words from the previous chunk should be in the current chunk (overlap)
                overlap_found = False
                for word in prev_chunk.split()[-5:]:  # Check last few words
                    if word in curr_chunk.split()[:5]:  # Check first few words
                        overlap_found = True
                        break
                
                self.assertTrue(overlap_found)
