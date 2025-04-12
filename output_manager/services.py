import os
import logging
from django.utils import timezone

from .models import OutputTemplate, TemplateField, OutputReport, ReportSection
from session_manager.models import Session, OutputConfiguration, OutputField
from rag_engine.services import RAGService

# Configure logging
logger = logging.getLogger(__name__)

class OutputService:
    """Service for managing output configuration and report generation"""
    
    MAX_FIELDS = 7  # Maximum number of fields allowed per output configuration
    
    @staticmethod
    def create_output_configuration(session, template=None):
        """Create a new output configuration for a session"""
        # Check if configuration already exists
        existing_config = OutputConfiguration.objects.filter(session=session).first()
        if existing_config:
            return existing_config
            
        # Create new configuration
        config = OutputConfiguration.objects.create(session=session)
        
        # If template provided, create fields based on template
        if template:
            for template_field in template.fields.all()[:OutputService.MAX_FIELDS]:
                OutputField.objects.create(
                    configuration=config,
                    name=template_field.name,
                    prompt=template_field.default_prompt,
                    order=template_field.order
                )
                
        logger.info(f"Created output configuration for session {session.id}")
        return config
    
    @staticmethod
    def add_output_field(config, name, prompt, order=None):
        """Add a new field to an output configuration"""
        # Check if max fields reached
        existing_fields = OutputField.objects.filter(configuration=config).count()
        if existing_fields >= OutputService.MAX_FIELDS:
            raise ValueError(f"Maximum number of fields ({OutputService.MAX_FIELDS}) reached")
        
        # Determine order if not provided
        if order is None:
            # Get the highest existing order and add 1
            highest_order = OutputField.objects.filter(configuration=config).order_by('-order').values_list('order', flat=True).first()
            order = (highest_order or -1) + 1
        
        # Create new field
        field = OutputField.objects.create(
            configuration=config,
            name=name,
            prompt=prompt,
            order=order
        )
        
        logger.info(f"Added output field {field.id} to configuration {config.id}")
        return field
    
    @staticmethod
    def generate_field_content(field_id):
        """Generate content for a specific field using RAG"""
        field = OutputField.objects.get(id=field_id)
        
        # Use RAG service to generate content
        content = RAGService.generate_content(field)
        
        logger.info(f"Generated content for field {field_id}")
        return content
    
    @staticmethod
    def generate_all_fields(config_id):
        """Generate content for all fields in a configuration"""
        config = OutputConfiguration.objects.get(id=config_id)
        results = []
        
        for field in config.fields.all():
            try:
                content = OutputService.generate_field_content(field.id)
                results.append({
                    'field_id': field.id,
                    'name': field.name,
                    'success': True,
                    'content': content
                })
            except Exception as e:
                logger.error(f"Error generating content for field {field.id}: {str(e)}")
                results.append({
                    'field_id': field.id,
                    'name': field.name,
                    'success': False,
                    'error': str(e)
                })
        
        return results
    
    @staticmethod
    def create_report(session, title=None):
        """Create a final report from a session's output configuration"""
        # Check if a report already exists
        existing_report = OutputReport.objects.filter(session=session).first()
        if existing_report:
            return existing_report
        
        # Use session name as title if not provided
        if not title:
            title = f"Report for {session.name or 'Unnamed Session'}"
        
        # Create report
        report = OutputReport.objects.create(
            session=session,
            title=title
        )
        
        # Add sections for each output field
        config = OutputConfiguration.objects.filter(session=session).first()
        if config:
            for field in config.fields.all():
                ReportSection.objects.create(
                    report=report,
                    output_field=field,
                    title=field.name,
                    content=field.generated_content,
                    order=field.order,
                    is_visible=field.visible
                )
        
        logger.info(f"Created report {report.id} for session {session.id}")
        return report
    
    @staticmethod
    def finalize_report(report_id):
        """Finalize a report and mark the session as completed"""
        report = OutputReport.objects.get(id=report_id)
        report.finalize()
        
        logger.info(f"Finalized report {report_id}")
        return report
    
    @staticmethod
    def get_report_content(report_id, include_hidden=False):
        """Get the complete content of a report"""
        report = OutputReport.objects.get(id=report_id)
        sections = report.sections.all()
        
        if not include_hidden:
            sections = sections.filter(is_visible=True)
        
        content = {
            'title': report.title,
            'sections': []
        }
        
        for section in sections:
            content['sections'].append({
                'title': section.title,
                'content': section.content,
                'visible': section.is_visible
            })
        
        return content
    
    @staticmethod
    def create_template_from_config(config_id, name, description=""):
        """Create a reusable template from an existing configuration"""
        config = OutputConfiguration.objects.get(id=config_id)
        
        template = OutputTemplate.objects.create(
            name=name,
            description=description
        )
        
        for field in config.fields.all():
            TemplateField.objects.create(
                template=template,
                name=field.name,
                default_prompt=field.prompt,
                order=field.order
            )
        
        logger.info(f"Created template {template.id} from configuration {config_id}")
        return template
