import json
import logging
import base64
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .services import TranscriptionService
from .models import TranscriptionSegment, Transcript

User = get_user_model()
logger = logging.getLogger('ndisuite')


class TranscriptionConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time audio transcription
    """
    
    async def connect(self):
        """
        Connect to the WebSocket
        """
        self.user = self.scope['user']
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f'transcription_{self.session_id}'
        
        # Check authentication
        if self.user.is_anonymous:
            await self.close(code=4003)
            return
            
        # Check if session exists and belongs to user
        if not await self.validate_session():
            await self.close(code=4004)
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Initialize transcription service
        self.transcription_service = TranscriptionService(
            session_id=self.session_id,
            user_id=self.user.id,
            websocket=self
        )
        
        self.is_streaming = False
        self.transcript = None
        
        # Accept the connection
        await self.accept()
    
    @database_sync_to_async
    def validate_session(self):
        """
        Validate that the session exists and belongs to the user
        """
        from reports.models import Session
        try:
            session = Session.objects.get(id=self.session_id)
            return session.user_id == self.user.id
        except Session.DoesNotExist:
            return False
    
    async def disconnect(self, close_code):
        """
        Disconnect from the WebSocket
        """
        # Stop transcription if active
        if hasattr(self, 'transcription_service') and self.is_streaming:
            await self.stop_transcription()
        
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        
        # Clean up resources
        if hasattr(self, 'transcription_service'):
            self.transcription_service.cleanup()
    
    async def receive(self, text_data=None, bytes_data=None):
        """
        Receive message from WebSocket
        """
        try:
            if text_data:
                # Handle JSON commands
                data = json.loads(text_data)
                command = data.get('command')
                
                if command == 'start':
                    await self.start_transcription(data.get('language', 'en'))
                elif command == 'stop':
                    await self.stop_transcription()
                elif command == 'pause':
                    await self.pause_transcription()
                elif command == 'resume':
                    await self.resume_transcription()
            
            elif bytes_data and self.is_streaming:
                # Handle binary audio data
                await self.transcription_service.process_audio_chunk(bytes_data)
        
        except Exception as e:
            logger.error(f"Error in WebSocket message handling: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f"Error processing message: {str(e)}"
            }))
    
    async def start_transcription(self, language='en'):
        """
        Start a new transcription session
        """
        if self.is_streaming:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': "Transcription already in progress"
            }))
            return
        
        try:
            # Start transcription service
            self.transcript = await self.transcription_service.start(language)
            
            if self.transcript:
                self.is_streaming = True
                await self.send(text_data=json.dumps({
                    'type': 'transcription_started',
                    'transcript_id': str(self.transcript.id)
                }))
                
                # Broadcast to group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'transcription_event',
                        'event_type': 'started',
                        'transcript_id': str(self.transcript.id)
                    }
                )
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': "Failed to start transcription"
                }))
        
        except Exception as e:
            logger.error(f"Error starting transcription: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f"Failed to start transcription: {str(e)}"
            }))
    
    async def stop_transcription(self):
        """
        Stop the transcription service and finalize the transcript
        """
        if not self.is_streaming:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': "No transcription in progress"
            }))
            return
        
        try:
            self.is_streaming = False
            transcript = await self.transcription_service.stop()
            
            if transcript:
                await self.send(text_data=json.dumps({
                    'type': 'transcription_completed',
                    'transcript_id': str(transcript.id)
                }))
                
                # Broadcast to group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'transcription_event',
                        'event_type': 'completed',
                        'transcript_id': str(transcript.id)
                    }
                )
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': "Failed to complete transcription"
                }))
        
        except Exception as e:
            logger.error(f"Error stopping transcription: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f"Failed to stop transcription: {str(e)}"
            }))
    
    async def pause_transcription(self):
        """
        Temporarily pause the transcription
        """
        if not self.is_streaming:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': "No transcription in progress"
            }))
            return
        
        self.is_streaming = False
        await self.send(text_data=json.dumps({
            'type': 'transcription_paused'
        }))
        
        # Broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'transcription_event',
                'event_type': 'paused'
            }
        )
    
    async def resume_transcription(self):
        """
        Resume a paused transcription
        """
        if self.is_streaming:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': "Transcription already in progress"
            }))
            return
        
        if not hasattr(self, 'transcription_service') or not self.transcript:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': "No transcription to resume"
            }))
            return
        
        self.is_streaming = True
        await self.send(text_data=json.dumps({
            'type': 'transcription_resumed'
        }))
        
        # Broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'transcription_event',
                'event_type': 'resumed'
            }
        )
    
    async def send_json(self, content):
        """
        Convenience method to send JSON to WebSocket
        """
        await self.send(text_data=json.dumps(content))
    
    async def transcription_event(self, event):
        """
        Handle transcription events from channel layer
        """
        # Only forward events to other clients in the group
        event_type = event.get('event_type')
        if event_type:
            message = {
                'type': f'transcription_{event_type}'
            }
            
            # Include additional data if available
            for key, value in event.items():
                if key != 'type' and key != 'event_type':
                    message[key] = value
            
            await self.send(text_data=json.dumps(message))
    
    @database_sync_to_async
    def save_transcript_segment(self, segment_data):
        """
        Save a transcript segment to the database
        """
        if not self.transcript:
            return None
        
        return TranscriptionSegment.objects.create(
            transcript=self.transcript,
            text=segment_data['text'],
            start_time=segment_data['start'],
            end_time=segment_data['end'],
            confidence=segment_data['confidence']
        )
