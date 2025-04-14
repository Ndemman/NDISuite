import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from .models import Session, InputFile, OutputConfiguration, OutputField

def list_sessions(request):
    """API endpoint to list all sessions"""
    sessions = Session.objects.all().order_by('-created_at')
    data = [{
        'id': str(session.id),
        'name': session.name or 'Unnamed Session',
        'status': session.status,
        'created_at': session.created_at.isoformat(),
        'updated_at': session.updated_at.isoformat(),
        'completed_at': session.completed_at.isoformat() if session.completed_at else None,
        'file_count': session.input_files.count(),
    } for session in sessions]
    
    return JsonResponse({'sessions': data})

def get_session(request, session_id):
    """API endpoint to get session details"""
    session = get_object_or_404(Session, id=session_id)
    
    # Get input files
    files = [{
        'id': str(file.id),
        'file_name': file.file_name,
        'file_type': file.file_type,
        'uploaded_at': file.uploaded_at.isoformat(),
        'processed': file.processed,
    } for file in session.input_files.all()]
    
    # Get output configurations
    configs = []
    for config in session.output_configurations.all():
        fields = [{
            'id': str(field.id),
            'name': field.name,
            'prompt': field.prompt,
            'order': field.order,
            'has_content': bool(field.generated_content),
            'visible': field.visible,
        } for field in config.fields.all().order_by('order')]
        
        configs.append({
            'id': str(config.id),
            'fields': fields,
            'created_at': config.created_at.isoformat(),
        })
    
    data = {
        'id': str(session.id),
        'name': session.name or 'Unnamed Session',
        'status': session.status,
        'created_at': session.created_at.isoformat(),
        'updated_at': session.updated_at.isoformat(),
        'completed_at': session.completed_at.isoformat() if session.completed_at else None,
        'files': files,
        'configurations': configs,
    }
    
    return JsonResponse(data)

@csrf_exempt
def create_session(request):
    """API endpoint to create a new session"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        name = data.get('name', '')
        
        session = Session.objects.create(name=name)
        
        return JsonResponse({
            'id': str(session.id),
            'name': session.name,
            'status': session.status,
            'created_at': session.created_at.isoformat(),
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def update_session(request, session_id):
    """API endpoint to update a session"""
    if request.method != 'PUT' and request.method != 'PATCH':
        return JsonResponse({'error': 'Only PUT/PATCH methods allowed'}, status=405)
    
    try:
        session = get_object_or_404(Session, id=session_id)
        data = json.loads(request.body)
        
        # Update fields
        if 'name' in data:
            session.name = data['name']
        
        if 'status' in data:
            if data['status'] not in [choice[0] for choice in Session.SESSION_STATUS_CHOICES]:
                return JsonResponse({'error': f"Invalid status. Must be one of: {[choice[0] for choice in Session.SESSION_STATUS_CHOICES]}"}, status=400)
            session.status = data['status']
            
            # Set completed_at if status is COMPLETED
            if data['status'] == 'COMPLETED' and not session.completed_at:
                session.completed_at = timezone.now()
        
        session.save()
        
        return JsonResponse({
            'id': str(session.id),
            'name': session.name,
            'status': session.status,
            'updated_at': session.updated_at.isoformat(),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def create_output_field(request, session_id):
    """API endpoint to create an output field for a session"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        session = get_object_or_404(Session, id=session_id)
        data = json.loads(request.body)
        
        # Get or create configuration
        config, created = OutputConfiguration.objects.get_or_create(session=session)
        
        # Check if max fields reached
        existing_fields = config.fields.count()
        if existing_fields >= 7:  # Maximum 7 fields
            return JsonResponse({'error': 'Maximum number of fields (7) reached'}, status=400)
        
        # Create field
        name = data.get('name', f'Field {existing_fields + 1}')
        prompt = data.get('prompt', '')
        order = data.get('order', existing_fields)
        
        field = OutputField.objects.create(
            configuration=config,
            name=name,
            prompt=prompt,
            order=order
        )
        
        return JsonResponse({
            'id': str(field.id),
            'name': field.name,
            'prompt': field.prompt,
            'order': field.order,
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
