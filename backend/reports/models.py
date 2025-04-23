from django.db import models
import uuid
from django.conf import settings


class Session(models.Model):
    """
    Represents a report generation session
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=[
        ('draft', 'Draft'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ], default='draft')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title


class Template(models.Model):
    """
    Represents a report template
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='templates', null=True, blank=True)
    is_system = models.BooleanField(default=False)
    
    # JSON structure defining the template fields
    structure = models.JSONField(default=dict)
    
    # PDF/DOCX styling information
    export_styles = models.JSONField(default=dict)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class Report(models.Model):
    """
    Represents a generated report
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='reports')
    template = models.ForeignKey(Template, on_delete=models.SET_NULL, null=True, related_name='reports')
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=50, choices=[
        ('draft', 'Draft'),
        ('generated', 'Generated'),
        ('refined', 'Refined'),
        ('finalized', 'Finalized'),
    ], default='draft')
    
    # Report content as structured JSON matching the template structure
    content = models.JSONField(default=dict)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title


class OutputField(models.Model):
    """
    Represents a field in the output configuration
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=255)
    label = models.CharField(max_length=255)
    field_type = models.CharField(max_length=50, choices=[
        ('text', 'Text'),
        ('long_text', 'Long Text'),
        ('date', 'Date'),
        ('number', 'Number'),
        ('select', 'Select'),
        ('multiselect', 'Multi-Select'),
    ])
    
    # Field options for select and multiselect fields
    options = models.JSONField(default=list, blank=True, null=True)
    
    # Field value
    value = models.TextField(blank=True)
    
    # Ordering in the template
    order = models.PositiveIntegerField(default=0)
    
    # Field validation rules
    validation = models.JSONField(default=dict, blank=True, null=True)
    
    # AI generation prompt for this field
    generation_prompt = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.report.title} - {self.name}"


class ReportVersion(models.Model):
    """
    Represents a version of a report
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    content = models.JSONField(default=dict)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True)
    
    class Meta:
        unique_together = ('report', 'version_number')
        ordering = ['-version_number']
    
    def __str__(self):
        return f"{self.report.title} - Version {self.version_number}"


class ExportedReport(models.Model):
    """
    Represents an exported report (PDF, DOCX)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='exports')
    format = models.CharField(max_length=10, choices=[
        ('pdf', 'PDF'),
        ('docx', 'DOCX'),
    ])
    file = models.FileField(upload_to='exports/')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.report.title} - {self.format.upper()}"
