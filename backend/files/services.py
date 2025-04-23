import os
import logging
import tempfile
import asyncio
import fitz  # PyMuPDF
import docx
from django.conf import settings
from pymongo import MongoClient
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings

logger = logging.getLogger('ndisuite')


class DocumentProcessingService:
    """
    Service for processing uploaded documents (PDF, DOCX, TXT)
    """
    
    def __init__(self):
        """
        Initialize the document processing service
        """
        self.mongo_client = MongoClient(settings.MONGODB_URI)
        self.db = self.mongo_client[settings.MONGODB_DB]
        self.collection = self.db['documents']
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=settings.OPENAI_API_KEY,
            model=settings.EMBEDDING_MODEL
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
    
    async def process_file(self, input_file):
        """
        Process an uploaded file based on its type
        """
        try:
            file_type = input_file.file_type
            file_path = input_file.file.path
            
            # Update status to processing
            input_file.status = 'processing'
            await asyncio.to_thread(lambda: input_file.save())
            
            # Process based on file type
            if file_type == 'pdf':
                result = await self.process_pdf(input_file, file_path)
            elif file_type == 'docx':
                result = await self.process_docx(input_file, file_path)
            elif file_type == 'txt':
                result = await self.process_text(input_file, file_path)
            else:
                input_file.status = 'failed'
                input_file.error = f"Unsupported file type: {file_type}"
                await asyncio.to_thread(lambda: input_file.save())
                return False
            
            if result:
                input_file.status = 'processed'
            else:
                input_file.status = 'failed'
                input_file.error = "Failed to process file"
                
            await asyncio.to_thread(lambda: input_file.save())
            return result
            
        except Exception as e:
            logger.error(f"Error processing file {input_file.id}: {str(e)}")
            input_file.status = 'failed'
            input_file.error = f"Error processing file: {str(e)}"
            await asyncio.to_thread(lambda: input_file.save())
            return False
    
    async def process_pdf(self, input_file, file_path):
        """
        Process a PDF file
        """
        try:
            # Extract text from PDF
            text = await asyncio.to_thread(self._extract_text_from_pdf, file_path)
            
            # Save the extracted text preview
            input_file.extracted_text = text[:1000] + "..." if len(text) > 1000 else text
            
            # Store full text in MongoDB
            mongo_id = await asyncio.to_thread(
                lambda: self.collection.insert_one({
                    'file_id': str(input_file.id),
                    'text': text,
                    'metadata': {
                        'filename': input_file.original_filename,
                        'file_type': input_file.file_type,
                        'file_size': input_file.file_size,
                        'mime_type': input_file.mime_type
                    }
                }).inserted_id
            )
            
            # Update MongoDB reference
            input_file.mongo_id = str(mongo_id)
            
            # Process chunks and create embeddings
            await self.process_chunks(input_file, text)
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing PDF {input_file.id}: {str(e)}")
            input_file.error = f"Error processing PDF: {str(e)}"
            return False
    
    def _extract_text_from_pdf(self, file_path):
        """
        Extract text from a PDF file using PyMuPDF
        """
        text = ""
        try:
            # Open the PDF
            doc = fitz.open(file_path)
            
            # Iterate through each page and extract text
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text += page.get_text()
            
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise
    
    async def process_docx(self, input_file, file_path):
        """
        Process a DOCX file
        """
        try:
            # Extract text from DOCX
            text = await asyncio.to_thread(self._extract_text_from_docx, file_path)
            
            # Save the extracted text preview
            input_file.extracted_text = text[:1000] + "..." if len(text) > 1000 else text
            
            # Store full text in MongoDB
            mongo_id = await asyncio.to_thread(
                lambda: self.collection.insert_one({
                    'file_id': str(input_file.id),
                    'text': text,
                    'metadata': {
                        'filename': input_file.original_filename,
                        'file_type': input_file.file_type,
                        'file_size': input_file.file_size,
                        'mime_type': input_file.mime_type
                    }
                }).inserted_id
            )
            
            # Update MongoDB reference
            input_file.mongo_id = str(mongo_id)
            
            # Process chunks and create embeddings
            await self.process_chunks(input_file, text)
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing DOCX {input_file.id}: {str(e)}")
            input_file.error = f"Error processing DOCX: {str(e)}"
            return False
    
    def _extract_text_from_docx(self, file_path):
        """
        Extract text from a DOCX file using python-docx
        """
        text = ""
        try:
            # Open the document
            doc = docx.Document(file_path)
            
            # Iterate through paragraphs and extract text
            for para in doc.paragraphs:
                text += para.text + "\n"
            
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {str(e)}")
            raise
    
    async def process_text(self, input_file, file_path):
        """
        Process a plain text file
        """
        try:
            # Read the text file
            text = await asyncio.to_thread(self._read_text_file, file_path)
            
            # Save the extracted text preview
            input_file.extracted_text = text[:1000] + "..." if len(text) > 1000 else text
            
            # Store full text in MongoDB
            mongo_id = await asyncio.to_thread(
                lambda: self.collection.insert_one({
                    'file_id': str(input_file.id),
                    'text': text,
                    'metadata': {
                        'filename': input_file.original_filename,
                        'file_type': input_file.file_type,
                        'file_size': input_file.file_size,
                        'mime_type': input_file.mime_type
                    }
                }).inserted_id
            )
            
            # Update MongoDB reference
            input_file.mongo_id = str(mongo_id)
            
            # Process chunks and create embeddings
            await self.process_chunks(input_file, text)
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing text file {input_file.id}: {str(e)}")
            input_file.error = f"Error processing text file: {str(e)}"
            return False
    
    def _read_text_file(self, file_path):
        """
        Read a plain text file
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except UnicodeDecodeError:
            # Try with different encoding
            with open(file_path, 'r', encoding='latin-1') as file:
                return file.read()
    
    async def process_chunks(self, input_file, text):
        """
        Process text into chunks and create embeddings
        """
        from .models import ProcessedChunk
        
        try:
            # Split text into chunks
            chunks = await asyncio.to_thread(
                lambda: self.text_splitter.split_text(text)
            )
            
            # Create embeddings and store in vector store
            for i, chunk_text in enumerate(chunks):
                # Create a database record for this chunk
                chunk = await asyncio.to_thread(
                    lambda: ProcessedChunk.objects.create(
                        input_file=input_file,
                        text=chunk_text,
                        chunk_index=i,
                        source_location={'index': i}
                    )
                )
                
                # Create embedding using LangChain and OpenAI
                embedding = await asyncio.to_thread(
                    lambda: self.embeddings.embed_query(chunk_text)
                )
                
                # Store in vector database
                await self._store_embedding(chunk, chunk_text, embedding)
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing chunks for file {input_file.id}: {str(e)}")
            return False
    
    async def _store_embedding(self, chunk, text, embedding):
        """
        Store embedding in vector database
        """
        try:
            # Get or create vector store
            vector_store = Chroma(
                collection_name="document_chunks",
                embedding_function=self.embeddings,
                persist_directory=settings.VECTOR_STORE_PATH
            )
            
            # Add text and embedding to vector store
            embedding_id = await asyncio.to_thread(
                lambda: vector_store.add_texts(
                    texts=[text],
                    metadatas=[{
                        'chunk_id': str(chunk.id),
                        'file_id': str(chunk.input_file.id),
                        'chunk_index': chunk.chunk_index,
                        'source_type': chunk.input_file.file_type,
                        'filename': chunk.input_file.original_filename
                    }]
                )
            )
            
            # Update chunk with embedding ID
            chunk.embedding_id = embedding_id[0]
            await asyncio.to_thread(lambda: chunk.save())
            
            return embedding_id
            
        except Exception as e:
            logger.error(f"Error storing embedding for chunk {chunk.id}: {str(e)}")
            raise
    
    def cleanup(self):
        """
        Clean up resources
        """
        if hasattr(self, 'mongo_client') and self.mongo_client:
            self.mongo_client.close()
