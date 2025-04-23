# NDISuite Report Generator - Comprehensive Implementation Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [System Requirements](#system-requirements)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Integration Points](#integration-points)
7. [Deployment Guide](#deployment-guide)
8. [Testing Strategy](#testing-strategy)
9. [Maintenance and Monitoring](#maintenance-and-monitoring)

## Introduction

This document provides a comprehensive guide for implementing the NDISuite Report Generator feature, with special emphasis on the enhanced audio recording and transcription system. The Report Generator is designed to streamline the process of creating structured NDIS reports from various inputs including:

- Live audio recording with real-time transcription
- Uploaded audio files
- Document uploads (PDF, DOCX, TXT)
- Manual text entry

The implementation follows a bottom-up approach, detailing the complete architecture and construction of both backend and frontend components necessary for unified and harmonious function.

## Implementation Steps Overview

[ ] **Step 1:** Set up development environment and infrastructure
[ ] **Step 2:** Implement core backend services
[ ] **Step 3:** Develop data processing pipeline
[ ] **Step 4:** Create API endpoints
[ ] **Step 5:** Implement authentication and authorization
[ ] **Step 6:** Develop frontend core components
[ ] **Step 7:** Implement enhanced audio recording and transcription
[ ] **Step 8:** Create document upload and processing feature
[ ] **Step 9:** Develop report generation UI
[ ] **Step 10:** Implement report editing and refinement
[ ] **Step 11:** Create export and sharing features
[ ] **Step 12:** Implement comprehensive testing
[ ] **Step 13:** Set up continuous integration and deployment
[ ] **Step 14:** Create documentation and user guides
[ ] **Step 15:** Configure monitoring and analytics

## Architecture Overview

The NDISuite Report Generator uses a modern, scalable architecture with the following key components:

### Backend Architecture

1. **Django REST Framework**: Core application framework
   - Handles API requests and business logic
   - Manages authentication and permissions
   - Provides structured data modeling

2. **PostgreSQL**: Primary structured database
   - Stores user data, report configurations, and metadata
   - Manages relationships between entities
   - Handles transactional operations

3. **MongoDB**: Unstructured data storage
   - Stores transcription results and report content
   - Manages vector embeddings for AI processing
   - Provides flexible schema for varied content types

4. **Redis**: Caching and queue management
   - Facilitates real-time communication
   - Manages background job queues
   - Provides session storage and caching

5. **Celery**: Asynchronous task processing
   - Handles long-running operations (transcription, AI processing)
   - Manages scheduled tasks
   - Provides task monitoring and retry mechanisms

6. **S3-compatible Storage**: Media file storage
   - Stores audio recordings and uploaded documents
   - Manages versioning and access control
   - Provides secure access to media files

7. **LangChain**: AI orchestration
   - Manages interaction with LLM services
   - Handles RAG (Retrieval Augmented Generation)
   - Provides content chunking and processing

### Frontend Architecture

1. **Next.js**: React framework
   - Provides server-side rendering
   - Manages routing and state
   - Facilitates API communication

2. **React Context API**: State management
   - Manages application state
   - Handles component communication
   - Provides authentication context

3. **Tailwind CSS with Shadcn/UI**: UI framework
   - Provides consistent styling and theming
   - Offers accessible UI components
   - Enables responsive design

4. **Enhanced Audio Recording System**: Media capture
   - Provides resilient recording capabilities
   - Manages WebSocket streaming for real-time transcription
   - Includes comprehensive fallback mechanisms

5. **File Upload System**: Document processing
   - Handles various file formats (audio, PDF, DOCX, TXT)
   - Manages file validation and processing
   - Provides progress feedback

### Integration Architecture

1. **WebSocket Service**: Real-time communication
   - Facilitates live transcription streaming
   - Provides bi-directional communication
   - Manages connection state and fallbacks

2. **OpenAI API**: AI services
   - Provides audio transcription (Whisper)
   - Handles text generation and refinement (GPT models)
   - Manages conversation context and content generation

3. **Background Task System**: Asynchronous processing
   - Handles document parsing and processing
   - Manages transcription and content generation
   - Provides progress tracking and notification

4. **Export Services**: Document generation
   - Creates formatted exports (PDF, DOCX)
   - Handles template application
   - Manages formatting and styling

## System Requirements

### Software Requirements

#### Backend
- Python 3.10+
- Django 4.2+
- Django REST Framework 3.14+
- PostgreSQL 14+
- MongoDB 6.0+
- Redis 7.0+
- Celery 5.3+
- LangChain 0.1.0+
- Uvicorn/Gunicorn for ASGI serving
- OpenAI API client
- PyMuPDF for PDF processing
- python-docx for DOCX processing
- Tesseract OCR (optional for image-based PDFs)

#### Frontend
- Node.js 18+
- Next.js 14+
- React 18+
- TypeScript 5.0+
- Tailwind CSS 3.3+
- Shadcn/UI component library
- OpenAI API client (client-side)
- MediaRecorder API compatible browsers
- WebSocket API support

### Hardware Requirements

#### Development Environment
- 4+ CPU cores
- 16GB+ RAM
- 20GB+ available storage
- Microphone for audio recording testing

#### Production Environment
- 8+ CPU cores
- 32GB+ RAM
- 100GB+ SSD storage
- Scalable cloud infrastructure
- Load balancing for WebSocket connections

### Network Requirements
- HTTPS/WSS for secure connections
- Firewall rules for WebSocket connections
- Access to OpenAI API endpoints
- Low-latency connection for real-time transcription

### Security Requirements
- JWT-based authentication
- Role-based access control
- CORS configuration
- API key management and rotation
- Data encryption at rest and in transit
- PII handling compliant with relevant regulations

### Environment Variables
The following environment variables must be configured:

```
# Django Settings
DEBUG=False
SECRET_KEY=your-secure-secret-key
DJANGO_ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database Configuration
DB_NAME=ndisuite_reports
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432

# MongoDB Configuration
MONGODB_URI=mongodb://username:password@localhost:27017/ndisuite

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# S3 Storage Configuration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=ndisuite-media
AWS_S3_REGION_NAME=ap-southeast-2

# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key

# Model Settings
TRANSCRIPTION_MODEL=whisper-1
RAG_MODEL=gpt-4o
REFINING_MODEL=gpt-4-turbo

# Frontend Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_USE_ENHANCED_AUDIO_RECORDER=true
NEXT_PUBLIC_RESILIENT_TRANSCRIPTION=true
NEXT_PUBLIC_TRANSCRIPTION_WS_URL=wss://api.your-domain.com/transcription
NEXT_PUBLIC_OPENAI_API_KEY=your-client-side-openai-key
```

## Backend Implementation

### Step 1: Database Schema Design

#### 1.1. PostgreSQL Models

Create the following Django models to represent our structured data:

**1. File: `backend/report_generator/models/user_models.py`**
```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class NDISUser(AbstractUser):
    """
    Extended user model with NDIS-specific fields
    """
    organization = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=255, blank=True)
    ndis_provider_number = models.CharField(max_length=100, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    preferences = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'NDIS User'
        verbose_name_plural = 'NDIS Users'
        
    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"
```

**2. File: `backend/report_generator/models/session_models.py`**
```python
from django.db import models
from .user_models import NDISUser
import uuid

class Session(models.Model):
    """
    Represents a report generation session
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(NDISUser, on_delete=models.CASCADE, related_name='sessions')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=50,
        choices=[
            ('draft', 'Draft'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('archived', 'Archived'),
        ],
        default='draft'
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Session'
        verbose_name_plural = 'Sessions'
        ordering = ['-updated_at']
        
    def __str__(self):
        return f"{self.title} ({self.id})"

class InputFile(models.Model):
    """
    Represents an input file (audio, document) for a session
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='input_files')
    file = models.FileField(upload_to='input_files/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(
        max_length=50,
        choices=[
            ('audio', 'Audio Recording'),
            ('pdf', 'PDF Document'),
            ('docx', 'Word Document'),
            ('txt', 'Text Document'),
            ('other', 'Other'),
        ]
    )
    file_size = models.PositiveIntegerField(help_text='File size in bytes')
    processing_status = models.CharField(
        max_length=50,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Input File'
        verbose_name_plural = 'Input Files'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.file_name} ({self.file_type})"
```

**3. File: `backend/report_generator/models/transcript_models.py`**
```python
from django.db import models
from .session_models import Session, InputFile
import uuid

class Transcript(models.Model):
    """
    Represents a transcript from audio input
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='transcripts')
    input_file = models.OneToOneField(
        InputFile, 
        null=True, 
        blank=True,
        on_delete=models.SET_NULL, 
        related_name='transcript'
    )
    title = models.CharField(max_length=255)
    transcription_method = models.CharField(
        max_length=50,
        choices=[
            ('websocket', 'WebSocket Streaming'),
            ('openai', 'OpenAI Whisper API'),
            ('webspeech', 'Web Speech API'),
            ('local', 'Local Processing'),
            ('manual', 'Manual Entry'),
            ('imported', 'Imported File'),
        ]
    )
    language_code = models.CharField(max_length=10, default='en-US')
    transcript_length = models.PositiveIntegerField(default=0, help_text='Length in characters')
    # The actual transcript text is stored in MongoDB
    mongodb_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Transcript'
        verbose_name_plural = 'Transcripts'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} ({self.transcription_method})"
```

**4. File: `backend/report_generator/models/output_models.py`**
```python
from django.db import models
from .session_models import Session
from .user_models import NDISUser
import uuid

class OutputConfiguration(models.Model):
    """
    Represents the configuration for report output
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='configurations')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_template = models.BooleanField(default=False)
    template_name = models.CharField(max_length=255, blank=True)
    template_category = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(NDISUser, on_delete=models.CASCADE, related_name='configurations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Output Configuration'
        verbose_name_plural = 'Output Configurations'
        ordering = ['-updated_at']
        
    def __str__(self):
        return f"{self.title} ({'Template' if self.is_template else 'Configuration'})"

class OutputField(models.Model):
    """
    Represents a field in the output configuration
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    configuration = models.ForeignKey(OutputConfiguration, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=255)
    field_type = models.CharField(
        max_length=50,
        choices=[
            ('text', 'Text'),
            ('list', 'List'),
            ('table', 'Table'),
            ('checkbox', 'Checkbox'),
            ('rating', 'Rating'),
        ]
    )
    description = models.TextField(blank=True)
    required = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)
    options = models.JSONField(default=dict, blank=True) 
    # The generated content is stored in MongoDB
    mongodb_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Output Field'
        verbose_name_plural = 'Output Fields'
        ordering = ['order']
        
    def __str__(self):
        return f"{self.name} ({self.field_type})"

class Report(models.Model):
    """
    Represents a generated report
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='reports')
    configuration = models.ForeignKey(OutputConfiguration, on_delete=models.CASCADE, related_name='reports')
    title = models.CharField(max_length=255)
    status = models.CharField(
        max_length=50,
        choices=[
            ('draft', 'Draft'),
            ('generated', 'Generated'),
            ('refined', 'Refined'),
            ('finalized', 'Finalized'),
            ('exported', 'Exported'),
        ],
        default='draft'
    )
    created_by = models.ForeignKey(NDISUser, on_delete=models.CASCADE, related_name='reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
        ordering = ['-updated_at']
        
    def __str__(self):
        return f"{self.title} ({self.status})"
```

#### 1.2. MongoDB Schema

Define the MongoDB collections for unstructured data storage:

**File: `backend/report_generator/mongodb/schemas.py`**
```python
from mongoengine import Document, StringField, DateTimeField, DictField, ListField, ReferenceField, UUIDField, IntField
from bson.binary import Binary
import uuid

class TranscriptContent(Document):
    """
    Stores the full transcript text and segments
    """
    uuid = UUIDField(primary_key=True, default=uuid.uuid4)
    text = StringField(required=True)
    segments = ListField(DictField())  # List of segments with timestamps
    metadata = DictField()
    created_at = DateTimeField()
    updated_at = DateTimeField()
    
    meta = {
        'collection': 'transcript_content',
        'indexes': ['uuid', 'created_at']
    }

class VectorStore(Document):
    """
    Stores vector embeddings for RAG processing
    """
    uuid = UUIDField(primary_key=True, default=uuid.uuid4)
    session_id = StringField(required=True)
    chunks = ListField(DictField())  # List of text chunks
    embeddings = ListField(ListField(FloatField()))  # Vector embeddings
    metadata = DictField()
    created_at = DateTimeField()
    updated_at = DateTimeField()
    
    meta = {
        'collection': 'vector_store',
        'indexes': ['uuid', 'session_id']
    }

class FieldContent(Document):
    """
    Stores the content for output fields
    """
    uuid = UUIDField(primary_key=True, default=uuid.uuid4)
    field_id = StringField(required=True)
    content = StringField(required=True)
    versions = ListField(DictField())  # History of content versions
    metadata = DictField()
    created_at = DateTimeField()
    updated_at = DateTimeField()
    
    meta = {
        'collection': 'field_content',
        'indexes': ['uuid', 'field_id']
    }

class Refinement(Document):
    """
    Stores refinement details for content
    """
    uuid = UUIDField(primary_key=True, default=uuid.uuid4)
    field_content_id = StringField(required=True)
    highlighted_text = StringField(required=True)
    instructions = StringField(required=True)
    refined_text = StringField()
    status = StringField(choices=['pending', 'processing', 'completed', 'failed'])
    metadata = DictField()
    created_at = DateTimeField()
    updated_at = DateTimeField()
    
    meta = {
        'collection': 'refinement',
        'indexes': ['uuid', 'field_content_id']
    }
```

### Step 2: Backend Services Implementation

#### 2.1. WebSocket Transcription Service

Implement a WebSocket-based transcription service using channels and ASGI:

**1. File: `backend/transcription/consumers.py`**
```python
import json
import uuid
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from .services import TranscriptionService

logger = logging.getLogger(__name__)

class TranscriptionConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time audio transcription
    """
    
    async def connect(self):
        # Generate a unique channel name for this connection
        self.room_name = str(uuid.uuid4())
        self.room_group_name = f"transcription_{self.room_name}"
        self.is_streaming = False
        self.transcription_service = None
        self.session_id = None
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connection established: {self.room_name}")
        
    async def disconnect(self, close_code):
        # Stop transcription if it's running
        if self.is_streaming and self.transcription_service:
            await sync_to_async(self.transcription_service.stop)()        
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        logger.info(f"WebSocket connection closed: {self.room_name}, code: {close_code}")
    
    async def receive(self, text_data=None, bytes_data=None):
        """
        Handle incoming messages from the WebSocket
        """
        if text_data:
            try:
                # Parse the JSON data
                data = json.loads(text_data)
                message_type = data.get('type')
                
                if message_type == 'start':
                    # Handle start transcription request
                    self.session_id = data.get('session_id')
                    language = data.get('language', 'en-US')
                    await self.start_transcription(self.session_id, language)
                
                elif message_type == 'stop':
                    # Handle stop transcription request
                    await self.stop_transcription()
                    
                elif message_type == 'ping':
                    # Handle ping to keep connection alive
                    await self.send(text_data=json.dumps({
                        'type': 'pong',
                        'timestamp': data.get('timestamp')
                    }))
            
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {text_data}")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Invalid JSON format'
                }))
                
        elif bytes_data:
            # Handle audio data if transcription is active
            if self.is_streaming and self.transcription_service:
                try:
                    # Process audio chunk
                    result = await sync_to_async(self.transcription_service.process_chunk)(bytes_data)
                    
                    if result and result.get('transcription'):
                        # Send transcription results to the client
                        await self.send(text_data=json.dumps({
                            'type': 'transcription',
                            'text': result.get('transcription'),
                            'is_final': result.get('is_final', False),
                            'confidence': result.get('confidence', 0.0)
                        }))
                except Exception as e:
                    logger.error(f"Error processing audio chunk: {str(e)}")
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': f"Processing error: {str(e)}"
                    }))
    
    async def start_transcription(self, session_id, language):
        """
        Initialize and start the transcription service
        """
        try:
            # Create a new transcription service instance
            self.transcription_service = await sync_to_async(TranscriptionService)(session_id, language)
            await sync_to_async(self.transcription_service.start)()
            self.is_streaming = True
            
            # Notify client that transcription has started
            await self.send(text_data=json.dumps({
                'type': 'status',
                'status': 'started',
                'session_id': session_id
            }))
            
            logger.info(f"Started transcription for session {session_id}")
            
        except Exception as e:
            logger.error(f"Failed to start transcription: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f"Failed to start transcription: {str(e)}"
            }))
    
    async def stop_transcription(self):
        """
        Stop the transcription service and finalize the transcript
        """
        if self.is_streaming and self.transcription_service:
            try:
                # Finalize and get the complete transcript
                final_result = await sync_to_async(self.transcription_service.stop)()
                
                # Send the final transcript to the client
                await self.send(text_data=json.dumps({
                    'type': 'transcription_complete',
                    'text': final_result.get('transcription', ''),
                    'duration': final_result.get('duration', 0),
                    'session_id': self.session_id
                }))
                
                self.is_streaming = False
                logger.info(f"Stopped transcription for session {self.session_id}")
                
            except Exception as e:
                logger.error(f"Error stopping transcription: {str(e)}")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f"Error finalizing transcript: {str(e)}"
                }))
```

**2. File: `backend/transcription/routing.py`**
```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/transcription/$', consumers.TranscriptionConsumer.as_asgi()),
]
```

**3. File: `backend/transcription/services.py`**
```python
import io
import time
import datetime
import logging
import openai
from django.conf import settings
from report_generator.models import Session, Transcript, InputFile
from report_generator.mongodb.schemas import TranscriptContent

logger = logging.getLogger(__name__)

class TranscriptionService:
    """
    Handles audio transcription using OpenAI's Whisper API
    """
    
    def __init__(self, session_id, language='en-US'):
        self.session_id = session_id
        self.language = language
        self.start_time = None
        self.audio_chunks = []
        self.interim_results = []
        self.is_streaming = False
        self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.transcript_id = None
        
    def start(self):
        """
        Initialize the transcription session
        """
        self.start_time = time.time()
        self.is_streaming = True
        self.audio_chunks = []
        self.interim_results = []
        logger.info(f"Starting transcription service for session {self.session_id}")
        
    def process_chunk(self, audio_chunk):
        """
        Process an audio chunk and get an interim transcription result
        """
        if not self.is_streaming:
            return None
            
        # Store the audio chunk for later processing
        self.audio_chunks.append(audio_chunk)
        
        # Process only accumulated chunks periodically to avoid excessive API calls
        # This is a simplified example - in production, use a more sophisticated approach
        if len(self.audio_chunks) % 10 == 0:  # Every 10 chunks
            try:
                # Combine recent chunks for interim transcription
                recent_chunks = self.audio_chunks[-30:]  # Last ~3 seconds
                combined_audio = b''.join(recent_chunks)
                
                # Create a temporary file-like object
                audio_file = io.BytesIO(combined_audio)
                audio_file.name = "chunk.webm"  # Set a filename with extension
                
                # Get transcription from OpenAI Whisper
                result = self.openai_client.audio.transcriptions.create(
                    file=audio_file,
                    model=settings.TRANSCRIPTION_MODEL,
                    language=self.language[:2],  # Whisper wants just 'en' not 'en-US'
                    prompt=self._get_prompt_from_previous_results()
                )
                
                if result.text:
                    # Store the result
                    timestamp = time.time() - self.start_time
                    interim_result = {
                        'text': result.text,
                        'timestamp': timestamp,
                        'is_final': False
                    }
                    self.interim_results.append(interim_result)
                    
                    return {
                        'transcription': result.text,
                        'is_final': False,
                        'confidence': 0.8  # Whisper doesn't provide confidence, using a default
                    }
                    
            except Exception as e:
                logger.error(f"Error in interim transcription: {str(e)}")
                # Return empty but don't fail the streaming process
                return {
                    'transcription': '',
                    'is_final': False,
                    'error': str(e)
                }
                
        # Return empty for chunks we're not processing yet
        return {
            'transcription': '',
            'is_final': False
        }
    
    def stop(self):
        """
        Stop transcription and get the final result
        """
        if not self.is_streaming:
            return {'transcription': '', 'duration': 0}
            
        self.is_streaming = False
        end_time = time.time()
        duration = end_time - self.start_time
        
        try:
            # Combine all audio chunks for final transcription
            combined_audio = b''.join(self.audio_chunks)
            
            # If we have enough audio, transcribe it
            if len(combined_audio) > 1000:  # Arbitrary threshold
                # Create a temporary file-like object
                audio_file = io.BytesIO(combined_audio)
                audio_file.name = "recording.webm"  # Set a filename with extension
                
                # Get final transcription from OpenAI Whisper
                result = self.openai_client.audio.transcriptions.create(
                    file=audio_file,
                    model=settings.TRANSCRIPTION_MODEL,
                    language=self.language[:2],
                    response_format="verbose_json"  # Get detailed response with timestamps
                )
                
                # Parse the detailed response
                transcription = result.text
                segments = result.segments if hasattr(result, 'segments') else []
                
                # Save the transcript to the database
                transcript_id = self._save_transcript(transcription, segments, duration)
                
                return {
                    'transcription': transcription,
                    'duration': duration,
                    'transcript_id': transcript_id
                }
            else:
                logger.warning(f"Not enough audio data for transcription, session {self.session_id}")
                return {'transcription': '', 'duration': duration}
                
        except Exception as e:
            logger.error(f"Error in final transcription: {str(e)}")
            return {'transcription': '', 'duration': duration, 'error': str(e)}
    
    def _get_prompt_from_previous_results(self):
        """
        Create a prompt from previous interim results to improve continuity
        """
        if not self.interim_results:
            return ""
            
        # Use the last few interim results as context
        recent_results = self.interim_results[-3:]
        return " ".join([r['text'] for r in recent_results])
    
    def _save_transcript(self, text, segments, duration):
        """
        Save the transcript to PostgreSQL and MongoDB
        """
        try:
            # 1. Create MongoDB document for the full transcript content
            mongo_doc = TranscriptContent(
                uuid=uuid.uuid4(),
                text=text,
                segments=segments,
                metadata={
                    'session_id': self.session_id,
                    'language': self.language,
                    'duration': duration,
                    'transcription_method': 'websocket'
                },
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            mongo_doc.save()
            
            # 2. Create a new input file record for the audio
            session = Session.objects.get(id=self.session_id)
            
            # Create temporary file object to save
            combined_audio = b''.join(self.audio_chunks)
            audio_file = io.BytesIO(combined_audio)
            audio_file.name = f"recording_{self.session_id}.webm"
            
            # Save input file record
            input_file = InputFile(
                session=session,
                file_name=f"recording_{self.session_id}.webm",
                file_type='audio',
                file_size=len(combined_audio),
                processing_status='completed',
                metadata={
                    'duration': duration,
                    'language': self.language
                }
            )
            
            # Manually save file content
            file_path = f"input_files/recording_{self.session_id}.webm"
            input_file.file.save(file_path, audio_file)
            input_file.save()
            
            # 3. Create transcript record linked to the MongoDB document
            transcript = Transcript(
                session=session,
                input_file=input_file,
                title=f"Transcript {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}",
                transcription_method='websocket',
                language_code=self.language,
                transcript_length=len(text),
                mongodb_id=str(mongo_doc.uuid)
            )
            transcript.save()
            
            self.transcript_id = str(transcript.id)
            return self.transcript_id
            
        except Exception as e:
            logger.error(f"Error saving transcript: {str(e)}")
            raise
```

#### 2.2. REST API Endpoints

Implement the REST API endpoints for the report generator:

**1. File: `backend/report_generator/views/session_views.py`**
```python
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound

from django.shortcuts import get_object_or_404

from ..models import Session, InputFile
from ..serializers import SessionSerializer, SessionDetailSerializer, InputFileSerializer

class SessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing report generation sessions
    """
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return sessions for the current user only
        """
        return Session.objects.filter(user=self.request.user).order_by('-updated_at')
    
    def get_serializer_class(self):
        """
        Use different serializers for list and detail views
        """
        if self.action == 'retrieve':
            return SessionDetailSerializer
        return SessionSerializer
    
    def perform_create(self, serializer):
        """
        Set the current user when creating a session
        """
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def files(self, request, pk=None):
        """
        Get all input files for a session
        """
        session = self.get_object()
        files = InputFile.objects.filter(session=session)
        serializer = InputFileSerializer(files, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """
        Trigger processing for a session (content generation from inputs)
        """
        from ..tasks import process_session_inputs
        
        session = self.get_object()
        
        # Check if session has inputs
        if not session.input_files.exists():
            return Response(
                {"error": "Session has no input files to process"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update session status
        session.status = 'in_progress'
        session.save()
        
        # Queue processing task
        process_session_inputs.delay(str(session.id))
        
        return Response(
            {"status": "processing", "message": "Session processing has been queued"}
        )
```

**2. File: `backend/report_generator/views/file_views.py`**
```python
from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action

from django.shortcuts import get_object_or_404

from ..models import Session, InputFile, Transcript
from ..serializers import InputFileSerializer, TranscriptSerializer
from ..tasks import process_file

class InputFileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing input files (audio, documents)
    """
    serializer_class = InputFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    
    def get_queryset(self):
        """
        Return files for the current user's sessions only
        """
        return InputFile.objects.filter(session__user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """
        Custom file upload handling
        """
        # Get session
        session_id = request.data.get('session_id')
        if not session_id:
            return Response(
                {"error": "session_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Verify session exists and belongs to user
        try:
            session = Session.objects.get(id=session_id, user=request.user)
        except Session.DoesNotExist:
            return Response(
                {"error": "Session not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get uploaded file
        file_obj = request.data.get('file')
        if not file_obj:
            return Response(
                {"error": "No file provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Determine file type
        filename = file_obj.name.lower()
        if filename.endswith(('.mp3', '.wav', '.webm', '.m4a')):
            file_type = 'audio'
        elif filename.endswith('.pdf'):
            file_type = 'pdf'
        elif filename.endswith(('.docx', '.doc')):
            file_type = 'docx'
        elif filename.endswith('.txt'):
            file_type = 'txt'
        else:
            file_type = 'other'
        
        # Create input file record
        input_file = InputFile(
            session=session,
            file=file_obj,
            file_name=file_obj.name,
            file_type=file_type,
            file_size=file_obj.size,
            processing_status='pending'
        )
        input_file.save()
        
        # Queue file processing task
        process_file.delay(str(input_file.id))
        
        # Return serialized data
        serializer = self.get_serializer(input_file)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def transcript(self, request, pk=None):
        """
        Get the transcript for an audio file
        """
        input_file = self.get_object()
        
        if input_file.file_type != 'audio':
            return Response(
                {"error": "This file is not an audio recording"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            transcript = Transcript.objects.get(input_file=input_file)
            serializer = TranscriptSerializer(transcript)
            return Response(serializer.data)
            
        except Transcript.DoesNotExist:
            return Response(
                {"error": "Transcript not found for this file"}, 
                status=status.HTTP_404_NOT_FOUND
            )
```

**3. File: `backend/report_generator/views/report_views.py`**
```python
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action

from django.shortcuts import get_object_or_404

from ..models import Session, Report, OutputConfiguration
from ..serializers import ReportSerializer, ReportDetailSerializer, OutputConfigurationSerializer
from ..tasks import generate_report, export_report

class ReportViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing generated reports
    """
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return reports for the current user only
        """
        return Report.objects.filter(created_by=self.request.user).order_by('-updated_at')
    
    def get_serializer_class(self):
        """
        Use different serializers for list and detail views
        """
        if self.action == 'retrieve':
            return ReportDetailSerializer
        return ReportSerializer
    
    def perform_create(self, serializer):
        """
        Set the current user when creating a report
        """
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """
        Generate or regenerate report content
        """
        report = self.get_object()
        
        # Queue report generation task
        generate_report.delay(str(report.id))
        
        return Response(
            {"status": "generating", "message": "Report generation has been queued"}
        )
    
    @action(detail=True, methods=['post'])
    def export(self, request, pk=None):
        """
        Export report to a document format (PDF, DOCX)
        """
        report = self.get_object()
        format = request.data.get('format', 'pdf').lower()
        
        if format not in ['pdf', 'docx']:
            return Response(
                {"error": "Format must be 'pdf' or 'docx'"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Queue export task
        task = export_report.delay(str(report.id), format)
        
        return Response({
            "status": "exporting",
            "message": f"Report export to {format.upper()} has been queued",
            "task_id": task.id
        })

class OutputConfigurationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing report output configurations
    """
    serializer_class = OutputConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return configurations for the current user only,
        optionally filtered by template status
        """
        queryset = OutputConfiguration.objects.filter(created_by=self.request.user)
        
        # Filter by template status if requested
        is_template = self.request.query_params.get('is_template', None)
        if is_template is not None:
            is_template = is_template.lower() == 'true'
            queryset = queryset.filter(is_template=is_template)
            
        return queryset.order_by('-updated_at')
    
    def perform_create(self, serializer):
        """
        Set the current user when creating a configuration
        """
        serializer.save(created_by=self.request.user)
```

**4. File: `backend/report_generator/urls.py`**
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import session_views, file_views, report_views

router = DefaultRouter()
router.register(r'sessions', session_views.SessionViewSet, basename='session')
router.register(r'files', file_views.InputFileViewSet, basename='file')
router.register(r'reports', report_views.ReportViewSet, basename='report')
router.register(r'configurations', report_views.OutputConfigurationViewSet, basename='configuration')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

**5. File: `backend/report_generator/serializers.py`**
```python
from rest_framework import serializers
from .models import Session, InputFile, Transcript, Report, OutputConfiguration, OutputField
from .mongodb.schemas import TranscriptContent, FieldContent
from bson import ObjectId

class InputFileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = InputFile
        fields = ['id', 'session', 'file_name', 'file_type', 'file_size', 
                  'processing_status', 'url', 'created_at', 'updated_at', 'metadata']
        read_only_fields = ['id', 'file_size', 'created_at', 'updated_at']
    
    def get_url(self, obj):
        if obj.file:
            return obj.file.url
        return None

class TranscriptSerializer(serializers.ModelSerializer):
    text = serializers.SerializerMethodField()
    segments = serializers.SerializerMethodField()
    
    class Meta:
        model = Transcript
        fields = ['id', 'session', 'input_file', 'title', 'transcription_method',
                  'language_code', 'transcript_length', 'text', 'segments', 'created_at']
    
    def get_text(self, obj):
        if obj.mongodb_id:
            try:
                content = TranscriptContent.objects.get(uuid=obj.mongodb_id)
                return content.text
            except TranscriptContent.DoesNotExist:
                return None
        return None
    
    def get_segments(self, obj):
        if obj.mongodb_id:
            try:
                content = TranscriptContent.objects.get(uuid=obj.mongodb_id)
                return content.segments
            except TranscriptContent.DoesNotExist:
                return []
        return []

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'title', 'description', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class SessionDetailSerializer(serializers.ModelSerializer):
    input_files = InputFileSerializer(many=True, read_only=True)
    
    class Meta:
        model = Session
        fields = ['id', 'title', 'description', 'status', 'metadata', 
                  'input_files', 'created_at', 'updated_at']
        read_only_fields = ['id', 'input_files', 'created_at', 'updated_at']

class OutputFieldSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()
    
    class Meta:
        model = OutputField
        fields = ['id', 'name', 'field_type', 'description', 'required', 
                  'order', 'options', 'content']
    
    def get_content(self, obj):
        if obj.mongodb_id:
            try:
                content = FieldContent.objects.get(uuid=obj.mongodb_id)
                return content.content
            except FieldContent.DoesNotExist:
                return None
        return None

class OutputConfigurationSerializer(serializers.ModelSerializer):
    fields = OutputFieldSerializer(many=True, read_only=True)
    
    class Meta:
        model = OutputConfiguration
        fields = ['id', 'session', 'title', 'description', 'is_template',
                  'template_name', 'template_category', 'fields',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'session', 'configuration', 'title', 'status',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ReportDetailSerializer(serializers.ModelSerializer):
    configuration = OutputConfigurationSerializer(read_only=True)
    
    class Meta:
        model = Report
        fields = ['id', 'session', 'configuration', 'title', 'status',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
```

#### 2.3. Background Tasks

Implement Celery tasks for handling asynchronous processing:

**1. File: `backend/report_generator/tasks.py`**
```python
import io
import logging
import os
import uuid
import tempfile
import datetime

from celery import shared_task
from django.conf import settings
from django.core.files.storage import default_storage

from .models import Session, InputFile, Transcript, Report, OutputConfiguration, OutputField
from .mongodb.schemas import TranscriptContent, FieldContent, VectorStore
from .services import document_service, ai_service, export_service

logger = logging.getLogger(__name__)

@shared_task
def process_file(file_id):
    """
    Process an uploaded file based on its type
    """
    try:
        input_file = InputFile.objects.get(id=file_id)
        
        # Update status to processing
        input_file.processing_status = 'processing'
        input_file.save()
        
        # Process based on file type
        if input_file.file_type == 'audio':
            # For audio files, transcribe using OpenAI Whisper
            process_audio_file(input_file)
            
        elif input_file.file_type == 'pdf':
            # For PDF files, extract text
            process_pdf_file(input_file)
            
        elif input_file.file_type == 'docx':
            # For DOCX files, extract text
            process_docx_file(input_file)
            
        elif input_file.file_type == 'txt':
            # For TXT files, simply read the content
            process_text_file(input_file)
            
        else:
            # For other files, mark as failed
            input_file.processing_status = 'failed'
            input_file.save()
            logger.error(f"Unsupported file type: {input_file.file_type}, file_id: {file_id}")
            return False
            
        return True
        
    except InputFile.DoesNotExist:
        logger.error(f"Input file not found with ID: {file_id}")
        return False
    except Exception as e:
        # Log the error and update file status
        logger.error(f"Error processing file {file_id}: {str(e)}")
        try:
            input_file = InputFile.objects.get(id=file_id)
            input_file.processing_status = 'failed'
            input_file.save()
        except:
            pass
        return False

def process_audio_file(input_file):
    """
    Transcribe an audio file using OpenAI Whisper API
    """
    try:
        # Get file path
        file_path = input_file.file.path
        
        # Call the document service to transcribe
        transcription = document_service.transcribe_audio_file(file_path)
        
        if transcription:
            # Create MongoDB document
            mongo_doc = TranscriptContent(
                uuid=uuid.uuid4(),
                text=transcription.get('text', ''),
                segments=transcription.get('segments', []),
                metadata={
                    'session_id': str(input_file.session.id),
                    'language': transcription.get('language', 'en'),
                    'duration': transcription.get('duration', 0),
                    'transcription_method': 'openai'
                },
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            mongo_doc.save()
            
            # Create transcript record
            transcript = Transcript(
                session=input_file.session,
                input_file=input_file,
                title=f"Transcript: {input_file.file_name}",
                transcription_method='openai',
                language_code=transcription.get('language', 'en'),
                transcript_length=len(transcription.get('text', '')),
                mongodb_id=str(mongo_doc.uuid)
            )
            transcript.save()
            
            # Update input file status
            input_file.processing_status = 'completed'
            input_file.save()
            
            return True
        else:
            raise Exception("Transcription failed to generate content")
            
    except Exception as e:
        logger.error(f"Error transcribing audio file {input_file.id}: {str(e)}")
        input_file.processing_status = 'failed'
        input_file.save()
        raise

def process_pdf_file(input_file):
    """
    Extract text from a PDF file
    """
    try:
        # Get file path
        file_path = input_file.file.path
        
        # Extract text from PDF
        text_content = document_service.extract_text_from_pdf(file_path)
        
        if text_content:
            # Create MongoDB document
            mongo_doc = TranscriptContent(
                uuid=uuid.uuid4(),
                text=text_content,
                segments=[],  # PDFs don't have segments like audio files
                metadata={
                    'session_id': str(input_file.session.id),
                    'source_type': 'pdf',
                    'file_name': input_file.file_name
                },
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            mongo_doc.save()
            
            # Create transcript record (using the Transcript model for all text content)
            transcript = Transcript(
                session=input_file.session,
                input_file=input_file,
                title=f"Content: {input_file.file_name}",
                transcription_method='imported',
                language_code='en',  # Assuming English, could be improved with language detection
                transcript_length=len(text_content),
                mongodb_id=str(mongo_doc.uuid)
            )
            transcript.save()
            
            # Update input file status
            input_file.processing_status = 'completed'
            input_file.save()
            
            return True
        else:
            raise Exception("Failed to extract text from PDF")
            
    except Exception as e:
        logger.error(f"Error processing PDF file {input_file.id}: {str(e)}")
        input_file.processing_status = 'failed'
        input_file.save()
        raise

def process_docx_file(input_file):
    """
    Extract text from a DOCX file
    """
    try:
        # Get file path
        file_path = input_file.file.path
        
        # Extract text from DOCX
        text_content = document_service.extract_text_from_docx(file_path)
        
        if text_content:
            # Create MongoDB document
            mongo_doc = TranscriptContent(
                uuid=uuid.uuid4(),
                text=text_content,
                segments=[],
                metadata={
                    'session_id': str(input_file.session.id),
                    'source_type': 'docx',
                    'file_name': input_file.file_name
                },
                created_at=datetime.datetime.now(),
                updated_at=datetime.datetime.now()
            )
            mongo_doc.save()
            
            # Create transcript record
            transcript = Transcript(
                session=input_file.session,
                input_file=input_file,
                title=f"Content: {input_file.file_name}",
                transcription_method='imported',
                language_code='en',
                transcript_length=len(text_content),
                mongodb_id=str(mongo_doc.uuid)
            )
            transcript.save()
            
            # Update input file status
            input_file.processing_status = 'completed'
            input_file.save()
            
            return True
        else:
            raise Exception("Failed to extract text from DOCX")
            
    except Exception as e:
        logger.error(f"Error processing DOCX file {input_file.id}: {str(e)}")
        input_file.processing_status = 'failed'
        input_file.save()
        raise

def process_text_file(input_file):
    """
    Process a plain text file
    """
    try:
        # Read text content
        with input_file.file.open('r') as f:
            text_content = f.read()
        
        # Create MongoDB document
        mongo_doc = TranscriptContent(
            uuid=uuid.uuid4(),
            text=text_content,
            segments=[],
            metadata={
                'session_id': str(input_file.session.id),
                'source_type': 'txt',
                'file_name': input_file.file_name
            },
            created_at=datetime.datetime.now(),
            updated_at=datetime.datetime.now()
        )
        mongo_doc.save()
        
        # Create transcript record
        transcript = Transcript(
            session=input_file.session,
            input_file=input_file,
            title=f"Content: {input_file.file_name}",
            transcription_method='imported',
            language_code='en',
            transcript_length=len(text_content),
            mongodb_id=str(mongo_doc.uuid)
        )
        transcript.save()
        
        # Update input file status
        input_file.processing_status = 'completed'
        input_file.save()
        
        return True
        
    except Exception as e:
        logger.error(f"Error processing text file {input_file.id}: {str(e)}")
        input_file.processing_status = 'failed'
        input_file.save()
        raise

@shared_task
def process_session_inputs(session_id):
    """
    Process all inputs for a session and prepare for report generation
    This primarily focuses on generating embeddings for RAG processing
    """
    try:
        session = Session.objects.get(id=session_id)
        
        # Get all transcripts for the session
        transcripts = Transcript.objects.filter(session=session)
        
        if not transcripts.exists():
            logger.warning(f"No transcripts found for session {session_id}")
            return False
        
        # Combine all transcript texts
        combined_text = ""
        for transcript in transcripts:
            try:
                content = TranscriptContent.objects.get(uuid=transcript.mongodb_id)
                combined_text += content.text + "\n\n"
            except TranscriptContent.DoesNotExist:
                logger.warning(f"Transcript content not found for transcript {transcript.id}")
        
        if not combined_text.strip():
            logger.warning(f"No text content found for session {session_id}")
            return False
        
        # Create vector embeddings for RAG
        chunks, embeddings = ai_service.create_embeddings(combined_text)
        
        # Store embeddings in MongoDB
        vector_store = VectorStore(
            uuid=uuid.uuid4(),
            session_id=str(session.id),
            chunks=chunks,
            embeddings=embeddings,
            metadata={
                'source': 'session_inputs',
                'transcript_count': transcripts.count()
            },
            created_at=datetime.datetime.now(),
            updated_at=datetime.datetime.now()
        )
        vector_store.save()
        
        # Update session status
        session.status = 'completed'
        session.metadata['vector_store_id'] = str(vector_store.uuid)
        session.save()
        
        return True
        
    except Session.DoesNotExist:
        logger.error(f"Session not found with ID: {session_id}")
        return False
    except Exception as e:
        logger.error(f"Error processing session inputs {session_id}: {str(e)}")
        try:
            session = Session.objects.get(id=session_id)
            session.status = 'draft'  # Revert to draft if processing fails
            session.save()
        except:
            pass
        return False

@shared_task
def generate_report(report_id):
    """
    Generate report content using AI based on session inputs
    """
    try:
        report = Report.objects.get(id=report_id)
        session = report.session
        configuration = report.configuration
        
        # Update report status
        report.status = 'generated'
        report.save()
        
        # Get vector store ID from session metadata
        vector_store_id = session.metadata.get('vector_store_id')
        if not vector_store_id:
            raise Exception("Vector store ID not found in session metadata")
        
        # Get vector store
        try:
            vector_store = VectorStore.objects.get(uuid=vector_store_id)
        except VectorStore.DoesNotExist:
            raise Exception(f"Vector store not found with ID: {vector_store_id}")
        
        # Get configuration fields
        fields = OutputField.objects.filter(configuration=configuration).order_by('order')
        
        # Generate content for each field
        for field in fields:
            # Generate content using RAG
            content = ai_service.generate_field_content(
                field_name=field.name,
                field_type=field.field_type,
                field_description=field.description,
                vector_store=vector_store
            )
            
            if content:
                # Store content in MongoDB
                field_content = FieldContent(
                    uuid=uuid.uuid4(),
                    field_id=str(field.id),
                    content=content,
                    versions=[{
                        'version': 1,
                        'content': content,
                        'timestamp': datetime.datetime.now().isoformat()
                    }],
                    metadata={
                        'report_id': str(report.id),
                        'field_name': field.name,
                        'field_type': field.field_type
                    },
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                )
                field_content.save()
                
                # Update field with MongoDB ID
                field.mongodb_id = str(field_content.uuid)
                field.save()
        
        # Update report status
        report.status = 'refined'  # Mark as refined after all fields are generated
        report.save()
        
        return True
        
    except Report.DoesNotExist:
        logger.error(f"Report not found with ID: {report_id}")
        return False
    except Exception as e:
        logger.error(f"Error generating report {report_id}: {str(e)}")
        try:
            report = Report.objects.get(id=report_id)
            report.status = 'draft'  # Revert to draft if generation fails
            report.save()
        except:
            pass
        return False

@shared_task
def export_report(report_id, format='pdf'):
    """
    Export a report to PDF or DOCX format
    """
    try:
        report = Report.objects.get(id=report_id)
        configuration = report.configuration
        
        # Get fields with content
        fields = OutputField.objects.filter(configuration=configuration).order_by('order')
        
        # Prepare report data
        report_data = {
            'title': report.title,
            'fields': []
        }
        
        # Get content for each field
        for field in fields:
            if field.mongodb_id:
                try:
                    content = FieldContent.objects.get(uuid=field.mongodb_id)
                    report_data['fields'].append({
                        'name': field.name,
                        'type': field.field_type,
                        'content': content.content,
                        'options': field.options
                    })
                except FieldContent.DoesNotExist:
                    logger.warning(f"Content not found for field {field.id}")
            else:
                logger.warning(f"Field {field.id} has no associated content")
        
        # Generate export file
        if format.lower() == 'pdf':
            file_data = export_service.generate_pdf(report_data)
            filename = f"{report.title.replace(' ', '_')}.pdf"
            content_type = 'application/pdf'
        elif format.lower() == 'docx':
            file_data = export_service.generate_docx(report_data)
            filename = f"{report.title.replace(' ', '_')}.docx"
            content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else:
            raise ValueError(f"Unsupported export format: {format}")
        
        # Save file to storage
        file_path = f"reports/{report.id}/{filename}"
        default_storage.save(file_path, io.BytesIO(file_data))
        
        # Update report metadata with export info
        if 'exports' not in report.metadata:
            report.metadata['exports'] = []
            
        report.metadata['exports'].append({
            'format': format,
            'file_path': file_path,
            'content_type': content_type,
            'timestamp': datetime.datetime.now().isoformat()
        })
        
        # Update report status
        report.status = 'exported'
        report.save()
        
        return True
        
    except Report.DoesNotExist:
        logger.error(f"Report not found with ID: {report_id}")
        return False
    except Exception as e:
        logger.error(f"Error exporting report {report_id}: {str(e)}")
        return False
```

**2. File: `backend/report_generator/services/document_service.py`**
```python
import os
import tempfile
import logging
import openai
from django.conf import settings

logger = logging.getLogger(__name__)

# Import PDF processing libraries
try:
    import fitz  # PyMuPDF
except ImportError:
    logger.warning("PyMuPDF (fitz) not installed. PDF processing will be limited.")

# Import DOCX processing libraries
try:
    import docx
except ImportError:
    logger.warning("python-docx not installed. DOCX processing will be limited.")

def transcribe_audio_file(file_path):
    """
    Transcribe an audio file using OpenAI Whisper API
    """
    try:
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        with open(file_path, 'rb') as audio_file:
            response = client.audio.transcriptions.create(
                file=audio_file,
                model=settings.TRANSCRIPTION_MODEL,
                response_format="verbose_json"
            )
        
        # Extract transcription details
        return {
            'text': response.text,
            'segments': response.segments if hasattr(response, 'segments') else [],
            'language': response.language if hasattr(response, 'language') else 'en',
            'duration': response.duration if hasattr(response, 'duration') else 0
        }
    
    except Exception as e:
        logger.error(f"Error transcribing audio file: {str(e)}")
        raise

def extract_text_from_pdf(file_path):
    """
    Extract text from a PDF file using PyMuPDF
    """
    try:
        # Check if PyMuPDF is available
        if 'fitz' not in globals():
            raise ImportError("PyMuPDF (fitz) is required for PDF processing")
        
        text_content = ""
        
        # Open PDF file
        doc = fitz.open(file_path)
        
        # Extract text from each page
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text_content += page.get_text() + "\n\n"
        
        doc.close()
        
        return text_content
    
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise

def extract_text_from_docx(file_path):
    """
    Extract text from a DOCX file using python-docx
    """
    try:
        # Check if python-docx is available
        if 'docx' not in globals():
            raise ImportError("python-docx is required for DOCX processing")
        
        text_content = ""
        
        # Open DOCX file
        doc = docx.Document(file_path)
        
        # Extract text from paragraphs
        for para in doc.paragraphs:
            text_content += para.text + "\n"
        
        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text_content += cell.text + "\t"
                text_content += "\n"
            text_content += "\n"
        
        return text_content
    
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {str(e)}")
        raise
```

**3. File: `backend/report_generator/services/ai_service.py`**
```python
import os
import logging
import openai
import numpy as np
from django.conf import settings
from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

def create_embeddings(text):
    """
    Split text into chunks and create embeddings for RAG
    """
    try:
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100,
            length_function=len,
        )
        chunks = text_splitter.split_text(text)
        
        # Format chunks with metadata
        formatted_chunks = [{
            'text': chunk,
            'index': i
        } for i, chunk in enumerate(chunks)]
        
        # Create embeddings for each chunk
        embeddings = []
        for chunk in chunks:
            response = client.embeddings.create(
                input=chunk,
                model="text-embedding-ada-002"  # Use the appropriate embedding model
            )
            embeddings.append(response.data[0].embedding)
        
        return formatted_chunks, embeddings
    
    except Exception as e:
        logger.error(f"Error creating embeddings: {str(e)}")
        raise

def generate_field_content(field_name, field_type, field_description, vector_store):
    """
    Generate content for a report field using RAG
    """
    try:
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Get chunks and embeddings from vector store
        chunks = vector_store.chunks
        embeddings = vector_store.embeddings
        
        # Create prompt for field generation
        prompt = f"""Generate content for the following NDIS report field:

Field Name: {field_name}
Field Type: {field_type}
Description: {field_description}

Based on the provided context, generate appropriate content for this field that would be suitable for an NDIS report.

If the field type is 'list', format the response as a bullet-point list.
If the field type is 'table', format the response as a markdown table.
If the field type is 'checkbox', provide a yes/no response with brief justification.
If the field type is 'rating', provide a rating on a scale of 1-5 with justification.

Context:
"""
        
        # Add relevant chunks to context
        context_chunks = [chunk['text'] for chunk in chunks]
        prompt += "\n\n".join(context_chunks[:5])  # Limit to top 5 chunks to fit context window
        
        # Generate content using RAG model
        response = client.chat.completions.create(
            model=settings.RAG_MODEL,
            messages=[
                {"role": "system", "content": "You are an AI assistant that generates high-quality, professional content for NDIS reports based on provided context. Your responses should be detailed, relevant, and formatted according to the field type."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        return response.choices[0].message.content
    
    except Exception as e:
        logger.error(f"Error generating field content: {str(e)}")
        raise

def refine_content(original_content, instructions):
    """
    Refine content based on user instructions
    """
    try:
        # Initialize OpenAI client
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Create prompt for refinement
        prompt = f"""Original Content:
{original_content}

Instructions for Refinement:
{instructions}

Please refine the original content according to these instructions while maintaining professional language suitable for an NDIS report."""
        
        # Generate refined content
        response = client.chat.completions.create(
            model=settings.REFINING_MODEL,
            messages=[
                {"role": "system", "content": "You are an AI assistant that refines NDIS report content based on specific instructions. Your refinements should maintain a professional tone while addressing the requested changes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1500
        )
        
        return response.choices[0].message.content
    
    except Exception as e:
        logger.error(f"Error refining content: {str(e)}")
        raise
```

## Frontend Implementation

### Step 3: Frontend Core Components

Implement the core frontend components for the Report Generator. The design follows a modular structure with a focus on reusability and maintainability.

#### 3.1. Project Structure

Organize the frontend project structure as follows:

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── audio/
│   │   │   ├── EnhancedAudioRecorder.tsx        # Audio recording with resilient features
│   │   │   ├── LiveTranscription.tsx             # Real-time transcription display
│   │   │   ├── WaveformVisualizer.tsx            # Audio visualization component
│   │   │   └── transcription-utils.ts            # Helper functions for transcription
│   │   ├── documents/
│   │   │   ├── DocumentUploader.tsx              # Document upload component
│   │   │   ├── FilePreview.tsx                   # File preview component
│   │   │   └── file-utils.ts                     # File handling utilities
│   │   ├── reports/
│   │   │   ├── ReportBuilder.tsx                 # Main report building interface
│   │   │   ├── ReportField.tsx                   # Individual field component
│   │   │   ├── ReportPreview.tsx                 # Preview generated report
│   │   │   └── ReportExport.tsx                  # Export options interface
│   │   ├── session/
│   │   │   ├── SessionManager.tsx                # Session management interface
│   │   │   └── SessionContext.tsx                # Session context provider
│   │   └── ui/                                   # Shadcn UI components
│   ├── hooks/
│   │   ├── useEnhancedAudioRecorder.ts           # Enhanced recording hook
│   │   ├── useSession.ts                         # Session management hook
│   │   ├── useReport.ts                          # Report management hook
│   │   └── useUpload.ts                          # File upload hook
│   ├── lib/
│   │   ├── socket.ts                             # WebSocket connection management
│   │   ├── utils.ts                              # Utility functions
│   │   └── utils/
│   │       ├── recording-capability-detector.ts  # Audio capability detection
│   │       └── error-telemetry.ts                # Error tracking
│   ├── pages/
│   │   ├── api/                                  # API routes
│   │   ├── index.tsx                             # Landing page
│   │   ├── reports/                              # Report pages
│   │   ├── sessions/                             # Session management pages
│   │   └── settings.tsx                          # User settings
│   ├── services/
│   │   ├── api/
│   │   │   ├── sessionService.ts                 # Session API service
│   │   │   ├── reportService.ts                  # Report API service
│   │   │   ├── fileService.ts                    # File API service
│   │   │   ├── fallbackTranscriptionService.ts   # Transcription fallback service
│   │   │   └── optimizedTranscriptionService.ts  # Optimized transcription service
│   │   └── store/
│   │       └── report-store.ts                   # Report data store
│   ├── styles/
│   │   ├── globals.css                           # Global styles
│   │   └── components.css                        # Component specific styles
│   ├── types/
│   │   └── index.ts                              # TypeScript type definitions
│   ├── _app.tsx                                  # Next.js app component
│   └── _document.tsx                             # Next.js document component
├── .env.local                                    # Environment variables
├── next.config.js                                # Next.js configuration
├── package.json                                  # Project dependencies
├── tailwind.config.js                            # Tailwind CSS configuration
└── tsconfig.json                                 # TypeScript configuration
```

#### 3.2. Enhanced Audio Recorder Integration

Leverage the enhanced audio recorder component for the report generator:

**1. File: `frontend/src/pages/reports/new.tsx`**
```tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedAudioRecorder } from '@/components/audio/EnhancedAudioRecorder';
import { DocumentUploader } from '@/components/documents/DocumentUploader';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/components/ui/use-toast';
import { createSession } from '@/services/api/sessionService';

export default function NewReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [inputMethod, setInputMethod] = useState('audio');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Create a new session when the component loads
  useEffect(() => {
    const initializeSession = async () => {
      setIsCreating(true);
      try {
        // Create a new session
        const session = await createSession({
          title: title || 'New Report',
          description: description || 'Created on ' + new Date().toLocaleString(),
        });
        
        setSessionId(session.id);
        setTitle(session.title);
        setDescription(session.description);
        
        toast({
          title: 'Session created',
          description: 'You can now add content to your report',
        });
      } catch (error) {
        console.error('Error creating session:', error);
        toast({
          title: 'Error',
          description: 'Failed to create a new session',
          variant: 'destructive',
        });
      } finally {
        setIsCreating(false);
      }
    };
    
    initializeSession();
  }, []);
  
  // Handle audio recording completion
  const handleRecordingComplete = async (blob: Blob, duration: number, transcription?: string) => {
    if (!sessionId) return;
    
    try {
      // The audio file will be automatically saved on the backend
      // via the WebSocket in EnhancedAudioRecorder component
      
      // Navigate to the report builder
      router.push(`/reports/${sessionId}/edit`);
    } catch (error) {
      console.error('Error processing recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to save recording',
        variant: 'destructive',
      });
    }
  };
  
  // Handle file upload completion
  const handleFileUploadComplete = async (files: File[]) => {
    if (!sessionId || files.length === 0) return;
    
    // Navigate to the report builder
    router.push(`/reports/${sessionId}/edit`);
  };
  
  // Handle title change and update session
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">New Report</h1>
      
      <Card className="p-6 mb-8">
        <div className="mb-6">
          <Label htmlFor="title">Report Title</Label>
          <Input
            id="title"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter report title"
            className="mt-1"
          />
        </div>
        
        <div className="mb-6">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter report description"
            className="mt-1"
          />
        </div>
      </Card>
      
      <Tabs defaultValue="audio" onValueChange={setInputMethod}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="audio">Record Audio</TabsTrigger>
          <TabsTrigger value="document">Upload Document</TabsTrigger>
        </TabsList>
        
        <TabsContent value="audio" className="mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Record Audio for Transcription</h2>
            
            {sessionId ? (
              <EnhancedAudioRecorder
                onRecordingComplete={handleRecordingComplete}
                initialTitle={title}
                onTitleChange={(newTitle) => setTitle(newTitle)}
                showTranscription={true}
                showSettings={true}
              />
            ) : (
              <div className="flex justify-center items-center p-12">
                <p>Creating session...</p>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="document" className="mt-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
            
            {sessionId ? (
              <DocumentUploader 
                sessionId={sessionId}
                onUploadComplete={handleFileUploadComplete}
              />
            ) : (
              <div className="flex justify-center items-center p-12">
                <p>Creating session...</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**2. File: `frontend/src/components/documents/DocumentUploader.tsx`**
```tsx
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileIcon, Trash2, Upload, File, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { uploadFile } from '@/services/api/fileService';

interface DocumentUploaderProps {
  sessionId: string;
  onUploadComplete?: (files: File[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
}

export function DocumentUploader({
  sessionId,
  onUploadComplete,
  maxFiles = 5,
  acceptedFileTypes = '.pdf,.docx,.doc,.txt,.mp3,.wav,.webm,.m4a'
}: DocumentUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'idle' | 'uploading' | 'success' | 'error'}>({});
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const newFiles = Array.from(e.target.files);
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `You can only upload up to ${maxFiles} files at once`,
        variant: 'destructive',
      });
      return;
    }
    
    // Add new files to state
    setFiles([...files, ...newFiles]);
    
    // Initialize upload status for new files
    const newUploadStatus = {...uploadStatus};
    const newUploadProgress = {...uploadProgress};
    
    newFiles.forEach(file => {
      const fileId = `${file.name}-${Date.now()}`;
      newUploadStatus[fileId] = 'idle';
      newUploadProgress[fileId] = 0;
    });
    
    setUploadStatus(newUploadStatus);
    setUploadProgress(newUploadProgress);
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Remove a file from the list
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  
  // Upload all files
  const uploadFiles = async () => {
    if (!files.length) return;
    
    const uploadedFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${file.name}-${Date.now()}`;
      
      // Update status to uploading
      setUploadStatus(prev => ({ ...prev, [fileId]: 'uploading' }));
      
      try {
        // Upload file with progress tracking
        await uploadFile(file, sessionId, (progress) => {
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
        });
        
        // Update status to success
        setUploadStatus(prev => ({ ...prev, [fileId]: 'success' }));
        uploadedFiles.push(file);
        
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
        
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
      }
    }
    
    if (uploadedFiles.length > 0 && onUploadComplete) {
      onUploadComplete(uploadedFiles);
    }
  };
  
  // Get appropriate icon for file type
  const getFileIcon = (file: File) => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    } else if (fileName.endsWith('.txt')) {
      return <FileText className="h-5 w-5 text-gray-500" />;
    } else if (fileName.endsWith('.mp3') || fileName.endsWith('.wav') || 
               fileName.endsWith('.webm') || fileName.endsWith('.m4a')) {
      return <FileText className="h-5 w-5 text-purple-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept={acceptedFileTypes}
        className="hidden"
      />
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="h-12 w-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium">Drag and drop your files here</p>
            <p className="text-sm text-gray-500 mt-1">
              Supports PDF, DOCX, TXT and audio files (MP3, WAV, WebM, M4A)
            </p>
          </div>
          <Button onClick={triggerFileInput} variant="outline" className="mt-4">
            Select Files
          </Button>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-medium">Selected Files</h3>
          
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div className="truncate max-w-xs">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {uploadStatus[`${file.name}-${Date.now()}`] === 'uploading' && (
                    <Progress value={uploadProgress[`${file.name}-${Date.now()}`] || 0} className="w-24" />
                  )}
                  
                  {uploadStatus[`${file.name}-${Date.now()}`] === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  
                  {uploadStatus[`${file.name}-${Date.now()}`] === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={uploadStatus[`${file.name}-${Date.now()}`] === 'uploading'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={uploadFiles}>
              Upload All Files
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 3.3. File Service Implementation

Implement the file service to handle uploads and API communication:

**File: `frontend/src/services/api/fileService.ts`**
```typescript
import axios from 'axios';
import { API_BASE_URL } from '@/lib/utils/constants';

/**
 * Upload a file to the server
 * @param file The file to upload
 * @param sessionId The session ID to associate with the file
 * @param onProgress Optional progress callback
 * @returns Promise with the upload result
 */
export const uploadFile = async (
  file: File,
  sessionId: string,
  onProgress?: (progress: number) => void
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('session_id', sessionId);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/files/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Get file details by ID
 * @param fileId The file ID
 * @returns Promise with the file details
 */
export const getFile = async (fileId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/files/${fileId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
};

/**
 * Get all files for a session
 * @param sessionId The session ID
 * @returns Promise with the list of files
 */
export const getSessionFiles = async (sessionId: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/sessions/${sessionId}/files/`);
    return response.data;
  } catch (error) {
    console.error('Error getting session files:', error);
    throw error;
  }
};

/**
 * Get the transcript for an audio file
 * @param fileId The file ID
 * @returns Promise with the transcript data
 */
export const getFileTranscript = async (fileId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/files/${fileId}/transcript/`);
    return response.data;
  } catch (error) {
    console.error('Error getting file transcript:', error);
    throw error;
  }
};
```

### Step 4: Report Builder UI Components

Implement the core user interface components for the report generation process using React and Next.js. These components will leverage the enhanced audio recording feature and integrate with the backend services.

#### 4.1. Report Builder Component

**File: `frontend/src/components/reports/ReportBuilder.tsx`**
```tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ReportField } from './ReportField';
import { ReportPreview } from './ReportPreview';
import { getSession } from '@/services/api/sessionService';
import { getSessionFiles } from '@/services/api/fileService';
import { getReport, generateReport, exportReport } from '@/services/api/reportService';

export function ReportBuilder({ sessionId, reportId }) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('content');
  const [session, setSession] = useState(null);
  const [files, setFiles] = useState([]);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionData = await getSession(sessionId);
        const filesData = await getSessionFiles(sessionId);
        const reportData = reportId ? await getReport(reportId) : null;
        
        setSession(sessionData);
        setFiles(filesData);
        setReport(reportData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load report data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [sessionId, reportId]);
  
  // Generate report content
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await generateReport(report.id);
      toast({
        title: 'Report Generation Started',
        description: 'Report is being generated. This may take a few minutes.',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">{report?.title || session?.title}</h2>
        <p className="text-gray-500 mb-6">{session?.description}</p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="content">Content Sources</TabsTrigger>
            <TabsTrigger value="structure">Report Structure</TabsTrigger>
            <TabsTrigger value="preview">Preview & Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="mt-4">
            <h3 className="text-lg font-medium mb-4">Content Sources</h3>
            
            {files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map(file => (
                  <div key={file.id} className="border rounded-md p-4">
                    <h4 className="font-medium">{file.file_name}</h4>
                    <p className="text-sm text-gray-500">Type: {file.file_type}</p>
                    {file.transcript && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => router.push(`/files/${file.id}/transcript`)}
                      >
                        View Transcript
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No files have been added to this session.</p>
            )}
          </TabsContent>
          
          <TabsContent value="structure" className="mt-4">
            <h3 className="text-lg font-medium mb-4">Report Structure</h3>
            
            {report?.configuration?.fields?.length > 0 ? (
              <div className="space-y-4">
                {report.configuration.fields.map(field => (
                  <ReportField key={field.id} field={field} />
                ))}
              </div>
            ) : (
              <div className="text-center p-6">
                <p className="mb-4">No report structure defined.</p>
                <Button>Add Default Structure</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="preview" className="mt-4">
            <h3 className="text-lg font-medium mb-4">Preview & Export</h3>
            
            {report?.status === 'draft' ? (
              <div className="text-center p-6">
                <p className="mb-4">Generate the report to see a preview.</p>
                <Button 
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Report
                </Button>
              </div>
            ) : (
              <ReportPreview report={report} />
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
```

#### 4.2. Report Field Component 

**File: `frontend/src/components/reports/ReportField.tsx`**
```tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function ReportField({ field, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localField, setLocalField] = useState({ ...field });
  
  const handleSave = () => {
    onUpdate?.(localField);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setLocalField({ ...field });
    setIsEditing(false);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{field.name}</CardTitle>
          <div>
            {isEditing ? (
              <div className="flex space-x-2">
                <Button size="sm" variant="ghost" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="field-name">Field Name</Label>
              <Input
                id="field-name"
                value={localField.name}
                onChange={(e) => setLocalField({ ...localField, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="field-description">Description</Label>
              <Textarea
                id="field-description"
                value={localField.description}
                onChange={(e) => setLocalField({ ...localField, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center text-sm mb-2">
              <span className="font-medium mr-2">Type:</span>
              <span className="capitalize">{field.field_type}</span>
              {field.required && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                  Required
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{field.description}</p>
            {field.content && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500 mb-1">Generated Content:</p>
                <div className="text-sm">{field.content}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 4.3. Report Preview Component

**File: `frontend/src/components/reports/ReportPreview.tsx`**
```tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, FilePdf, FileText, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { exportReport } from '@/services/api/reportService';

export function ReportPreview({ report, onRefine }) {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  
  // Handle report export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportReport(report.id, exportFormat);
      
      toast({
        title: 'Export Started',
        description: `Report export to ${exportFormat.toUpperCase()} has started.`,
      });
      
      // Show download link when available
      if (result?.task_id) {
        // Implementation for checking export status would go here
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting the report.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle content refinement
  const handleRefineContent = (fieldId, content) => {
    onRefine?.(fieldId, content);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{report.title}</h3>
        <div className="flex space-x-2">
          <Tabs value={exportFormat} onValueChange={setExportFormat} className="w-32">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="pdf">
                <FilePdf className="h-4 w-4 mr-1" /> PDF
              </TabsTrigger>
              <TabsTrigger value="docx">
                <FileText className="h-4 w-4 mr-1" /> DOCX
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button onClick={handleExport} disabled={isExporting}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        {report.configuration?.fields?.map(field => {
          // Skip fields without content
          if (!field.content) return null;
          
          return (
            <Card key={field.id} className="overflow-hidden">
              <CardHeader className="pb-2 bg-gray-50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-md">{field.name}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRefineContent(field.id, field.content)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Refine
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="prose max-w-none dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: formatContent(field.content, field.field_type) }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to format content based on field type
function formatContent(content, fieldType) {
  if (!content) return '';
  
  // Convert markdown to HTML (simplified implementation)
  let html = content
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  html = `<p>${html}</p>`;
  
  // Special handling for different field types
  if (fieldType === 'list' && !content.includes('<ul>')) {
    const listItems = content.split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => `<li>${line.replace(/^[\-*]\s+/, '')}</li>`)
      .join('');
    
    if (listItems) {
      html = `<ul>${listItems}</ul>`;
    }
  }
  
  return html;
}
```

#### 4.4. Session Management Service

**File: `frontend/src/services/api/sessionService.ts`**
```typescript
import axios from 'axios';
import { API_BASE_URL } from '@/lib/utils/constants';

/**
 * Create a new session
 * @param data Session data
 * @returns Promise with the created session
 */
export const createSession = async (data: { title: string; description?: string }): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/sessions/`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Get session details by ID
 * @param sessionId Session ID
 * @returns Promise with the session details
 */
export const getSession = async (sessionId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/sessions/${sessionId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};

/**
 * Update a session
 * @param sessionId Session ID
 * @param data Session data to update
 * @returns Promise with the updated session
 */
export const updateSession = async (sessionId: string, data: any): Promise<any> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/api/sessions/${sessionId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

/**
 * Get all sessions for the current user
 * @returns Promise with the list of sessions
 */
export const getSessions = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/sessions/`);
    return response.data;
  } catch (error) {
    console.error('Error getting sessions:', error);
    throw error;
  }
};

/**
 * Process all inputs for a session
 * @param sessionId Session ID
 * @returns Promise with the processing result
 */
export const processSession = async (sessionId: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/sessions/${sessionId}/process/`);
    return response.data;
  } catch (error) {
    console.error('Error processing session:', error);
    throw error;
  }
};
```

#### 4.5. Report Service API

**File: `frontend/src/services/api/reportService.ts`**
```typescript
import axios from 'axios';
import { API_BASE_URL } from '@/lib/utils/constants';

/**
 * Create a new report
 * @param data Report data
 * @returns Promise with the created report
 */
export const createReport = async (data: {
  session_id: string;
  configuration_id: string;
  title: string;
}): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/reports/`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

/**
 * Get report details by ID
 * @param reportId Report ID
 * @returns Promise with the report details
 */
export const getReport = async (reportId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/reports/${reportId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting report:', error);
    throw error;
  }
};

/**
 * Update a report
 * @param reportId Report ID
 * @param data Report data to update
 * @returns Promise with the updated report
 */
export const updateReport = async (reportId: string, data: any): Promise<any> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/api/reports/${reportId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

/**
 * Generate report content
 * @param reportId Report ID
 * @returns Promise with the generation result
 */
export const generateReport = async (reportId: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/reports/${reportId}/generate/`);
    return response.data;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

/**
 * Export report to PDF or DOCX
 * @param reportId Report ID
 * @param format Export format (pdf or docx)
 * @returns Promise with the export result
 */
export const exportReport = async (reportId: string, format: 'pdf' | 'docx' = 'pdf'): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/reports/${reportId}/export/`, {
      format
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};
```

### Step 5: Enhanced Audio Recorder Integration

The enhanced audio recorder component is integrated into the report generation workflow to provide seamless audio recording and transcription capabilities. This integration is particularly important as it leverages the resilient recording features we've developed, ensuring reliable transcription even in challenging network conditions.

#### 5.1. Integration Points

1. **New Report Page**
   - The `NewReportPage` component incorporates the `EnhancedAudioRecorder` for direct audio input
   - When recording is completed, the audio is saved and transcribed via the WebSocket service
   - The transcription is automatically associated with the session

2. **WebSocket Connection**
   - The enhanced recorder establishes a WebSocket connection to the backend
   - Real-time audio chunks are streamed for transcription
   - The connection state is monitored and displayed to the user
   - Fallback mechanisms activate automatically if the primary connection fails

3. **Transcription Processing**
   - Audio is processed by the backend transcription service
   - MongoDB stores the complete transcript text and segments
   - The PostgreSQL database maintains relationships between transcripts and sessions

4. **Report Generation**
   - The transcription content is used as input for the AI-powered report generation
   - Vector embeddings are created for RAG-based content generation
   - The report is structured according to the configured fields and templates

#### 5.2. Enhanced Audio Recorder Features Used

1. **WebSocket Streaming**
   - Real-time audio streaming for immediate transcription feedback
   - Connection state visualization with comprehensive status messages
   - Automatic reconnection attempts with graceful degradation

2. **Fallback Chain**
   - OpenAI Whisper API as a secondary transcription method
   - Web Speech API as a tertiary option in supporting browsers
   - Local processing as a last resort for offline scenarios

3. **Resilience Mechanisms**
   - Network condition detection and adaptation
   - Error telemetry for diagnostics and monitoring
   - Offline recording with deferred transcription

4. **User Experience Enhancements**
   - Waveform visualization for audio feedback
   - Live transcription display
   - Clear status indicators
   - Comprehensive error handling

### Step 6: Navigation and Routing Implementation

Implement the navigation and routing for the report generator feature, ensuring integration with the existing NDISuite sidebar menu item.

#### 6.1. Navigation Menu Integration

**File: `frontend/src/components/layout/Sidebar.tsx`**
```tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils'; // Using standardized import paths
import {
  FileText,
  Settings,
  Users,
  BarChart,
  Home,
  FileAudio,
  PenTool
} from 'lucide-react';

export function Sidebar() {
  const router = useRouter();
  const currentPath = router.pathname;
  
  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Clients',
      href: '/clients',
      icon: Users,
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileText,
    },
    {
      name: 'Report Generator',
      href: '/reports/generator',
      icon: PenTool,
    },
    {
      name: 'Audio Recordings',
      href: '/recordings',
      icon: FileAudio,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];
  
  return (
    <div className="h-screen w-64 bg-slate-800 text-white p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">NDISuite</h1>
        <p className="text-slate-400 text-sm">Report Writer</p>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = currentPath === item.href || 
                           (item.href !== '/dashboard' && currentPath.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center p-2 rounded-md transition-colors",
                    isActive 
                      ? "bg-slate-700 text-white" 
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="mt-auto pt-4 border-t border-slate-700">
        <div className="flex items-center p-2">
          <div className="w-8 h-8 rounded-full bg-slate-600 mr-2" />
          <div>
            <p className="text-sm font-medium">User Name</p>
            <p className="text-xs text-slate-400">Provider</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 6.2. Report Generator Routes

**File: `frontend/src/pages/reports/generator/index.tsx`**
```tsx
import React from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PenTool, FileAudio, FileText, Plus } from 'lucide-react';
import { getSessions } from '@/services/api/sessionService';

export default function ReportGeneratorPage() {
  const router = useRouter();
  const [sessions, setSessions] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSessions();
  }, []);
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Report Generator</h1>
        <Button onClick={() => router.push('/reports/generator/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-50 border-dashed border-2 border-slate-200 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push('/reports/generator/new')}>
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Create New Report</h3>
              <p className="text-center text-gray-500">
                Start a new report using audio recording or document upload
              </p>
            </CardContent>
          </Card>
          
          {sessions.map((session) => (
            <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/reports/generator/${session.id}`)}>
              <CardHeader>
                <CardTitle>{session.title}</CardTitle>
                <CardDescription>
                  {new Date(session.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span className="capitalize mr-2">{session.status}</span>
                  •
                  <span className="ml-2">{session.input_files?.length || 0} files</span>
                </div>
                <div className="flex space-x-2">
                  {session.input_files?.some(f => f.file_type === 'audio') && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      <FileAudio className="h-3 w-3 mr-1" />
                      Audio
                    </span>
                  )}
                  {session.input_files?.some(f => ['pdf', 'docx', 'txt'].includes(f.file_type)) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      <FileText className="h-3 w-3 mr-1" />
                      Document
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 6.3. Constants and Utils Standardization

**File: `frontend/src/lib/utils/constants.ts`**
```typescript
// API base URL from environment or default
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// WebSocket URL for transcription
export const TRANSCRIPTION_WS_URL = process.env.NEXT_PUBLIC_TRANSCRIPTION_WS_URL || 'ws://localhost:8000/ws/transcription/';

// Feature flags
export const USE_ENHANCED_AUDIO_RECORDER = process.env.NEXT_PUBLIC_USE_ENHANCED_AUDIO_RECORDER === 'true';
export const RESILIENT_TRANSCRIPTION = process.env.NEXT_PUBLIC_RESILIENT_TRANSCRIPTION === 'true';

// Maximum recording duration in seconds (2 hours)
export const MAX_RECORDING_DURATION = 7200;

// Report generator constants
export const REPORT_TYPES = {
  PROGRESS: 'progress',
  ASSESSMENT: 'assessment',
  SERVICE_AGREEMENT: 'service_agreement',
  GENERAL: 'general'
};

// Export formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  DOCX: 'docx'
};
```

**File: `frontend/src/lib/utils/index.ts`**
```typescript
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if the browser is offline
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    return fallback;
  }
}
```

#### 6.4. Mock Implementations for Development

To ensure we can develop without requiring actual API keys and services, we'll implement fallback mock services following the pattern used in the enhanced audio recorder:

**File: `frontend/src/services/api/mockReportService.ts`**
```typescript
// A mock implementation to allow for development without backend services
import { v4 as uuidv4 } from 'uuid';

// In-memory store for mock data
const mockStore = {
  reports: [],
  configurations: [],
  fields: []
};

/**
 * Create a mock report
 */
export const createReport = async (data) => {
  const report = {
    id: uuidv4(),
    ...data,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  mockStore.reports.push(report);
  return report;
};

/**
 * Get a mock report by ID
 */
export const getReport = async (reportId) => {
  const report = mockStore.reports.find(r => r.id === reportId);
  if (!report) {
    throw new Error('Report not found');
  }
  return report;
};

/**
 * Generate a mock report
 */
export const generateReport = async (reportId) => {
  const report = mockStore.reports.find(r => r.id === reportId);
  if (!report) {
    throw new Error('Report not found');
  }
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  report.status = 'refined';
  return { status: 'generating', message: 'Report generation has been queued' };
};

/**
 * Export a mock report
 */
export const exportReport = async (reportId, format) => {
  const report = mockStore.reports.find(r => r.id === reportId);
  if (!report) {
    throw new Error('Report not found');
  }
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  report.status = 'exported';
  return { 
    status: 'exporting', 
    message: `Report export to ${format.toUpperCase()} has been queued`,
    task_id: uuidv4()
  };
};

// Export the real or mock service based on environment
const isTestMode = process.env.NEXT_PUBLIC_USE_MOCK_SERVICES === 'true';

if (isTestMode) {
  console.log('Using mock report service');
  exports.createReport = createReport;
  exports.getReport = getReport;
  exports.generateReport = generateReport;
  exports.exportReport = exportReport;
} else {
  // Re-export the real service
  const realService = require('./reportService');
  Object.keys(realService).forEach(key => {
    exports[key] = realService[key];
  });
}
```

This approach ensures that:

1. We follow the standardized import path structure (`@/lib/utils` instead of `@/utilities/utils`)
2. API keys are secure using environment variables instead of hardcoding
3. Fallback mock implementations are available for development without requiring actual services
4. TypeScript types are properly used throughout the codebase
5. The Report Generator menu item is properly integrated in the sidebar

### Step 7: Document Upload Implementation

Implement a robust document upload component that handles various file types and supports the report generation workflow.

#### 7.1. Document Upload Component

**File: `frontend/src/components/upload/DocumentUpload.tsx`**
```tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, FileUp, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { uploadFile } from '@/services/api/fileService';
import { useToast } from '@/components/ui/use-toast';

interface DocumentUploadProps {
  sessionId: string;
  onUploadComplete?: (fileId: string) => void;
  allowedFileTypes?: string[];
  maxSize?: number; // In bytes
}

export function DocumentUpload({
  sessionId,
  onUploadComplete,
  allowedFileTypes = ['.pdf', '.docx', '.txt', '.doc'],
  maxSize = 20 * 1024 * 1024 // 20MB default
}: DocumentUploadProps) {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Add new files to the list
    setFiles(prev => [...prev, ...acceptedFiles]);
    
    // Initialize progress and status for each file
    acceptedFiles.forEach(file => {
      const fileId = generateFileId(file);
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      setUploadStatus(prev => ({ ...prev, [fileId]: 'idle' }));
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {}),
    maxSize,
    multiple: true
  });

  const handleUpload = async (file: File) => {
    const fileId = generateFileId(file);
    
    try {
      setUploadStatus(prev => ({ ...prev, [fileId]: 'uploading' }));
      
      const result = await uploadFile(file, sessionId, (progress) => {
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      });
      
      setUploadStatus(prev => ({ ...prev, [fileId]: 'success' }));
      
      toast({
        title: 'Upload Complete',
        description: `${file.name} has been uploaded successfully.`,
      });
      
      onUploadComplete?.(result.id);
    } catch (error) {
      console.error('Error uploading file:', error);
      
      setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
      
      toast({
        title: 'Upload Failed',
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const removeFile = (file: File) => {
    setFiles(prev => prev.filter(f => generateFileId(f) !== generateFileId(file)));
  };

  // Helper function to generate a unique ID for each file
  function generateFileId(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <FileUp className="h-10 w-10 text-gray-400" />
          <p className="text-lg font-medium">
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-sm text-gray-500">
            or <span className="text-primary font-medium">browse</span> to upload
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Supported formats: {allowedFileTypes.join(', ')} (max size: {formatFileSize(maxSize)})
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3 mt-4">
          <h3 className="text-sm font-medium">Files ({files.length})</h3>
          <ul className="space-y-2">
            {files.map((file) => {
              const fileId = generateFileId(file);
              const status = uploadStatus[fileId] || 'idle';
              const progress = uploadProgress[fileId] || 0;
              
              return (
                <li 
                  key={fileId} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {status === 'idle' && (
                      <Button variant="outline" size="sm" onClick={() => handleUpload(file)}>
                        Upload
                      </Button>
                    )}
                    
                    {status === 'uploading' && (
                      <div className="w-24">
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                    
                    {status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    
                    {status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeFile(file)}
                      disabled={status === 'uploading'}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
```

#### 7.2. File Service Implementation

**File: `frontend/src/services/api/fileService.ts`**
```typescript
import axios from 'axios';
import { API_BASE_URL } from '@/lib/utils/constants';

/**
 * Upload a file to the server
 * @param file File to upload
 * @param sessionId Session ID to associate the file with
 * @param onProgress Progress callback
 * @returns Promise with the uploaded file metadata
 */
export const uploadFile = async (
  file: File,
  sessionId: string,
  onProgress?: (progress: number) => void
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    
    const response = await axios.post(`${API_BASE_URL}/api/files/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(progress);
        }
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Get file metadata by ID
 * @param fileId File ID
 * @returns Promise with the file metadata
 */
export const getFile = async (fileId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/files/${fileId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
};

/**
 * Delete a file
 * @param fileId File ID
 * @returns Promise with the deletion result
 */
export const deleteFile = async (fileId: string): Promise<any> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/files/${fileId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get files for a session
 * @param sessionId Session ID
 * @returns Promise with the list of files
 */
export const getFilesForSession = async (sessionId: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/files/session/${sessionId}/`);
    return response.data;
  } catch (error) {
    console.error('Error getting files for session:', error);
    throw error;
  }
};
```

### Step 8: AI-Powered Content Generation

Implement the AI-powered content generation feature that uses transcriptions and uploaded documents to generate report content.

#### 8.1. Content Generation Service

**File: `frontend/src/services/api/contentGenerationService.ts`**
```typescript
import axios from 'axios';
import { API_BASE_URL } from '@/lib/utils/constants';

interface ContentGenerationParams {
  reportId: string;
  fieldId: string;
  prompt?: string;
  includeSources?: boolean;
  tone?: 'professional' | 'simple' | 'detailed';
  maxLength?: number;
}

/**
 * Generate content for a report field
 * @param params Content generation parameters
 * @returns Promise with the generated content
 */
export const generateContent = async (params: ContentGenerationParams): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/reports/generate-content/`, params);
    return response.data;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
};

/**
 * Refine existing content for a report field
 * @param params Content refinement parameters with existing content
 * @returns Promise with the refined content
 */
export const refineContent = async (params: ContentGenerationParams & { existingContent: string }): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/reports/refine-content/`, params);
    return response.data;
  } catch (error) {
    console.error('Error refining content:', error);
    throw error;
  }
};

/**
 * Extract key insights from a session's transcriptions and documents
 * @param sessionId Session ID
 * @returns Promise with the extracted insights
 */
export const extractInsights = async (sessionId: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/sessions/${sessionId}/extract-insights/`);
    return response.data;
  } catch (error) {
    console.error('Error extracting insights:', error);
    throw error;
  }
};
```

#### 8.2. Content Refinement Component

**File: `frontend/src/components/reports/ContentRefiner.tsx`**
```tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { refineContent } from '@/services/api/contentGenerationService';
import { Loader2, RefreshCw, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ContentRefinerProps {
  reportId: string;
  fieldId: string;
  fieldName: string;
  existingContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function ContentRefiner({
  reportId,
  fieldId,
  fieldName,
  existingContent,
  onSave,
  onCancel
}: ContentRefinerProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(existingContent);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementOptions, setRefinementOptions] = useState({
    tone: 'professional',
    prompt: '',
    action: 'improve'
  });

  useEffect(() => {
    setContent(existingContent);
  }, [existingContent]);

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      const result = await refineContent({
        reportId,
        fieldId,
        existingContent: content,
        prompt: refinementOptions.prompt,
        tone: refinementOptions.tone as 'professional' | 'simple' | 'detailed',
      });
      
      if (result?.content) {
        setContent(result.content);
        toast({
          title: 'Content Refined',
          description: 'The content has been successfully refined.',
        });
      }
    } catch (error) {
      console.error('Error refining content:', error);
      toast({
        title: 'Refinement Failed',
        description: 'There was an error refining the content.',
        variant: 'destructive',
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleSave = () => {
    onSave(content);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">
          Refine {fieldName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] font-mono"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="refinement-action">Refinement Type</Label>
            <RadioGroup 
              id="refinement-action"
              value={refinementOptions.action}
              onValueChange={(value) => setRefinementOptions(prev => ({ ...prev, action: value }))}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="improve" id="improve" />
                <Label htmlFor="improve">Improve Writing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="simplify" id="simplify" />
                <Label htmlFor="simplify">Simplify</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expand" id="expand" />
                <Label htmlFor="expand">Expand</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shorten" id="shorten" />
                <Label htmlFor="shorten">Shorten</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select 
              value={refinementOptions.tone} 
              onValueChange={(value) => setRefinementOptions(prev => ({ ...prev, tone: value }))}
            >
              <SelectTrigger id="tone">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="mt-4">
              <Label htmlFor="prompt">Custom Instruction (Optional)</Label>
              <Input
                id="prompt"
                placeholder="E.g., Add more details about sensory needs"
                value={refinementOptions.prompt}
                onChange={(e) => setRefinementOptions(prev => ({ ...prev, prompt: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefine} 
            disabled={isRefining}
          >
            {isRefining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refining...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refine Content
              </>
            )}
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
```

#### 8.3. AI Content Generation Module

The AI content generation module is built using a combination of state-of-the-art language models and retrieval-augmented generation (RAG) techniques. The implementation leverages LangChain for AI orchestration and integrates multiple data sources including:

1. **Transcriptions from audio recordings**
2. **Text extracted from uploaded documents**
3. **User-provided context and prompts**
4. **NDIS-specific guidelines and templates**

The generation process follows these stages:

1. **Data Collection and Processing**
   - Audio recordings are transcribed through the enhanced audio recorder
   - Documents are processed to extract text content
   - All content is broken into chunks and embedded using vector embeddings

2. **Semantic Search and Retrieval**
   - When generating content for a field, relevant information is retrieved from the vector store
   - The system ranks and selects the most pertinent information based on semantic similarity

3. **Content Generation**
   - The retrieved information is used to craft a prompt for the language model
   - Field-specific templates and guidelines are incorporated
   - The language model generates the content with appropriate structure and formatting

4. **Refinement**
   - Generated content can be refined with specific instructions
   - The system maintains context across refinements to ensure coherence
   - User feedback is incorporated to improve future generations

This approach ensures that the generated content is:

- Relevant to the specific report field
- Based on actual session data and user inputs
- Formatted according to NDIS requirements
- Customizable to different tones and styles
- Professionally written with appropriate terminology
