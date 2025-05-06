"""Celery tasks for cleanup routines."""

import logging
from celery import shared_task
from django.conf import settings
from langchain.vectorstores import Chroma

logger = logging.getLogger("ndisuite")


@shared_task
def cleanup_vector_store_task(session_id: str):
    """Delete a Chroma collection for an archived session to free disk."""
    try:
        collection_name = f"session_{session_id}"
        store = Chroma(
            collection_name=collection_name,
            persist_directory=settings.VECTOR_STORE_PATH,
            embedding_function=None,  # Not needed for deletion
        )
        store.delete_collection()
        logger.info("Removed vector collection %s", collection_name)
    except Exception as exc:
        logger.exception("Failed to cleanup vector store for session %s: %s", session_id, exc)
