from django.db import models
import uuid
from django.utils import timezone

class Session(models.Model):
    """Model to track NDISuite Report Writer sessions"""
    SESSION_STATUS_CHOICES = [
        ('TO_START', 'To Start'),      # Drafts/incomplete recordings
        ('IN_PROGRESS', 'In Progress'), # Under review or mid-refinement
        ('COMPLETED', 'Completed'),     # Finalized outputs
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=SESSION_STATUS_CHOICES, default='TO_START')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def mark_completed(self):
        """Mark session as completed and set completion timestamp"""
        self.status = 'COMPLETED'
        self.completed_at = timezone.now()
        self.save()
    
    def mark_in_progress(self):
        """Mark session as in progress"""
        self.status = 'IN_PROGRESS'
        self.save()
    
    def __str__(self):
        return f"{self.name or 'Unnamed Session'} ({self.id})"

class InputFile(models.Model):
    """Model to track uploaded files associated with a session"""
    FILE_TYPE_CHOICES = [
        ('AUDIO', 'Audio File'),
        ('DOCUMENT', 'Document'),
        ('TRANSCRIPT', 'Transcript')
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='input_files')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    file_path = models.CharField(max_length=512)  # Path to file in filesystem or storage
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)  # Flag to track processing status
    processing_error = models.TextField(blank=True, null=True)  # Track any processing errors
    
    def __str__(self):
        return f"{self.file_name} ({self.file_type})"

class OutputConfiguration(models.Model):
    """Model to store configuration for report generation"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='output_configurations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Configuration for {self.session}"

class OutputField(models.Model):
    """Model to store individual fields within an output configuration"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    configuration = models.ForeignKey(OutputConfiguration, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=255)
    prompt = models.TextField()
    order = models.IntegerField(default=0)  # For maintaining field order
    generated_content = models.TextField(blank=True)
    visible = models.BooleanField(default=True)  # For toggle visibility
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.name} ({self.configuration.session.id})"

class Refinement(models.Model):
    """Model to track refinements to generated content"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    output_field = models.ForeignKey(OutputField, on_delete=models.CASCADE, related_name='refinements')
    original_content = models.TextField()
    instruction = models.TextField()  # User's instruction for refinement
    refined_content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Refinement for {self.output_field.name}"
