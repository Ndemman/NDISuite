import mimetypes
import os
from rest_framework import serializers
from .models import InputFile, ProcessedChunk


class InputFileSerializer(serializers.ModelSerializer):
    """
    Serializer for the InputFile model
    """
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = InputFile
        fields = [
            'id', 'session', 'user', 'file', 'file_url', 'original_filename',
            'file_size', 'file_size_formatted', 'file_type', 'mime_type', 'status',
            'error', 'created_at', 'updated_at', 'extracted_text'
        ]
        read_only_fields = [
            'id', 'file_url', 'file_size_formatted', 'status', 'error',
            'created_at', 'updated_at', 'extracted_text'
        ]
    
    def create(self, validated_data):
        """
        Create a new InputFile instance with automatically determined file type
        """
        file = validated_data['file']
        
        # Get original filename
        original_filename = file.name
        validated_data['original_filename'] = original_filename
        
        # Get file size
        validated_data['file_size'] = file.size
        
        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(original_filename)
        validated_data['mime_type'] = mime_type or 'application/octet-stream'
        
        # Determine file type
        ext = os.path.splitext(original_filename)[1].lower()
        if ext in ['.mp3', '.wav', '.ogg', '.m4a', '.webm']:
            file_type = 'audio'
        elif ext == '.pdf':
            file_type = 'pdf'
        elif ext == '.docx':
            file_type = 'docx'
        elif ext == '.txt':
            file_type = 'txt'
        else:
            file_type = 'other'
        
        validated_data['file_type'] = file_type
        validated_data['status'] = 'uploaded'
        
        return super().create(validated_data)
    
    def get_file_url(self, obj):
        """
        Get the URL of the file
        """
        if obj.file:
            return obj.file.url
        return None
    
    def get_file_size_formatted(self, obj):
        """
        Format the file size in a human-readable format
        """
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024 or unit == 'GB':
                return f"{size:.2f} {unit}" if unit != 'B' else f"{size} {unit}"
            size /= 1024


class ProcessedChunkSerializer(serializers.ModelSerializer):
    """
    Serializer for the ProcessedChunk model
    """
    class Meta:
        model = ProcessedChunk
        fields = [
            'id', 'input_file', 'text', 'chunk_index',
            'source_location', 'embedding_id'
        ]
        read_only_fields = ['id', 'embedding_id']
