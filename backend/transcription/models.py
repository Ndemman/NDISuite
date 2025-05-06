from django.db import models
import uuid
from django.conf import settings


class Transcript(models.Model):
    """
    Represents a transcription of audio content
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey('reports.Session', on_delete=models.CASCADE, related_name='transcripts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Source of the transcript
    source_type = models.CharField(max_length=50, choices=[
        ('live_recording', 'Live Recording'),
        ('uploaded_audio', 'Uploaded Audio'),
    ])
    
    # Reference to file if from uploaded audio
    source_file = models.ForeignKey('files.InputFile', on_delete=models.SET_NULL, null=True, blank=True, related_name='source_transcripts')
    
    # Transcript metadata
    language = models.CharField(max_length=10, default='en')
    duration_seconds = models.FloatField(default=0.0)
    
    # MongoDB reference for storing the full transcript content
    mongo_id = models.CharField(max_length=50, blank=True)
    
    # Status
    status = models.CharField(max_length=50, choices=[
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ], default='in_progress')
    
    # Error message if failed
    error = models.TextField(blank=True)
    
    # Basic transcript text (truncated if needed, full text in MongoDB)
    text = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Transcript {self.id}"


class TranscriptionSegment(models.Model):
    """
    Represents a segment of a transcription with timestamps
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transcript = models.ForeignKey(Transcript, on_delete=models.CASCADE, related_name='segments')
    
    # Segment content
    text = models.TextField()
    
    # Timestamps in seconds
    start_time = models.FloatField()
    end_time = models.FloatField()
    
    # Confidence score
    confidence = models.FloatField(default=1.0)
    
    class Meta:
        ordering = ['start_time']
    
    def __str__(self):
        return f"Segment {self.start_time}-{self.end_time}s"


class AudioRecording(models.Model):
    """
    Represents a live audio recording session
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey('reports.Session', on_delete=models.CASCADE, related_name='recordings')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Recording status
    status = models.CharField(max_length=50, choices=[
        ('recording', 'Recording'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ], default='recording')
    
    # Recording metadata
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.FloatField(default=0.0)
    
    # Audio file if saved
    audio_file = models.FileField(upload_to='recordings/', null=True, blank=True)
    
    # Associated transcript
    transcript = models.OneToOneField(Transcript, on_delete=models.SET_NULL, null=True, blank=True, related_name='recording')
    
    def __str__(self):
        return f"Recording {self.id}"
