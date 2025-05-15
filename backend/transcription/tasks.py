"""Celery tasks for transcription app."""

import logging
from typing import List

from celery import shared_task
from django.conf import settings
from langchain.docstore.document import Document
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from pymongo import MongoClient

from .models import Transcript

logger = logging.getLogger("ndisuite")


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={'max_retries': 3})
def embed_transcript_task(self, transcript_id: str):
    """Embed a completed transcript into the session's Chroma collection for RAG.

    This task loads the full transcript text (from MongoDB if large), splits it into
    chunks, embeds them with the configured embedding model, and upserts them into a
    Chroma collection named after the session (e.g. ``session_<session_id>``).
    """
    try:
        transcript = Transcript.objects.select_related("session").get(id=transcript_id)
        if transcript.status != "completed":
            logger.warning("Transcript %s not completed. Skipping embed.", transcript_id)
            return

        # Fetch full text
        full_text = transcript.text
        if transcript.mongo_id:
            try:
                mongo = MongoClient(settings.MONGODB_URI)
                db = mongo[settings.MONGODB_DB]
                doc = db["transcripts"].find_one({"_id": transcript.mongo_id})
                if doc and doc.get("text"):
                    full_text = doc["text"]
            except Exception as exc:
                logger.error("Failed to fetch transcript from MongoDB: %s", exc)

        if not full_text:
            logger.warning("Transcript %s has no text to embed", transcript_id)
            return

        # Split into chunks
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks: List[str] = splitter.split_text(full_text)
        documents = [
            Document(
                page_content=chunk,
                metadata={
                    "type": "transcript",
                    "transcript_id": str(transcript.id),
                    "session_id": str(transcript.session_id),
                },
            )
            for chunk in chunks
        ]

        # Prepare embeddings and vector store
        embeddings = OpenAIEmbeddings(
            openai_api_key=settings.OPENAI_API_KEY, model=settings.EMBEDDING_MODEL
        )
        collection_name = f"session_{transcript.session_id}"
        vector_store = Chroma(
            collection_name=collection_name,
            embedding_function=embeddings,
            persist_directory=settings.VECTOR_STORE_PATH,
        )

        vector_store.add_documents(documents)
        vector_store.persist()

        logger.info("Embedded %d transcript chunks for session %s", len(documents), transcript.session_id)
    except Transcript.DoesNotExist:
        logger.error("Transcript %s not found", transcript_id)
    except Exception as e:
        logger.exception("Error embedding transcript %s: %s", transcript_id, e)
