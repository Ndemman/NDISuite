import os
import time
import logging
from datetime import datetime
from django.conf import settings
from django.utils import timezone

import openai
from openai import OpenAI
from dotenv import load_dotenv

from .models import TranscriptionJob, Transcript, TranscriptSegment
from session_manager.models import InputFile

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class TranscriptionService:
    """Service for handling audio transcription using OpenAI's Whisper API"""
    
    @staticmethod
    def create_transcription_job(input_file):
        """Create a new transcription job for an audio file"""
        if input_file.file_type != 'AUDIO':
            raise ValueError(f"Input file {input_file.id} is not an audio file")
            
        # Check if a job already exists
        existing_job = TranscriptionJob.objects.filter(input_file=input_file).first()
        if existing_job:
            return existing_job
            
        # Create new job
        job = TranscriptionJob.objects.create(
            input_file=input_file,
            status='PENDING',
            model=os.getenv('TRANSCRIPTION_MODEL', 'whisper-1')
        )
        
        logger.info(f"Created transcription job {job.id} for file {input_file.file_name}")
        return job
    
    @staticmethod
    def process_job(job_id):
        """Process a transcription job using OpenAI's Whisper API"""
        try:
            job = TranscriptionJob.objects.get(id=job_id)
            
            # Update job status
            job.status = 'IN_PROGRESS'
            job.started_at = timezone.now()
            job.save()
            
            # Start timing for performance tracking
            start_time = time.time()
            
            # Get file path
            file_path = job.input_file.file_path
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Audio file not found at {file_path}")
            
            # Call OpenAI API
            with open(file_path, 'rb') as audio_file:
                response = client.audio.transcriptions.create(
                    model=job.model,
                    file=audio_file,
                    response_format="verbose_json"  # Get detailed response with timestamps
                )
            
            # Calculate processing time
            end_time = time.time()
            processing_time_ms = int((end_time - start_time) * 1000)
            
            # Create transcript
            transcript = Transcript.objects.create(
                job=job,
                text=response.text,
                language=getattr(response, 'language', ''),
                metadata={
                    'duration': getattr(response, 'duration', None),
                    'processing_time_ms': processing_time_ms
                }
            )
            
            # Create segments if available
            if hasattr(response, 'segments') and response.segments:
                for i, segment in enumerate(response.segments):
                    TranscriptSegment.objects.create(
                        transcript=transcript,
                        start_time=segment.start,
                        end_time=segment.end,
                        text=segment.text,
                        confidence=getattr(segment, 'confidence', None)
                    )
            
            # Update job status
            job.status = 'COMPLETED'
            job.completed_at = timezone.now()
            job.processing_time_ms = processing_time_ms
            job.save()
            
            # Mark input file as processed
            input_file = job.input_file
            input_file.processed = True
            input_file.save()
            
            logger.info(f"Completed transcription job {job.id}, processing time: {processing_time_ms}ms")
            return transcript
            
        except Exception as e:
            logger.error(f"Error processing transcription job {job_id}: {str(e)}")
            
            # Update job status to failed
            try:
                job.status = 'FAILED'
                job.error_message = str(e)
                job.save()
            except Exception as save_error:
                logger.error(f"Error updating job status: {str(save_error)}")
                
            raise
    
    @staticmethod
    def get_transcript_text(job_id):
        """Get the transcript text for a job"""
        try:
            job = TranscriptionJob.objects.get(id=job_id)
            transcript = Transcript.objects.get(job=job)
            return transcript.text
        except (TranscriptionJob.DoesNotExist, Transcript.DoesNotExist):
            return None
