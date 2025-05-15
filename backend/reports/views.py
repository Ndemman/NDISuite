from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Session, Template, Report, OutputField, ReportVersion, ExportedReport
from .serializers import (SessionSerializer, TemplateSerializer, ReportSerializer,
                         OutputFieldSerializer, ReportVersionSerializer, ExportedReportSerializer)
from .tasks import generate_report_task, export_report_task


class SessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing report generation sessions
    """
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return a lightweight serializer for list action.

        The full `SessionSerializer` includes nested relations that can be
        expensive to hydrate and have previously triggered 500 errors on large
        datasets. For the list action we only need summary information, so we
        switch to `SessionSummarySerializer` created in serializers.py.
        """
        if self.action == 'list':
            from .serializers import SessionSummarySerializer
            return SessionSummarySerializer
        return self.serializer_class
    
    def get_queryset(self):
        return Session.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        # Check authentication is already handled by IsAuthenticated permission class
        # This just ensures the session is associated with the authenticated user
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def reports(self, request, pk=None):
        """
        Get all reports for a session
        """
        session = self.get_object()
        reports = session.reports.all().order_by('-created_at')
        serializer = ReportSerializer(reports, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def files(self, request, pk=None):
        """
        Get all files for a session
        """
        session = self.get_object()
        files = session.files.all().order_by('-created_at')
        
        # Filter by file type if provided
        file_type = request.query_params.get('file_type', None)
        if file_type:
            files = files.filter(file_type=file_type)
        
        from files.serializers import InputFileSerializer
        serializer = InputFileSerializer(files, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def transcripts(self, request, pk=None):
        """
        Get all transcripts for a session
        """
        session = self.get_object()
        transcripts = session.transcripts.all().order_by('-created_at')
        
        from transcription.serializers import TranscriptSerializer
        serializer = TranscriptSerializer(transcripts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Archive a session
        """
        session = self.get_object()
        session.status = 'archived'
        session.save()
        
        # Enqueue vector store cleanup
        from .tasks_cleanup import cleanup_vector_store_task
        cleanup_vector_store_task.delay(str(session.id))
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)


class TemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing report templates
    """
    serializer_class = TemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return templates that are either system templates or owned by the user
        """
        return Template.objects.filter(is_system=True) | Template.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        from django.contrib.auth import get_user_model
        User=get_user_model()
        user=self.request.user if getattr(self.request,'user',None) and not self.request.user.is_anonymous else User.objects.get(id=10)
        serializer.save(user=self.request.user, is_system=False)


class ReportViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing generated reports
    """
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter reports by user and optionally by session
        """
        queryset = Report.objects.filter(session__user=self.request.user)
        
        # Filter by session if provided
        session_id = self.request.query_params.get('session', None)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """
        Generate report content using AI
        """
        report = self.get_object()
        
        # Check if report is in a valid state for generation
        if report.status not in ['draft', 'generated']:
            return Response(
                {"error": f"Report is in {report.status} state and cannot be generated"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status to in-progress
        report.status = 'draft'
        report.save()
        
        # Start generation task
        task = generate_report_task.delay(str(report.id))
        
        return Response({
            "message": "Report generation started",
            "task_id": task.id,
            "report_id": str(report.id)
        })
    
    @action(detail=True, methods=['post'])
    def export(self, request, pk=None):
        """
        Export report to PDF or DOCX
        """
        report = self.get_object()
        
        # Check format
        format_param = request.data.get('format', 'pdf').lower()
        if format_param not in ['pdf', 'docx']:
            return Response(
                {"error": f"Unsupported format: {format_param}. Must be 'pdf' or 'docx'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if report is in a valid state for export
        if report.status not in ['generated', 'refined', 'finalized']:
            return Response(
                {"error": f"Report is in {report.status} state and cannot be exported"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Start export task
        task = export_report_task.delay(str(report.id), format_param)
        
        return Response({
            "message": f"Report export to {format_param.upper()} started",
            "task_id": task.id,
            "report_id": str(report.id),
            "format": format_param
        })
    
    @action(detail=True, methods=['get'])
    def fields(self, request, pk=None):
        """
        Get all fields for a report
        """
        report = self.get_object()
        fields = report.fields.all().order_by('order')
        serializer = OutputFieldSerializer(fields, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """
        Get all versions of a report
        """
        report = self.get_object()
        versions = report.versions.all().order_by('-version_number')
        serializer = ReportVersionSerializer(versions, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        """
        Create a new version of a report
        """
        report = self.get_object()
        
        # Get comment from request data
        comment = request.data.get('comment', '')
        
        # Get the latest version number
        latest_version = report.versions.order_by('-version_number').first()
        version_number = 1
        if latest_version:
            version_number = latest_version.version_number + 1
        
        # Create new version
        version = ReportVersion.objects.create(
            report=report,
            version_number=version_number,
            content=report.content,
            created_by=request.user,
            comment=comment
        )
        
        serializer = ReportVersionSerializer(version, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def restore_version(self, request, pk=None):
        """
        Restore a report to a previous version
        """
        report = self.get_object()
        
        # Get version ID from request data
        version_id = request.data.get('version_id', None)
        if not version_id:
            return Response(
                {"error": "Version ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the version
            version = report.versions.get(id=version_id)
            
            # Update report content
            report.content = version.content
            report.save()
            
            # Create a new version of the current state for tracking
            ReportVersion.objects.create(
                report=report,
                version_number=report.versions.order_by('-version_number').first().version_number + 1,
                content=report.content,
                created_by=request.user,
                comment=f"Restored from version {version.version_number}"
            )
            
            serializer = self.get_serializer(report)
            return Response(serializer.data)
        
        except ReportVersion.DoesNotExist:
            return Response(
                {"error": f"Version with ID {version_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def exports(self, request, pk=None):
        """
        Get all exports for a report
        """
        report = self.get_object()
        exports = report.exports.all().order_by('-created_at')
        serializer = ExportedReportSerializer(exports, many=True, context={'request': request})
        return Response(serializer.data)


class OutputFieldViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing report output fields
    """
    serializer_class = OutputFieldSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return OutputField.objects.filter(report__session__user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def refine(self, request, pk=None):
        """
        Refine the field content using AI
        """
        field = self.get_object()
        
        # Get refinement parameters
        instruction = request.data.get('instruction', '')
        tone = request.data.get('tone', 'professional')
        length = request.data.get('length', 'maintain')
        format_style = request.data.get('format', 'paragraph')
        
        # Validate parameters
        if not instruction:
            return Response(
                {"error": "Refinement instruction is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Start refinement task
        from .tasks import refine_field_content_task
        task = refine_field_content_task.delay(
            str(field.id), 
            instruction=instruction,
            tone=tone,
            length=length,
            format_style=format_style
        )
        
        return Response({
            "message": "Field refinement started",
            "task_id": task.id,
            "field_id": str(field.id)
        })
