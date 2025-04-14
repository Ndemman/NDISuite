import os
import logging
import time
from pathlib import Path
import json

from django.conf import settings
from django.utils import timezone

import openai
from openai import OpenAI
from dotenv import load_dotenv

from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor

from .models import RAGGeneration, RAGPromptTemplate, RetrievedContext, VectorStore
from session_manager.models import Session, OutputField
from input_processor.models import Chunk

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class RAGService:
    """Service for Retrieval-Augmented Generation using LangChain and OpenAI"""
    
    # Directory for storing vector indices
    VECTOR_STORE_DIR = os.path.join(settings.BASE_DIR, 'vector_stores')
    
    @staticmethod
    def create_vector_store(session):
        """Create a vector store for a session"""
        # Make sure the vector store directory exists
        os.makedirs(RAGService.VECTOR_STORE_DIR, exist_ok=True)
        
        # Create a session-specific directory
        session_dir = os.path.join(RAGService.VECTOR_STORE_DIR, str(session.id))
        os.makedirs(session_dir, exist_ok=True)
        
        # Get all chunks from the session's input files
        chunks = []
        metadatas = []
        
        for input_file in session.input_files.filter(processed=True):
            try:
                result = input_file.processing_result
                for chunk in result.chunks.all():
                    chunks.append(chunk.content)
                    metadatas.append({
                        'chunk_id': str(chunk.id),
                        'order': chunk.order,
                        'file_name': input_file.file_name,
                        'file_type': input_file.file_type
                    })
            except Exception as e:
                logger.error(f"Error retrieving chunks for file {input_file.id}: {str(e)}")
        
        if not chunks:
            logger.warning(f"No chunks found for session {session.id}")
            return None
        
        # Create embeddings and vector store
        embeddings = OpenAIEmbeddings(
            openai_api_key=os.getenv('OPENAI_API_KEY'),
            model=os.getenv('EMBEDDING_MODEL', 'text-embedding-ada-002')
        )
        
        vector_store_path = os.path.join(session_dir, 'faiss_index')
        
        # Create FAISS vector store
        vector_store = FAISS.from_texts(
            texts=chunks,
            embedding=embeddings,
            metadatas=metadatas
        )
        
        # Save the vector store
        vector_store.save_local(vector_store_path)
        
        # Create VectorStore model instance
        db_vector_store = VectorStore.objects.create(
            session=session,
            store_path=vector_store_path,
            embedding_model=os.getenv('EMBEDDING_MODEL', 'text-embedding-ada-002'),
            chunk_count=len(chunks)
        )
        
        logger.info(f"Created vector store for session {session.id} with {len(chunks)} chunks")
        return db_vector_store
    
    @staticmethod
    def get_vector_store(session):
        """Get existing vector store for a session or create a new one"""
        try:
            vector_store = session.vector_store
            
            # Check if the vector store exists on disk
            if not os.path.exists(vector_store.store_path):
                logger.warning(f"Vector store path {vector_store.store_path} not found, recreating")
                vector_store.delete()
                return RAGService.create_vector_store(session)
                
            return vector_store
        except Session.vector_store.RelatedObjectDoesNotExist:
            return RAGService.create_vector_store(session)
    
    @staticmethod
    def retrieve_context(session, query, num_documents=5):
        """Retrieve relevant chunks for a query"""
        # Get or create vector store
        db_vector_store = RAGService.get_vector_store(session)
        if not db_vector_store:
            return []
        
        # Load the vector store
        embeddings = OpenAIEmbeddings(
            openai_api_key=os.getenv('OPENAI_API_KEY'),
            model=os.getenv('EMBEDDING_MODEL', 'text-embedding-ada-002')
        )
        vector_store = FAISS.load_local(db_vector_store.store_path, embeddings)
        
        # Retrieve documents
        retriever = vector_store.as_retriever(search_kwargs={"k": num_documents})
        
        # Add contextual compression for better results
        llm = ChatOpenAI(
            openai_api_key=os.getenv('OPENAI_API_KEY'),
            model_name=os.getenv('RAG_MODEL', 'gpt-3.5-turbo'),
            temperature=0
        )
        compressor = LLMChainExtractor.from_llm(llm)
        compression_retriever = ContextualCompressionRetriever(
            base_compressor=compressor,
            base_retriever=retriever
        )
        
        # Get documents
        docs = compression_retriever.get_relevant_documents(query)
        
        return docs
    
    @staticmethod
    def generate_content(output_field, context_docs=None):
        """Generate content for an output field using RAG"""
        # Get prompt template
        prompt_template = RAGPromptTemplate.objects.filter(is_active=True).first()
        if not prompt_template:
            # Create a default prompt template if none exists
            prompt_template = RAGPromptTemplate.objects.create(
                name="Default RAG Template",
                description="Default template for RAG content generation",
                template_text=(
                    "Based on the following context information:\n\n"
                    "{context}\n\n"
                    "Generate content for the following prompt:\n"
                    "{prompt}\n\n"
                    "Your response should be well-structured, informative, and directly address the prompt."
                )
            )
        
        # Create RAG generation record
        rag_generation = RAGGeneration.objects.create(
            output_field=output_field,
            prompt_template=prompt_template,
            model=os.getenv('RAG_MODEL', 'gpt-3.5-turbo'),
            status='IN_PROGRESS'
        )
        
        try:
            # Get session from output field
            session = output_field.configuration.session
            
            # If no context provided, retrieve it
            if context_docs is None:
                context_docs = RAGService.retrieve_context(session, output_field.prompt)
            
            # Store retrieved contexts
            for i, doc in enumerate(context_docs):
                # Get chunk ID from metadata
                chunk_id = doc.metadata.get('chunk_id') if hasattr(doc, 'metadata') else None
                
                if chunk_id:
                    try:
                        chunk = Chunk.objects.get(id=chunk_id)
                        RetrievedContext.objects.create(
                            rag_generation=rag_generation,
                            chunk=chunk,
                            relevance_score=float(i+1)/len(context_docs),  # Simple relevance score
                            order=i
                        )
                    except Chunk.DoesNotExist:
                        logger.warning(f"Chunk {chunk_id} not found")
            
            # Start timing
            start_time = time.time()
            
            # Format prompt with context
            context_text = "\n\n".join([doc.page_content for doc in context_docs])
            prompt = prompt_template.template_text.format(
                context=context_text,
                prompt=output_field.prompt
            )
            
            # Call OpenAI API
            response = client.chat.completions.create(
                model=rag_generation.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that generates NDIS report content based on provided context."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Calculate processing time
            end_time = time.time()
            processing_time_ms = int((end_time - start_time) * 1000)
            
            # Extract generated content
            generated_content = response.choices[0].message.content
            
            # Update output field
            output_field.generated_content = generated_content
            output_field.save()
            
            # Update RAG generation record
            rag_generation.status = 'COMPLETED'
            rag_generation.completed_at = timezone.now()
            rag_generation.processing_time_ms = processing_time_ms
            rag_generation.save()
            
            logger.info(f"Generated content for output field {output_field.id}, processing time: {processing_time_ms}ms")
            return generated_content
            
        except Exception as e:
            logger.error(f"Error generating content for output field {output_field.id}: {str(e)}")
            
            # Update RAG generation record
            rag_generation.status = 'FAILED'
            rag_generation.error_message = str(e)
            rag_generation.save()
            
            raise
