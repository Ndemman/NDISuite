import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from .models import RAGGeneration, RAGPromptTemplate, RetrievedContext, VectorStore
from .services import RAGService
from session_manager.models import Session, OutputField
from input_processor.models import Chunk

@csrf_exempt
def create_vector_store(request, session_id):
    """API endpoint to create a vector store for a session"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        session = get_object_or_404(Session, id=session_id)
        
        # Check if files are processed
        unprocessed_files = session.input_files.filter(processed=False).count()
        if unprocessed_files > 0:
            return JsonResponse({'error': f'{unprocessed_files} files are not yet processed'}, status=400)
        
        # Create vector store
        vector_store = RAGService.create_vector_store(session)
        
        if not vector_store:
            return JsonResponse({'error': 'No content available to create vector store'}, status=400)
        
        return JsonResponse({
            'id': str(vector_store.id),
            'session_id': str(vector_store.session.id),
            'chunk_count': vector_store.chunk_count,
            'embedding_model': vector_store.embedding_model,
            'created_at': vector_store.created_at.isoformat()
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_vector_store(request, session_id):
    """API endpoint to get vector store info for a session"""
    try:
        session = get_object_or_404(Session, id=session_id)
        
        try:
            vector_store = session.vector_store
            return JsonResponse({
                'id': str(vector_store.id),
                'session_id': str(vector_store.session.id),
                'chunk_count': vector_store.chunk_count,
                'embedding_model': vector_store.embedding_model,
                'created_at': vector_store.created_at.isoformat(),
                'updated_at': vector_store.updated_at.isoformat()
            })
        except Session.vector_store.RelatedObjectDoesNotExist:
            return JsonResponse({'error': 'Vector store not found for this session'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def generate_content(request, field_id):
    """API endpoint to generate content for an output field using RAG"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        field = get_object_or_404(OutputField, id=field_id)
        
        # Generate content
        content = RAGService.generate_content(field)
        
        # Get generation info
        generation = field.rag_generations.order_by('-created_at').first()
        
        return JsonResponse({
            'field_id': str(field.id),
            'content': content,
            'generation_id': str(generation.id) if generation else None,
            'status': 'success'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def get_generation(request, generation_id):
    """API endpoint to get information about a specific generation"""
    generation = get_object_or_404(RAGGeneration, id=generation_id)
    
    # Get retrieved context chunks
    contexts = []
    for ctx in generation.retrieved_contexts.all().order_by('-relevance_score'):
        contexts.append({
            'id': str(ctx.id),
            'chunk_id': str(ctx.chunk.id),
            'relevance_score': ctx.relevance_score,
            'order': ctx.order,
            'content_preview': ctx.chunk.content[:100] + '...' if len(ctx.chunk.content) > 100 else ctx.chunk.content
        })
    
    data = {
        'id': str(generation.id),
        'output_field_id': str(generation.output_field.id),
        'output_field_name': generation.output_field.name,
        'model': generation.model,
        'status': generation.status,
        'created_at': generation.created_at.isoformat(),
        'completed_at': generation.completed_at.isoformat() if generation.completed_at else None,
        'processing_time_ms': generation.processing_time_ms,
        'retrieved_contexts': contexts,
        'error_message': generation.error_message
    }
    
    return JsonResponse(data)

@csrf_exempt
def generate_all_fields(request, config_id):
    """API endpoint to generate content for all fields in an output configuration"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        from output_manager.services import OutputService
        
        # Generate content for all fields
        results = OutputService.generate_all_fields(config_id)
        
        return JsonResponse({
            'config_id': config_id,
            'results': results
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
