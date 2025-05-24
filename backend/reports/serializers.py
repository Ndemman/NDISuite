from rest_framework import serializers
from .models import Session, Template, Report, OutputField, ReportVersion, ExportedReport
from files.serializers import InputFileSerializer
from transcription.serializers import TranscriptSerializer


class TemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for the Template model
    """
    is_system_template = serializers.ReadOnlyField(source='is_system')
    slug = serializers.SerializerMethodField()  # ADD THIS LINE
    
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'description', 'user', 'is_system_template',
            'slug',  # ADD THIS TO FIELDS
            'structure', 'export_styles', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def validate_structure(self, value):
        # Accept list or dict; always return dict
        if isinstance(value, list):
            value = {"fields": value}
        return value
        
    def get_slug(self, obj):  # ADD THIS METHOD
        """
        Extract slug from structure or generate from name
        """
        # First, check if slug exists in structure
        if isinstance(obj.structure, dict) and 'slug' in obj.structure:
            return obj.structure['slug']
        
        # Otherwise, generate slug from name
        from django.utils.text import slugify
        name_to_slug_map = {
            'Progress Report': 'progress',
            'Assessment Report': 'assessment', 
            'Therapy Report': 'therapy',
        }
        
        # Use predefined mapping if available
        if obj.name in name_to_slug_map:
            return name_to_slug_map[obj.name]
        
        # Fallback to slugified name
        return slugify(obj.name)


class OutputFieldSerializer(serializers.ModelSerializer):
    """
    Serializer for the OutputField model
    """
    class Meta:
        model = OutputField
        fields = [
            'id', 'report', 'name', 'label', 'field_type', 'options',
            'value', 'order', 'validation', 'generation_prompt',
            'created_by',         # NEW
        ]
        read_only_fields = ['id', 'created_by']


class ReportVersionSerializer(serializers.ModelSerializer):
    """
    Serializer for the ReportVersion model
    """
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ReportVersion
        fields = [
            'id', 'report', 'version_number', 'content',
            'created_by', 'created_by_name', 'created_at', 'comment'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'version_number']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class ExportedReportSerializer(serializers.ModelSerializer):
    """
    Serializer for the ExportedReport model
    """
    file_url = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ExportedReport
        fields = [
            'id', 'report', 'format', 'file', 'file_url',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'file_url']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class ReportSerializer(serializers.ModelSerializer):
    """
    Serializer for the Report model
    """
    fields = OutputFieldSerializer(many=True, read_only=True)
    versions = ReportVersionSerializer(many=True, read_only=True)
    exports = ExportedReportSerializer(many=True, read_only=True)
    template_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = [
            'id', 'session', 'template', 'template_name', 'title', 'status',
            'content', 'fields', 'versions', 'exports', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
        extra_kwargs = {
            'template': {
                'read_only': False,
                'required': True,
                'allow_null': False,
            },
        }
    
    def get_template_name(self, obj):
        if obj.template:
            return obj.template.name
        return None


# New lightweight serializer for listing sessions without heavy nested data
class SessionSummarySerializer(serializers.ModelSerializer):
    """A lightweight serializer used for the sessions list endpoint.

    It avoids serialising potentially large nested relations (files, reports, transcripts)
    and instead exposes only the counts. This considerably reduces payload size and
    removes the main cause of 500 errors triggered by deep, memory-intensive serialisation
    on huge datasets.
    """
    file_count = serializers.SerializerMethodField()
    transcript_count = serializers.SerializerMethodField()
    report_count = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            'id', 'title', 'description', 'status',
            'file_count', 'transcript_count', 'report_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'file_count', 'transcript_count', 'report_count',
            'created_at', 'updated_at',
        ]

    # Re-use the same helper logic as the full SessionSerializer
    def get_file_count(self, obj):
        return getattr(obj, 'file_count', None) or obj.files.count()

    def get_transcript_count(self, obj):
        return getattr(obj, 'transcript_count', None) or obj.transcripts.count()

    def get_report_count(self, obj):
        return getattr(obj, 'report_count', None) or obj.reports.count()


class SessionSerializer(serializers.ModelSerializer):
    """
    Serializer for the Session model
    """
    files = InputFileSerializer(many=True, read_only=True)
    reports = ReportSerializer(many=True, read_only=True)
    transcripts = TranscriptSerializer(many=True, read_only=True)
    file_count = serializers.SerializerMethodField()
    transcript_count = serializers.SerializerMethodField()
    report_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Session
        fields = [
            'id', 'user', 'title', 'description', 'status',
            'files', 'file_count', 'transcripts', 'transcript_count',
            'reports', 'report_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'file_count', 'transcript_count', 'report_count', 'created_at', 'updated_at']
    
    def get_file_count(self, obj):
        return obj.files.count()
    
    def get_transcript_count(self, obj):
        return obj.transcripts.count()
    
    def get_report_count(self, obj):
        return obj.reports.count()
