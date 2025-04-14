from django.db import models
import uuid
from session_manager.models import Session, InputFile

class ProcessingResult(models.Model):
    """Model to store processing results for input files"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    input_file = models.OneToOneField(InputFile, on_delete=models.CASCADE, related_name='processing_result')
    normalized_text = models.TextField(blank=True)  # Normalized text content
    extracted_metadata = models.JSONField(default=dict)  # Any extracted metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Processing result for {self.input_file}"

class Chunk(models.Model):
    """Model to store chunked content from processed files"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    processing_result = models.ForeignKey(ProcessingResult, on_delete=models.CASCADE, related_name='chunks')
    content = models.TextField()  # The actual chunk content
    order = models.IntegerField()  # For maintaining chunk order
    metadata = models.JSONField(default=dict)  # Any chunk-specific metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"Chunk {self.order} for {self.processing_result.input_file}"

class LiveRecording(models.Model):
    """Model to track live microphone recordings"""
    RECORDING_STATUS_CHOICES = [
        ('STARTED', 'Started'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='live_recordings')
    status = models.CharField(max_length=20, choices=RECORDING_STATUS_CHOICES, default='STARTED')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    temp_file_path = models.CharField(max_length=512, blank=True)  # Temporary storage before processing
    transcribed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Recording {self.id} for session {self.session.id}"
        
    def mark_completed(self):
        """Mark recording as completed"""
        from django.utils import timezone
        self.status = 'COMPLETED'
        self.end_time = timezone.now()
        # Calculate duration
        if self.start_time:
            duration = self.end_time - self.start_time
            self.duration_seconds = int(duration.total_seconds())
        self.save()
