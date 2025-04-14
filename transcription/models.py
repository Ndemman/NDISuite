from django.db import models
import uuid
from session_manager.models import Session, InputFile

class TranscriptionJob(models.Model):
    """Model to track audio transcription jobs"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    input_file = models.OneToOneField(InputFile, on_delete=models.CASCADE, related_name='transcription_job')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    model = models.CharField(max_length=50, default='whisper-1')  # OpenAI model name
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    processing_time_ms = models.IntegerField(null=True, blank=True)  # Track performance
    
    def __str__(self):
        return f"Transcription job {self.id} for {self.input_file}"

class Transcript(models.Model):
    """Model to store transcription results"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.OneToOneField(TranscriptionJob, on_delete=models.CASCADE, related_name='transcript')
    text = models.TextField()  # Full transcript text
    confidence = models.FloatField(null=True, blank=True)  # Overall confidence score if available
    language = models.CharField(max_length=10, blank=True)  # Detected language code
    metadata = models.JSONField(default=dict)  # Additional metadata from transcription service
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Transcript for {self.job.input_file}"

class TranscriptSegment(models.Model):
    """Model to store individual segments/timestamps from a transcript"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transcript = models.ForeignKey(Transcript, on_delete=models.CASCADE, related_name='segments')
    start_time = models.FloatField()  # Start time in seconds
    end_time = models.FloatField()  # End time in seconds
    text = models.TextField()  # Segment text
    confidence = models.FloatField(null=True, blank=True)  # Segment-level confidence
    speaker = models.CharField(max_length=50, blank=True)  # For multi-speaker transcription
    
    class Meta:
        ordering = ['start_time']
    
    def __str__(self):
        return f"Segment {self.start_time:.2f}s-{self.end_time:.2f}s"
