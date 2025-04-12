import json
import os
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from .models import TranscriptionJob, Transcript, TranscriptSegment
from .services import TranscriptionService
from session_manager.models import Session, InputFile

def get_transcript(request, job_id):
    """API endpoint to get a transcript"""
    job = get_object_or_404(TranscriptionJob, id=job_id)
    
    try:
        transcript = Transcript.objects.get(job=job)
        
        # Get segments if available
        segments = []
        for segment in transcript.segments.all().order_by('start_time'):
            segments.append({
                'id': str(segment.id),
                'start_time': segment.start_time,
                'end_time': segment.end_time,
                'text': segment.text,
                'confidence': segment.confidence,
                'speaker': segment.speaker
            })
        
        data = {
            'id': str(transcript.id),
            'job_id': str(job.id),
            'text': transcript.text,
            'language': transcript.language,
            'confidence': transcript.confidence,
            'created_at': transcript.created_at.isoformat(),
            'segments': segments,
            'metadata': transcript.metadata
        }
        
        return JsonResponse(data)
    except Transcript.DoesNotExist:
        return JsonResponse({'error': 'Transcript not found'}, status=404)

def get_transcription_job(request, job_id):
    """API endpoint to get transcription job status"""
    job = get_object_or_404(TranscriptionJob, id=job_id)
    
    data = {
        'id': str(job.id),
        'input_file_id': str(job.input_file.id),
        'input_file_name': job.input_file.file_name,
        'status': job.status,
        'model': job.model,
        'created_at': job.created_at.isoformat(),
        'started_at': job.started_at.isoformat() if job.started_at else None,
        'completed_at': job.completed_at.isoformat() if job.completed_at else None,
        'processing_time_ms': job.processing_time_ms,
        'has_transcript': hasattr(job, 'transcript'),
        'error_message': job.error_message
    }
    
    return JsonResponse(data)

@csrf_exempt
def create_transcription_job(request, file_id):
    """API endpoint to create a transcription job for an audio file"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        input_file = get_object_or_404(InputFile, id=file_id)
        
        # Check if file is an audio file
        if input_file.file_type != 'AUDIO':
            return JsonResponse({'error': 'File is not an audio file'}, status=400)
        
        # Create job
        job = TranscriptionService.create_transcription_job(input_file)
        
        return JsonResponse({
            'id': str(job.id),
            'input_file_id': str(job.input_file.id),
            'status': job.status,
            'model': job.model,
            'created_at': job.created_at.isoformat()
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def process_transcription_job(request, job_id):
    """API endpoint to process a transcription job"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        job = get_object_or_404(TranscriptionJob, id=job_id)
        
        # Check job status
        if job.status not in ['PENDING', 'FAILED']:
            return JsonResponse({'error': f'Job cannot be processed. Current status: {job.status}'}, status=400)
        
        # Process job (this should ideally be done asynchronously in a real application)
        transcript = TranscriptionService.process_job(job_id)
        
        return JsonResponse({
            'id': str(transcript.id),
            'job_id': str(job.id),
            'text': transcript.text[:100] + '...' if len(transcript.text) > 100 else transcript.text,  # Preview
            'created_at': transcript.created_at.isoformat()
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
