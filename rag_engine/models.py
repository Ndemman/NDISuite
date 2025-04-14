from django.db import models
import uuid
from django.contrib.postgres.fields import ArrayField
from session_manager.models import Session, OutputField
from input_processor.models import Chunk

class RAGPromptTemplate(models.Model):
    """Model to store prompt templates for RAG generation"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    template_text = models.TextField()  # Contains placeholders for context and user input
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class RAGGeneration(models.Model):
    """Model to track individual RAG generation requests"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    output_field = models.ForeignKey(OutputField, on_delete=models.CASCADE, related_name='rag_generations')
    prompt_template = models.ForeignKey(RAGPromptTemplate, on_delete=models.CASCADE, related_name='generations')
    model = models.CharField(max_length=50, default='gpt-3.5-turbo')  # LLM model name
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    processing_time_ms = models.IntegerField(null=True, blank=True)  # Track performance
    
    def __str__(self):
        return f"RAG Generation for {self.output_field.name}"

class RetrievedContext(models.Model):
    """Model to track chunks retrieved for a RAG generation"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rag_generation = models.ForeignKey(RAGGeneration, on_delete=models.CASCADE, related_name='retrieved_contexts')
    chunk = models.ForeignKey(Chunk, on_delete=models.CASCADE, related_name='retrievals')
    relevance_score = models.FloatField()  # Score indicating relevance to the query
    order = models.IntegerField()  # Order in which chunks were retrieved
    
    class Meta:
        ordering = ['-relevance_score']
    
    def __str__(self):
        return f"Context {self.order} for {self.rag_generation.id}"

class VectorStore(models.Model):
    """Model to track vector stores for sessions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(Session, on_delete=models.CASCADE, related_name='vector_store')
    store_path = models.CharField(max_length=512)  # Path to stored vector index
    embedding_model = models.CharField(max_length=50, default='text-embedding-ada-002')  # Embedding model used
    chunk_count = models.IntegerField(default=0)  # Number of chunks indexed
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Vector store for {self.session}"
