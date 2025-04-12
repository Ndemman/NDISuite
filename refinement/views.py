import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from .models import RefinementSession, HighlightedSection, RefiningInstruction, RefinedContent
from .services import RefinementService
from session_manager.models import OutputField

@csrf_exempt
def start_refinement_session(request, field_id):
    """API endpoint to start a refinement session for an output field"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        output_field = get_object_or_404(OutputField, id=field_id)
        
        # Start refinement session
        session = RefinementService.start_refinement_session(output_field)
        
        return JsonResponse({
            'id': str(session.id),
            'output_field_id': str(session.output_field.id),
            'output_field_name': session.output_field.name,
            'status': session.status,
            'created_at': session.created_at.isoformat()
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_refinement_session(request, session_id):
    """API endpoint to get refinement session details"""
    session = get_object_or_404(RefinementSession, id=session_id)
    
    # Get highlighted sections
    highlighted_sections = []
    for section in session.highlighted_sections.all():
        # Get instructions for this section
        instructions = []
        for instruction in section.refining_instructions.all().order_by('-created_at'):
            instructions.append({
                'id': str(instruction.id),
                'instruction_text': instruction.instruction_text,
                'status': instruction.status,
                'created_at': instruction.created_at.isoformat(),
                'completed_at': instruction.completed_at.isoformat() if instruction.completed_at else None,
                'has_refined_content': hasattr(instruction, 'refined_content')
            })
        
        highlighted_sections.append({
            'id': str(section.id),
            'selected_text': section.selected_text,
            'start_index': section.start_index,
            'end_index': section.end_index,
            'created_at': section.created_at.isoformat(),
            'instructions': instructions
        })
    
    data = {
        'id': str(session.id),
        'output_field_id': str(session.output_field.id),
        'output_field_name': session.output_field.name,
        'status': session.status,
        'created_at': session.created_at.isoformat(),
        'completed_at': session.completed_at.isoformat() if session.completed_at else None,
        'highlighted_sections': highlighted_sections
    }
    
    return JsonResponse(data)

@csrf_exempt
def highlight_text(request, session_id):
    """API endpoint to highlight text in a refinement session"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        session = get_object_or_404(RefinementSession, id=session_id)
        data = json.loads(request.body)
        
        selected_text = data.get('selected_text')
        start_index = data.get('start_index')
        end_index = data.get('end_index')
        
        if not all([selected_text, start_index is not None, end_index is not None]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        # Create highlighted section
        highlighted_section = RefinementService.create_highlighted_section(
            session,
            selected_text,
            start_index,
            end_index
        )
        
        return JsonResponse({
            'id': str(highlighted_section.id),
            'selected_text': highlighted_section.selected_text,
            'start_index': highlighted_section.start_index,
            'end_index': highlighted_section.end_index,
            'created_at': highlighted_section.created_at.isoformat()
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def submit_refinement_instruction(request, section_id):
    """API endpoint to submit a refinement instruction for a highlighted section"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        highlighted_section = get_object_or_404(HighlightedSection, id=section_id)
        data = json.loads(request.body)
        
        instruction_text = data.get('instruction_text')
        
        if not instruction_text:
            return JsonResponse({'error': 'Missing instruction text'}, status=400)
        
        # Create instruction
        instruction = RefinementService.submit_refinement_instruction(
            highlighted_section,
            instruction_text
        )
        
        return JsonResponse({
            'id': str(instruction.id),
            'instruction_text': instruction.instruction_text,
            'status': instruction.status,
            'created_at': instruction.created_at.isoformat()
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def process_refinement(request, instruction_id):
    """API endpoint to process a refinement instruction"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        instruction = get_object_or_404(RefiningInstruction, id=instruction_id)
        
        # Check instruction status
        if instruction.status not in ['PENDING', 'FAILED']:
            return JsonResponse({'error': f'Instruction cannot be processed. Current status: {instruction.status}'}, status=400)
        
        # Process instruction
        refined_content = RefinementService.process_refinement(instruction_id)
        
        return JsonResponse({
            'id': str(refined_content.id),
            'instruction_id': str(instruction.id),
            'original_text': refined_content.original_text,
            'refined_text': refined_content.refined_text,
            'created_at': refined_content.created_at.isoformat()
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def apply_refinements(request, field_id):
    """API endpoint to apply all completed refinements to an output field"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        output_field = get_object_or_404(OutputField, id=field_id)
        
        # Apply refinements
        content = RefinementService.apply_refinements(field_id)
        
        return JsonResponse({
            'field_id': str(field_id),
            'content': content,
            'status': 'success'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
