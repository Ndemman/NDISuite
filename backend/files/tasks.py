import logging
import asyncio
from celery import shared_task
from .models import InputFile
from .services import DocumentProcessingService

logger = logging.getLogger('ndisuite')


@shared_task
def process_file_task(file_id):
    """
    Celery task to process a file asynchronously
    """
    try:
        # Get the file object
        file_obj = InputFile.objects.get(id=file_id)
        
        # Create document processing service
        service = DocumentProcessingService()
        
        # Process the file using asyncio to handle the async method
        loop = asyncio.get_event_loop()
        success = loop.run_until_complete(service.process_file(file_obj))
        
        # Clean up resources
        service.cleanup()
        
        return {
            "success": success,
            "file_id": file_id,
            "status": file_obj.status
        }
    
    except InputFile.DoesNotExist:
        logger.error(f"File not found: {file_id}")
        return {
            "success": False,
            "file_id": file_id,
            "error": "File not found"
        }
    
    except Exception as e:
        logger.error(f"Error processing file {file_id}: {str(e)}")
        
        # Update file status if possible
        try:
            file_obj = InputFile.objects.get(id=file_id)
            file_obj.status = 'failed'
            file_obj.error = f"Error processing file: {str(e)}"
            file_obj.save()
        except:
            pass
        
        return {
            "success": False,
            "file_id": file_id,
            "error": str(e)
        }
