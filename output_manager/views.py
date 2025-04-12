import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import OutputTemplate, TemplateField, OutputReport, ReportSection
from .services import OutputService
from session_manager.models import Session, OutputConfiguration, OutputField

def list_templates(request):
    """API endpoint to list all available output templates"""
    templates = OutputTemplate.objects.filter(is_active=True)
    data = [{
        'id': str(template.id),
        'name': template.name,
        'description': template.description,
        'field_count': template.fields.count(),
        'created_at': template.created_at.isoformat(),
    } for template in templates]
    
    return JsonResponse({'templates': data})

def get_template(request, template_id):
    """API endpoint to get template details"""
    template = get_object_or_404(OutputTemplate, id=template_id)
    
    # Get fields
    fields = [{
        'id': str(field.id),
        'name': field.name,
        'description': field.description,
        'default_prompt': field.default_prompt,
        'order': field.order,
    } for field in template.fields.all().order_by('order')]
    
    data = {
        'id': str(template.id),
        'name': template.name,
        'description': template.description,
        'created_at': template.created_at.isoformat(),
        'updated_at': template.updated_at.isoformat(),
        'fields': fields
    }
    
    return JsonResponse(data)

@csrf_exempt
def create_output_configuration(request, session_id):
    """API endpoint to create an output configuration for a session"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        session = get_object_or_404(Session, id=session_id)
        data = json.loads(request.body)
        
        template_id = data.get('template_id')  # Optional
        
        if template_id:
            template = get_object_or_404(OutputTemplate, id=template_id)
            config = OutputService.create_output_configuration(session, template)
        else:
            config = OutputService.create_output_configuration(session)
        
        # Get fields
        fields = [{
            'id': str(field.id),
            'name': field.name,
            'prompt': field.prompt,
            'order': field.order,
            'has_content': bool(field.generated_content),
            'visible': field.visible,
        } for field in config.fields.all().order_by('order')]
        
        return JsonResponse({
            'id': str(config.id),
            'session_id': str(session.id),
            'created_at': config.created_at.isoformat(),
            'fields': fields
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def add_output_field(request, config_id):
    """API endpoint to add a field to an output configuration"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        config = get_object_or_404(OutputConfiguration, id=config_id)
        data = json.loads(request.body)
        
        name = data.get('name')
        prompt = data.get('prompt')
        order = data.get('order')  # Optional
        
        if not name or not prompt:
            return JsonResponse({'error': 'Name and prompt are required'}, status=400)
        
        # Add field
        field = OutputService.add_output_field(config, name, prompt, order)
        
        return JsonResponse({
            'id': str(field.id),
            'name': field.name,
            'prompt': field.prompt,
            'order': field.order,
            'has_content': bool(field.generated_content),
            'visible': field.visible,
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def create_report(request, session_id):
    """API endpoint to create a report from a session"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        session = get_object_or_404(Session, id=session_id)
        data = json.loads(request.body)
        
        title = data.get('title')  # Optional
        
        # Create report
        report = OutputService.create_report(session, title)
        
        # Get sections
        sections = [{
            'id': str(section.id),
            'title': section.title,
            'output_field_id': str(section.output_field.id),
            'order': section.order,
            'is_visible': section.is_visible,
            'content_preview': section.content[:100] + '...' if len(section.content) > 100 else section.content,
        } for section in report.sections.all().order_by('order')]
        
        return JsonResponse({
            'id': str(report.id),
            'title': report.title,
            'session_id': str(report.session.id),
            'created_at': report.created_at.isoformat(),
            'is_finalized': report.is_finalized,
            'sections': sections
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def finalize_report(request, report_id):
    """API endpoint to finalize a report"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        report = get_object_or_404(OutputReport, id=report_id)
        
        if report.is_finalized:
            return JsonResponse({'error': 'Report is already finalized'}, status=400)
        
        # Finalize report
        report = OutputService.finalize_report(report_id)
        
        return JsonResponse({
            'id': str(report.id),
            'title': report.title,
            'is_finalized': report.is_finalized,
            'updated_at': report.updated_at.isoformat()
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_report(request, report_id):
    """API endpoint to get a report with its content"""
    report = get_object_or_404(OutputReport, id=report_id)
    
    # Get report content
    content = OutputService.get_report_content(report_id)
    
    data = {
        'id': str(report.id),
        'title': report.title,
        'session_id': str(report.session.id),
        'created_at': report.created_at.isoformat(),
        'updated_at': report.updated_at.isoformat(),
        'is_finalized': report.is_finalized,
        'content': content
    }
    
    return JsonResponse(data)

@csrf_exempt
def create_template_from_config(request, config_id):
    """API endpoint to create a template from an existing configuration"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        config = get_object_or_404(OutputConfiguration, id=config_id)
        data = json.loads(request.body)
        
        name = data.get('name')
        description = data.get('description', '')
        
        if not name:
            return JsonResponse({'error': 'Name is required'}, status=400)
        
        # Create template
        template = OutputService.create_template_from_config(config_id, name, description)
        
        # Get fields
        fields = [{
            'id': str(field.id),
            'name': field.name,
            'default_prompt': field.default_prompt,
            'order': field.order,
        } for field in template.fields.all().order_by('order')]
        
        return JsonResponse({
            'id': str(template.id),
            'name': template.name,
            'description': template.description,
            'created_at': template.created_at.isoformat(),
            'fields': fields
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
