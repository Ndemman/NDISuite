from rest_framework import serializers
from .models import Transcript, TranscriptionSegment, AudioRecording
from pymongo import MongoClient
from django.conf import settings


class TranscriptionSegmentSerializer(serializers.ModelSerializer):
    """
    Serializer for the TranscriptionSegment model
    """
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = TranscriptionSegment
        fields = [
            'id', 'transcript', 'text', 'start_time', 'end_time',
            'confidence', 'duration'
        ]
        read_only_fields = ['id']
    
    def get_duration(self, obj):
        return obj.end_time - obj.start_time


class TranscriptSerializer(serializers.ModelSerializer):
    """
    Serializer for the Transcript model
    """
    segments = TranscriptionSegmentSerializer(many=True, read_only=True)
    full_text = serializers.SerializerMethodField()
    
    class Meta:
        model = Transcript
        fields = [
            'id', 'session', 'user', 'source_type', 'source_file',
            'language', 'duration_seconds', 'mongo_id', 'status',
            'error', 'text', 'full_text', 'segments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'full_text', 'created_at', 'updated_at']
    
    def get_full_text(self, obj):
        """
        Get the full text from MongoDB if available
        """
        if not obj.mongo_id:
            return obj.text
        
        try:
            # Connect to MongoDB
            client = MongoClient(settings.MONGODB_URI)
            db = client[settings.MONGODB_DB]
            collection = db['transcripts']
            
            # Find the document
            doc = collection.find_one({"_id": obj.mongo_id})
            if doc:
                return doc.get('text', obj.text)
            
            return obj.text
        except Exception as e:
            return obj.text


class AudioRecordingSerializer(serializers.ModelSerializer):
    """
    Serializer for the AudioRecording model
    """
    duration = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    transcript_data = TranscriptSerializer(source='transcript', read_only=True)
    
    class Meta:
        model = AudioRecording
        fields = [
            'id', 'session', 'user', 'status', 'start_time', 'end_time',
            'duration_seconds', 'duration', 'audio_file', 'audio_url',
            'transcript', 'transcript_data'
        ]
        read_only_fields = ['id', 'duration', 'audio_url', 'transcript_data']
    
    def get_duration(self, obj):
        if obj.duration_seconds:
            minutes, seconds = divmod(int(obj.duration_seconds), 60)
            return f"{minutes:02d}:{seconds:02d}"
        return "00:00"
    
    def get_audio_url(self, obj):
        if obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.audio_file.url)
            return obj.audio_file.url
        return None
