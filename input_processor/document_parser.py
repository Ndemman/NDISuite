import os
import logging
import tempfile
from pathlib import Path

import fitz  # PyMuPDF for PDF parsing
import docx  # python-docx for DOCX parsing
from PIL import Image
import pytesseract  # Tesseract OCR
from tika import parser as tika_parser  # Apache Tika fallback

from session_manager.models import InputFile
from input_processor.models import ProcessingResult, Chunk

# Configure logging
logger = logging.getLogger(__name__)

class DocumentParser:
    """Service for parsing different document types"""
    
    CHUNK_SIZE = 1000  # Characters per chunk
    CHUNK_OVERLAP = 200  # Character overlap between chunks
    
    @staticmethod
    def parse_document(input_file):
        """Parse document based on file type"""
        file_path = input_file.file_path
        file_extension = Path(file_path).suffix.lower()
        
        logger.info(f"Parsing document: {file_path} with extension {file_extension}")
        
        # Process based on file extension
        if file_extension == '.pdf':
            text = DocumentParser._parse_pdf(file_path)
        elif file_extension == '.docx':
            text = DocumentParser._parse_docx(file_path)
        elif file_extension == '.txt':
            text = DocumentParser._parse_txt(file_path)
        else:
            # Fallback to Tika for other formats
            text = DocumentParser._parse_with_tika(file_path)
        
        # If text extraction failed, try OCR as last resort
        if not text or text.strip() == '':
            logger.warning(f"Text extraction failed for {file_path}, attempting OCR")
            text = DocumentParser._perform_ocr(file_path)
        
        # Create processing result
        result = ProcessingResult.objects.create(
            input_file=input_file,
            normalized_text=text,
            extracted_metadata={}
        )
        
        # Create chunks
        DocumentParser.create_chunks(result)
        
        # Mark input file as processed
        input_file.processed = True
        input_file.save()
        
        return result
    
    @staticmethod
    def _parse_pdf(file_path):
        """Parse PDF file using PyMuPDF"""
        try:
            text = ""
            doc = fitz.open(file_path)
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text += page.get_text()
            
            doc.close()
            return text
        except Exception as e:
            logger.error(f"Error parsing PDF {file_path}: {str(e)}")
            return ""
    
    @staticmethod
    def _parse_docx(file_path):
        """Parse DOCX file using python-docx"""
        try:
            text = ""
            doc = docx.Document(file_path)
            
            for para in doc.paragraphs:
                text += para.text + "\n"
            
            return text
        except Exception as e:
            logger.error(f"Error parsing DOCX {file_path}: {str(e)}")
            return ""
    
    @staticmethod
    def _parse_txt(file_path):
        """Parse plain text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except UnicodeDecodeError:
            # Try different encoding if UTF-8 fails
            try:
                with open(file_path, 'r', encoding='latin-1') as file:
                    return file.read()
            except Exception as e:
                logger.error(f"Error parsing TXT {file_path}: {str(e)}")
                return ""
        except Exception as e:
            logger.error(f"Error parsing TXT {file_path}: {str(e)}")
            return ""
    
    @staticmethod
    def _parse_with_tika(file_path):
        """Parse document using Apache Tika (fallback)"""
        try:
            parsed = tika_parser.from_file(file_path)
            return parsed["content"] if "content" in parsed else ""
        except Exception as e:
            logger.error(f"Error parsing with Tika {file_path}: {str(e)}")
            return ""
    
    @staticmethod
    def _perform_ocr(file_path):
        """Perform OCR on document using Tesseract"""
        try:
            # For PDFs, extract images and perform OCR
            if file_path.lower().endswith('.pdf'):
                text = ""
                doc = fitz.open(file_path)
                
                for page_num in range(len(doc)):
                    page = doc.load_page(page_num)
                    pix = page.get_pixmap()
                    
                    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
                        pix.save(temp_file.name)
                        image = Image.open(temp_file.name)
                        page_text = pytesseract.image_to_string(image)
                        text += page_text + "\n"
                    
                    # Clean up
                    os.unlink(temp_file.name)
                
                doc.close()
                return text
            else:
                # For image files, direct OCR
                image = Image.open(file_path)
                return pytesseract.image_to_string(image)
        except Exception as e:
            logger.error(f"Error performing OCR on {file_path}: {str(e)}")
            return ""
    
    @staticmethod
    def create_chunks(processing_result, chunk_size=None, overlap=None):
        """Create chunks from processed text"""
        if chunk_size is None:
            chunk_size = DocumentParser.CHUNK_SIZE
        
        if overlap is None:
            overlap = DocumentParser.CHUNK_OVERLAP
        
        text = processing_result.normalized_text
        chunks = []
        
        # Simple chunking strategy
        start = 0
        chunk_order = 0
        
        while start < len(text):
            # Calculate end position with potential overlap
            end = min(start + chunk_size, len(text))
            
            # If not at the end and not at a whitespace, extend to find whitespace
            if end < len(text) and not text[end].isspace():
                # Look for a whitespace character to break at
                next_whitespace = text.find(' ', end)
                if next_whitespace != -1 and next_whitespace - end < 100:  # Reasonable search distance
                    end = next_whitespace
            
            # Extract the chunk
            chunk_text = text[start:end].strip()
            
            # Create chunk if it's not empty
            if chunk_text:
                chunk = Chunk.objects.create(
                    processing_result=processing_result,
                    content=chunk_text,
                    order=chunk_order,
                    metadata={'start_char': start, 'end_char': end}
                )
                chunks.append(chunk)
                chunk_order += 1
            
            # Move the start position, accounting for overlap
            start = end - overlap if end < len(text) else len(text)
            
            # Avoid infinite loops if overlap >= chunk_size
            if start <= end - chunk_size:
                start = end
        
        return chunks
