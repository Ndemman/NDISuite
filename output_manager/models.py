from django.db import models
import uuid
from session_manager.models import Session, OutputField, OutputConfiguration

class OutputTemplate(models.Model):
    """Model to store reusable output templates"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class TemplateField(models.Model):
    """Model to store field definitions within templates"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(OutputTemplate, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    default_prompt = models.TextField(blank=True)  # Default prompt for this field
    order = models.IntegerField(default=0)  # For maintaining field order
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.name} in {self.template.name}"

class OutputReport(models.Model):
    """Model to store finalized reports"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(Session, on_delete=models.CASCADE, related_name='final_report')
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_finalized = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Report: {self.title}"
    
    def finalize(self):
        """Mark report as finalized"""
        self.is_finalized = True
        self.save()
        # Also mark the session as completed
        if self.session.status != 'COMPLETED':
            self.session.mark_completed()

class ReportSection(models.Model):
    """Model to store individual sections within a report"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(OutputReport, on_delete=models.CASCADE, related_name='sections')
    output_field = models.OneToOneField(OutputField, on_delete=models.CASCADE, related_name='report_section')
    title = models.CharField(max_length=255)
    content = models.TextField()  # The final content for this section
    order = models.IntegerField(default=0)  # For maintaining section order
    is_visible = models.BooleanField(default=True)  # For toggling section visibility
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.title} in {self.report.title}"
