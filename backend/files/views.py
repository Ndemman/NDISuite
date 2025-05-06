from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.core.files.storage import default_storage
from celery.result import AsyncResult
from .models import InputFile, ProcessedChunk
from .serializers import InputFileSerializer, ProcessedChunkSerializer
from .services import DocumentProcessingService
from .tasks import process_file_task  # Will implement this later


class InputFileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing input files (audio, documents)
    """
    serializer_class = InputFileSerializer
    queryset = InputFile.objects.all()
    
    def get_queryset(self):
        """
        Filter files by user and optionally by session
        """
        queryset = super().get_queryset().filter(user=self.request.user)
        
        # Filter by session if provided
        session_id = self.request.query_params.get('session', None)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by file type if provided
        file_type = self.request.query_params.get('file_type', None)
        if file_type:
            queryset = queryset.filter(file_type=file_type)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the user when creating a file
        """
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """
        Start processing a file
        """
        file_obj = self.get_object()
        
        # Check if file is in a state that can be processed
        if file_obj.status not in ['uploaded', 'failed']:
            return Response(
                {"error": f"File is in {file_obj.status} state and cannot be processed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status to processing
        file_obj.status = 'processing'
        file_obj.save()
        
        # Start processing task
        task = process_file_task.delay(str(file_obj.id))
        
        return Response({
            "message": "File processing started",
            "task_id": task.id,
            "file_id": str(file_obj.id)
        })
    
    @action(detail=True, methods=['get'])
    def chunks(self, request, pk=None):
        """
        Get all chunks for a file
        """
        file_obj = self.get_object()
        chunks = file_obj.chunks.all().order_by('chunk_index')
        serializer = ProcessedChunkSerializer(chunks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Generate a download URL for the file
        """
        file_obj = self.get_object()
        if file_obj.file:
            return Response({
                "download_url": request.build_absolute_uri(file_obj.file.url)
            })
        else:
            return Response(
                {"error": "No file available for download"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def text(self, request, pk=None):
        """
        Get the full extracted text of a file
        """
        file_obj = self.get_object()
        
        # If processing is not complete, return current state
        if file_obj.status != 'processed':
            return Response({
                "status": file_obj.status,
                "text": file_obj.extracted_text or "",
                "error": file_obj.error or None
            })
        
        # If mongo_id is not set, return the extracted text from the model
        if not file_obj.mongo_id:
            return Response({
                "text": file_obj.extracted_text or "",
                "status": "processed"
            })
        
        # Get text from MongoDB
        try:
            from pymongo import MongoClient
            from django.conf import settings
            
            client = MongoClient(settings.MONGODB_URI)
            db = client[settings.MONGODB_DB]
            collection = db['documents']
            
            doc = collection.find_one({"_id": file_obj.mongo_id})
            if doc:
                return Response({
                    "text": doc.get('text', ''),
                    "status": "processed"
                })
            else:
                return Response(
                    {"error": "Document not found in MongoDB"},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {"error": f"Error retrieving document text: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete a file and its associated resources
        """
        file_obj = self.get_object()
        
        try:
            with transaction.atomic():
                # Delete file from storage
                if file_obj.file:
                    try:
                        default_storage.delete(file_obj.file.name)
                    except Exception as e:
                        pass  # Continue with deletion even if file removal fails
                
                # Delete MongoDB document if exists
                if file_obj.mongo_id:
                    try:
                        from pymongo import MongoClient
                        from django.conf import settings
                        
                        client = MongoClient(settings.MONGODB_URI)
                        db = client[settings.MONGODB_DB]
                        collection = db['documents']
                        
                        collection.delete_one({"_id": file_obj.mongo_id})
                    except Exception as e:
                        pass  # Continue with deletion even if MongoDB removal fails
                
                # Delete the database entry
                return super().destroy(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {"error": f"Error deleting file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProcessedChunkViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing processed chunks
    """
    serializer_class = ProcessedChunkSerializer
    queryset = ProcessedChunk.objects.all()
    
    def get_queryset(self):
        """
        Filter chunks by file and ensure user has access
        """
        queryset = super().get_queryset()
        
        # Filter by file_id if provided
        file_id = self.request.query_params.get('file', None)
        if file_id:
            queryset = queryset.filter(input_file_id=file_id)
        
        # Ensure user has access to the file
        return queryset.filter(input_file__user=self.request.user)
