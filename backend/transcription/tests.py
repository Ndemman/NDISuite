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
from .models import AudioRecording, Transcript, TranscriptionSegment


class TranscriptionModelTests(TestCase):
    """Test cases for the Transcription models"""
    
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
        
        # Create an audio recording
        self.recording = AudioRecording.objects.create(
            session=self.session,
            title='Test Recording',
            duration=120,  # 2 minutes
            status='completed',
            file_path='recordings/test-recording.wav'
        )
        
        # Create a transcript
        self.transcript = Transcript.objects.create(
            recording=self.recording,
            session=self.session,
            title='Test Transcript',
            text='This is a test transcript content.',
            status='completed'
        )
    
    def test_audio_recording_creation(self):
        """Test creating an audio recording"""
        self.assertEqual(self.recording.title, 'Test Recording')
        self.assertEqual(self.recording.session, self.session)
        self.assertEqual(self.recording.duration, 120)
        self.assertEqual(self.recording.status, 'completed')
        self.assertEqual(self.recording.file_path, 'recordings/test-recording.wav')
        self.assertTrue(isinstance(self.recording.id, uuid.UUID))
    
    def test_transcript_creation(self):
        """Test creating a transcript"""
        self.assertEqual(self.transcript.title, 'Test Transcript')
        self.assertEqual(self.transcript.recording, self.recording)
        self.assertEqual(self.transcript.session, self.session)
        self.assertEqual(self.transcript.text, 'This is a test transcript content.')
        self.assertEqual(self.transcript.status, 'completed')
        self.assertTrue(isinstance(self.transcript.id, uuid.UUID))
    
    def test_create_transcription_segments(self):
        """Test creating transcription segments"""
        # Create segments
        segment1 = TranscriptionSegment.objects.create(
            transcript=self.transcript,
            recording=self.recording,
            start_time=0.0,
            end_time=5.0,
            text='This is the first segment.',
            confidence=0.95
        )
        
        segment2 = TranscriptionSegment.objects.create(
            transcript=self.transcript,
            recording=self.recording,
            start_time=5.0,
            end_time=10.0,
            text='This is the second segment.',
            confidence=0.92
        )
        
        # Check segment data
        self.assertEqual(segment1.start_time, 0.0)
        self.assertEqual(segment1.end_time, 5.0)
        self.assertEqual(segment1.text, 'This is the first segment.')
        self.assertEqual(segment1.confidence, 0.95)
        
        self.assertEqual(segment2.start_time, 5.0)
        self.assertEqual(segment2.end_time, 10.0)
        self.assertEqual(segment2.text, 'This is the second segment.')
        self.assertEqual(segment2.confidence, 0.92)
        
        # Check segments are associated with the transcript
        segments = TranscriptionSegment.objects.filter(transcript=self.transcript).order_by('start_time')
        self.assertEqual(segments.count(), 2)
        self.assertEqual(segments[0].text, 'This is the first segment.')
        self.assertEqual(segments[1].text, 'This is the second segment.')


class TranscriptionAPITests(APITestCase):
    """Test cases for the Transcription API endpoints"""
    
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
        
        # Create an audio recording
        self.recording = AudioRecording.objects.create(
            session=self.session,
            title='Test Recording',
            duration=120,
            status='completed',
            file_path='recordings/test-recording.wav'
        )
        
        # Create a transcript
        self.transcript = Transcript.objects.create(
            recording=self.recording,
            session=self.session,
            title='Test Transcript',
            text='This is a test transcript content.',
            status='completed'
        )
        
        # Create transcription segments
        self.segment1 = TranscriptionSegment.objects.create(
            transcript=self.transcript,
            recording=self.recording,
            start_time=0.0,
            end_time=5.0,
            text='This is the first segment.',
            confidence=0.95
        )
        
        self.segment2 = TranscriptionSegment.objects.create(
            transcript=self.transcript,
            recording=self.recording,
            start_time=5.0,
            end_time=10.0,
            text='This is the second segment.',
            confidence=0.92
        )
        
        # API URLs
        self.recordings_url = reverse('recording-list')
        self.recording_detail_url = reverse('recording-detail', args=[self.recording.id])
        self.transcript_url = reverse('transcript-detail', args=[self.transcript.id])
        self.segments_url = reverse('segment-list', args=[self.transcript.id])
    
    @patch('transcription.views.transcribe_audio')
    def test_upload_audio(self, mock_transcribe):
        """Test uploading audio file"""
        # Mock the transcribe_audio function
        mock_transcribe.return_value = {
            'text': 'This is a mocked transcription result.',
            'segments': [
                {'start': 0.0, 'end': 5.0, 'text': 'This is a mocked', 'confidence': 0.95},
                {'start': 5.0, 'end': 10.0, 'text': 'transcription result.', 'confidence': 0.92}
            ]
        }
        
        # Create a simple WAV file for testing
        audio_file = SimpleUploadedFile(
            "test_audio.wav",
            b"file_content",
            content_type="audio/wav"
        )
        
        data = {
            'title': 'Uploaded Audio',
            'session_id': str(self.session.id),
            'audio_file': audio_file
        }
        
        response = self.client.post(
            self.recordings_url,
            data,
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Uploaded Audio')
        self.assertEqual(response.data['status'], 'completed')
        
        # Verify a new recording was created in the database
        self.assertEqual(AudioRecording.objects.count(), 2)  # Including the one created in setUp
        
        # Verify transcribe_audio was called
        mock_transcribe.assert_called_once()
        
        # Verify a transcript was created
        newest_recording = AudioRecording.objects.latest('created_at')
        transcript_exists = Transcript.objects.filter(recording=newest_recording).exists()
        self.assertTrue(transcript_exists)
    
    def test_get_recordings(self):
        """Test getting all recordings for a session"""
        response = self.client.get(
            f"{self.recordings_url}?session_id={self.session.id}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Should have one recording created in setUp
        self.assertEqual(response.data[0]['title'], 'Test Recording')
    
    def test_get_recording_detail(self):
        """Test getting a specific recording"""
        response = self.client.get(self.recording_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Recording')
        self.assertEqual(response.data['duration'], 120)
    
    def test_get_transcript(self):
        """Test getting a transcript"""
        response = self.client.get(self.transcript_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Transcript')
        self.assertEqual(response.data['text'], 'This is a test transcript content.')
    
    def test_get_transcript_segments(self):
        """Test getting transcript segments"""
        response = self.client.get(self.segments_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Should have two segments created in setUp
        self.assertEqual(response.data[0]['text'], 'This is the first segment.')
        self.assertEqual(response.data[1]['text'], 'This is the second segment.')
    
    def test_update_transcript(self):
        """Test updating a transcript"""
        update_data = {
            'text': 'This is an updated transcript content.'
        }
        
        response = self.client.patch(
            self.transcript_url,
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['text'], 'This is an updated transcript content.')
        
        # Verify the update in the database
        updated_transcript = Transcript.objects.get(id=self.transcript.id)
        self.assertEqual(updated_transcript.text, 'This is an updated transcript content.')


class OpenAIWhisperIntegrationTests(TestCase):
    """Test cases for OpenAI Whisper integration"""
    
    @patch('transcription.services.openai.Audio.transcribe')
    def test_transcribe_audio(self, mock_transcribe):
        """Test transcribing audio with OpenAI Whisper"""
        from transcription.services import transcribe_audio
        
        # Mock the OpenAI API response
        mock_transcribe.return_value = MagicMock(
            text="This is a test transcription.",
            segments=[
                MagicMock(
                    start=0.0,
                    end=5.0,
                    text="This is a test",
                    confidence=0.95
                ),
                MagicMock(
                    start=5.0,
                    end=10.0,
                    text="transcription.",
                    confidence=0.92
                )
            ]
        )
        
        result = transcribe_audio('test_file_path.wav')
        
        self.assertEqual(result['text'], "This is a test transcription.")
        self.assertEqual(len(result['segments']), 2)
        self.assertEqual(result['segments'][0]['text'], "This is a test")
        self.assertEqual(result['segments'][1]['text'], "transcription.")
        
        # Verify the OpenAI API was called correctly
        mock_transcribe.assert_called_once_with(
            file=open('test_file_path.wav', 'rb'),
            model="whisper-1",
            response_format="verbose_json"
        )
