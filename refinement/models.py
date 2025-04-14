from django.db import models
import uuid
from session_manager.models import OutputField

class RefinementSession(models.Model):
    """Model to track refinement sessions for output fields"""
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    output_field = models.ForeignKey(OutputField, on_delete=models.CASCADE, related_name='refinement_sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Refinement session for {self.output_field.name}"

class HighlightedSection(models.Model):
    """Model to track text segments highlighted by users for refinement"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    refinement_session = models.ForeignKey(RefinementSession, on_delete=models.CASCADE, related_name='highlighted_sections')
    selected_text = models.TextField()  # Highlighted text segment
    start_index = models.IntegerField()  # Start index in the original content
    end_index = models.IntegerField()  # End index in the original content
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Highlighted section in {self.refinement_session}"

class RefiningInstruction(models.Model):
    """Model to track refinement instructions for highlighted sections"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    highlighted_section = models.ForeignKey(HighlightedSection, on_delete=models.CASCADE, related_name='refining_instructions')
    instruction_text = models.TextField()  # User's instruction for refinement
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    model = models.CharField(max_length=50, default='gpt-3.5-turbo')  # LLM model for refinement
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Refining instruction for {self.highlighted_section}"

class RefinedContent(models.Model):
    """Model to store refined content for highlighted sections"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    refining_instruction = models.OneToOneField(RefiningInstruction, on_delete=models.CASCADE, related_name='refined_content')
    original_text = models.TextField()  # Original text that was refined
    refined_text = models.TextField()  # The refined text
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Refined content for {self.refining_instruction}"
