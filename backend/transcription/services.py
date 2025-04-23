import os
import json
import logging
import tempfile
import time
from datetime import datetime
import asyncio
import aiohttp
from pydub import AudioSegment
from django.conf import settings
from pymongo import MongoClient
from openai import AsyncOpenAI
import uuid
from .models import Transcript, TranscriptionSegment

logger = logging.getLogger('ndisuite')

class TranscriptionService:
    """
    Handles audio transcription using OpenAI's Whisper API
    """
    
    def __init__(self, session_id, user_id, websocket=None):
        """
        Initialize the transcription service
        """
        self.session_id = session_id
        self.user_id = user_id
        self.websocket = websocket
        self.is_streaming = False
        self.audio_chunks = []
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.transcript = None
        self.transcript_id = None
        self.mongo_client = MongoClient(settings.MONGODB_URI)
        self.db = self.mongo_client[settings.MONGODB_DB]
        self.collection = self.db['transcripts']
        
    async def start(self, language='en'):
        """
        Start a new transcription session
        """
        from reports.models import Session
        
        try:
            session = await self._get_session()
            
            # Create a new transcript record
            self.transcript = Transcript.objects.create(
                session_id=self.session_id,
                user_id=self.user_id,
                source_type='live_recording',
                language=language,
                status='in_progress'
            )
            
            self.transcript_id = str(self.transcript.id)
            self.is_streaming = True
            
            if self.websocket:
                await self.websocket.send_json({
                    'type': 'transcription_started',
                    'transcript_id': self.transcript_id
                })
            
            return self.transcript
        
        except Exception as e:
            logger.error(f"Error starting transcription: {str(e)}")
            if self.websocket:
                await self.websocket.send_json({
                    'type': 'error',
                    'message': f"Failed to start transcription: {str(e)}"
                })
            return None
    
    async def _get_session(self):
        """
        Get the session object
        """
        from reports.models import Session
        try:
            return await asyncio.to_thread(
                lambda: Session.objects.get(id=self.session_id)
            )
        except Session.DoesNotExist:
            raise ValueError(f"Session {self.session_id} not found")
    
    async def process_audio_chunk(self, chunk_data):
        """
        Process an audio chunk and get transcription
        """
        if not self.is_streaming:
            return
        
        try:
            self.audio_chunks.append(chunk_data)
            
            # Process in batches to avoid too many API calls
            if len(self.audio_chunks) >= 5:
                await self._process_current_chunks()
                
        except Exception as e:
            logger.error(f"Error processing audio chunk: {str(e)}")
            if self.websocket:
                await self.websocket.send_json({
                    'type': 'error',
                    'message': f"Failed to process audio: {str(e)}"
                })
    
    async def _process_current_chunks(self):
        """
        Process accumulated audio chunks
        """
        if not self.audio_chunks:
            return
        
        try:
            # Combine audio chunks
            combined_data = b''.join(self.audio_chunks)
            self.audio_chunks = []
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_file:
                temp_file.write(combined_data)
                temp_file_path = temp_file.name
            
            # Get transcription from OpenAI
            result = await self._transcribe_audio(temp_file_path)
            
            # Clean up temp file
            os.unlink(temp_file_path)
            
            if result:
                # Send result to client
                if self.websocket:
                    await self.websocket.send_json({
                        'type': 'transcription_update',
                        'text': result['text'],
                        'segments': result['segments']
                    })
        
        except Exception as e:
            logger.error(f"Error processing audio chunks: {str(e)}")
            if self.websocket:
                await self.websocket.send_json({
                    'type': 'error',
                    'message': f"Failed to transcribe audio: {str(e)}"
                })
    
    async def _transcribe_audio(self, file_path):
        """
        Transcribe audio file using OpenAI Whisper API
        """
        try:
            with open(file_path, 'rb') as audio_file:
                transcript = await self.client.audio.transcriptions.create(
                    model=settings.TRANSCRIPTION_MODEL,
                    file=audio_file,
                    response_format="verbose_json",
                    language=self.transcript.language if self.transcript else "en"
                )
            
            # Process the transcript segments
            segments = []
            for segment in transcript.segments:
                segments.append({
                    'id': str(uuid.uuid4()),
                    'text': segment.text,
                    'start': segment.start,
                    'end': segment.end,
                    'confidence': segment.confidence
                })
            
            return {
                'text': transcript.text,
                'segments': segments
            }
        
        except Exception as e:
            logger.error(f"Error transcribing audio: {str(e)}")
            return None
    
    async def stop(self):
        """
        Stop transcription and get the final result
        """
        if not self.is_streaming:
            return None
        
        try:
            self.is_streaming = False
            
            # Process any remaining chunks
            if self.audio_chunks:
                await self._process_current_chunks()
            
            # Update transcript status
            if self.transcript:
                await self._finalize_transcript()
            
            if self.websocket:
                await self.websocket.send_json({
                    'type': 'transcription_completed',
                    'transcript_id': self.transcript_id
                })
            
            return self.transcript
        
        except Exception as e:
            logger.error(f"Error stopping transcription: {str(e)}")
            if self.websocket:
                await self.websocket.send_json({
                    'type': 'error',
                    'message': f"Failed to complete transcription: {str(e)}"
                })
            return None
    
    async def _finalize_transcript(self):
        """
        Finalize the transcript
        """
        try:
            # Update the transcript in the database
            self.transcript = await asyncio.to_thread(
                lambda: Transcript.objects.get(id=self.transcript_id)
            )
            
            # Get all segments
            segments = await asyncio.to_thread(
                lambda: list(self.transcript.segments.all().order_by('start_time'))
            )
            
            # Combine all segment text
            full_text = " ".join([segment.text for segment in segments])
            
            # Calculate total duration
            duration = 0
            if segments:
                duration = segments[-1].end_time
            
            # Store full transcript in MongoDB
            mongo_id = self.collection.insert_one({
                'transcript_id': self.transcript_id,
                'text': full_text,
                'segments': [
                    {
                        'id': str(segment.id),
                        'text': segment.text,
                        'start_time': segment.start_time,
                        'end_time': segment.end_time,
                        'confidence': segment.confidence
                    } for segment in segments
                ],
                'created_at': datetime.utcnow()
            }).inserted_id
            
            # Update transcript in PostgreSQL
            self.transcript.status = 'completed'
            self.transcript.duration_seconds = duration
            self.transcript.text = full_text[:1000] + "..." if len(full_text) > 1000 else full_text  # Store preview in PostgreSQL
            self.transcript.mongo_id = str(mongo_id)
            
            await asyncio.to_thread(
                lambda: self.transcript.save()
            )
            
            return self.transcript
        
        except Exception as e:
            logger.error(f"Error finalizing transcript: {str(e)}")
            return None
    
    def cleanup(self):
        """
        Clean up resources
        """
        self.is_streaming = False
        self.audio_chunks = []
        if hasattr(self, 'mongo_client') and self.mongo_client:
            self.mongo_client.close()
