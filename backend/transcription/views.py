from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.conf import settings
from pymongo import MongoClient
from .models import Transcript, TranscriptionSegment, AudioRecording
from .serializers import TranscriptSerializer, TranscriptionSegmentSerializer, AudioRecordingSerializer


class TranscriptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for managing transcripts
    """
    serializer_class = TranscriptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter transcripts by user and optionally by session
        """
        queryset = Transcript.objects.filter(user=self.request.user)
        
        # Filter by session if provided
        session_id = self.request.query_params.get('session', None)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by source type if provided
        source_type = self.request.query_params.get('source_type', None)
        if source_type:
            queryset = queryset.filter(source_type=source_type)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['get'])
    def segments(self, request, pk=None):
        """
        Get all segments for a transcript
        """
        transcript = self.get_object()
        segments = transcript.segments.all().order_by('start_time')
        serializer = TranscriptionSegmentSerializer(segments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def full_text(self, request, pk=None):
        """
        Get the full text of a transcript from MongoDB
        """
        transcript = self.get_object()
        
        if not transcript.mongo_id:
            return Response({
                "text": transcript.text or "",
                "segments": []
            })
        
        try:
            # Connect to MongoDB
            client = MongoClient(settings.MONGODB_URI)
            db = client[settings.MONGODB_DB]
            collection = db['transcripts']
            
            # Find the document
            doc = collection.find_one({"_id": transcript.mongo_id})
            if doc:
                return Response({
                    "text": doc.get('text', transcript.text),
                    "segments": doc.get('segments', [])
                })
            else:
                return Response(
                    {"error": "Transcript document not found in MongoDB"},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {"error": f"Error retrieving transcript: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AudioRecordingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing audio recordings
    """
    serializer_class = AudioRecordingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter recordings by user and optionally by session
        """
        queryset = AudioRecording.objects.filter(user=self.request.user)
        
        # Filter by session if provided
        session_id = self.request.query_params.get('session', None)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        return queryset.order_by('-start_time')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark a recording as complete
        """
        recording = self.get_object()
        
        # Only update if currently recording or paused
        if recording.status not in ['recording', 'paused']:
            return Response(
                {"error": f"Recording is in {recording.status} state and cannot be completed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update recording status
        recording.status = 'completed'
        recording.save()
        
        serializer = self.get_serializer(recording)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a recording
        """
        recording = self.get_object()
        
        # Only cancel if currently recording or paused
        if recording.status not in ['recording', 'paused']:
            return Response(
                {"error": f"Recording is in {recording.status} state and cannot be cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update recording status
        recording.status = 'failed'
        recording.save()
        
        serializer = self.get_serializer(recording)
        return Response(serializer.data)
