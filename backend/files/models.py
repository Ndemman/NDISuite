from django.db import models
import uuid
from django.conf import settings
import os


class InputFile(models.Model):
    """
    Represents an input file (audio, document) for a session
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey('reports.Session', on_delete=models.CASCADE, related_name='files')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # File metadata
    file = models.FileField(upload_to='uploads/')
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveBigIntegerField()
    
    # File type
    file_type = models.CharField(max_length=50, choices=[
        ('audio', 'Audio'),
        ('pdf', 'PDF Document'),
        ('docx', 'Word Document'),
        ('txt', 'Plain Text'),
        ('other', 'Other'),
    ])
    
    # MIME type
    mime_type = models.CharField(max_length=100, blank=True)
    
    # Status
    status = models.CharField(max_length=50, choices=[
        ('uploading', 'Uploading'),
        ('uploaded', 'Uploaded'),
        ('processing', 'Processing'),
        ('processed', 'Processed'),
        ('failed', 'Failed'),
    ], default='uploading')
    
    # Processing results
    extracted_text = models.TextField(blank=True)
    
    # MongoDB reference for storing larger text content
    mongo_id = models.CharField(max_length=50, blank=True)
    
    # Processing error
    error = models.TextField(blank=True)
    
    # Reference to transcript if audio file
    transcript = models.OneToOneField('transcription.Transcript', on_delete=models.SET_NULL, null=True, blank=True, related_name='source')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.original_filename
    
    def get_file_extension(self):
        return os.path.splitext(self.original_filename)[1].lower()[1:]
    
    @property
    def is_audio(self):
        return self.file_type == 'audio'
    
    @property
    def is_document(self):
        return self.file_type in ('pdf', 'docx', 'txt')


class ProcessedChunk(models.Model):
    """
    Represents a chunk of processed text from an input file
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    input_file = models.ForeignKey(InputFile, on_delete=models.CASCADE, related_name='chunks')
    
    # Chunk content
    text = models.TextField()
    
    # Chunk metadata
    chunk_index = models.PositiveIntegerField()
    
    # Source location information (page number, paragraph, etc.)
    source_location = models.JSONField(default=dict)
    
    # Vector embedding reference
    embedding_id = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['chunk_index']
    
    def __str__(self):
        return f"Chunk {self.chunk_index} - {self.input_file}"
