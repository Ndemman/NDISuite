import logging
import os
import json
import tempfile
from datetime import datetime
from celery import shared_task
from django.conf import settings
from openai import OpenAI
from langchain.vectorstores import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from .models import Report, OutputField, ReportVersion, ExportedReport

logger = logging.getLogger('ndisuite')


@shared_task
def generate_report_task(report_id):
    """
    Generate report content using AI based on session inputs
    """
    try:
        # Get the report object
        report = Report.objects.get(id=report_id)
        
        # Get template
        template = report.template
        if not template:
            return {
                "success": False,
                "report_id": report_id,
                "error": "No template associated with this report"
            }
        
        # Get session data: files, transcripts
        session = report.session
        
        # Create OpenAI client
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Setup LangChain components
        embeddings = OpenAIEmbeddings(
            openai_api_key=settings.OPENAI_API_KEY,
            model=settings.EMBEDDING_MODEL
        )
        
        # Load vector store
        vector_store = Chroma(
            collection_name="document_chunks",
            embedding_function=embeddings,
            persist_directory=settings.VECTOR_STORE_PATH
        )
        
        # Get document chunks from session files
        file_ids = [str(file.id) for file in session.files.all()]
        
        # Log the file_ids for debugging
        logger.info(f"Files found for session {session.id}: {file_ids}")
        
        # Skip retrieval if no files are available
        if not file_ids:
            logger.warning(f"No files found for session {session.id}, RAG will not be used")
        
        # Create retriever with metadata filter for session files
        retriever = vector_store.as_retriever(
            search_kwargs={
                "k": 5,
                "filter": {"file_id": {"$in": file_ids}} if file_ids else None
            }
        )
        
        # Process each field in the template
        template_structure = template.structure
        report_content = {}
        
        for field_name, field_config in template_structure.items():
            # Check if field exists or create it
            field, created = OutputField.objects.get_or_create(
                report=report,
                name=field_name,
                defaults={
                    'label': field_config.get('label', field_name),
                    'field_type': field_config.get('type', 'text'),
                    'options': field_config.get('options', []),
                    'order': field_config.get('order', 0),
                    'validation': field_config.get('validation', {}),
                    'generation_prompt': field_config.get('generation_prompt', '')
                }
            )
            
            # Get generation prompt
            prompt = field.generation_prompt
            if not prompt:
                prompt = f"Generate content for the {field.label} section of an NDIS report."
            
            # Get transcripts
            transcripts = []
            for transcript in session.transcripts.filter(status='completed'):
                try:
                    text = transcript.text
                    if transcript.mongo_id:
                        # Get full text from MongoDB
                        from pymongo import MongoClient
                        client_mongo = MongoClient(settings.MONGODB_URI)
                        db = client_mongo[settings.MONGODB_DB]
                        collection = db['transcripts']
                        doc = collection.find_one({"_id": transcript.mongo_id})
                        if doc:
                            text = doc.get('text', text)
                    
                    transcripts.append(text)
                except Exception as e:
                    logger.error(f"Error getting transcript {transcript.id}: {str(e)}")
            
            # Get relevant context using RAG
            context = ""
            if transcripts:
                context += "TRANSCRIPTS:\n" + "\n---\n".join(transcripts) + "\n\n"
            
            # Only attempt RAG retrieval if we have files
            retrieved_docs = []
            if file_ids:
                try:
                    # Log retrieval attempt
                    logger.info(f"Attempting to retrieve documents for prompt: {prompt[:100]}...")
                    retrieved_docs = retriever.get_relevant_documents(prompt)
                    logger.info(f"Retrieved {len(retrieved_docs)} documents")
                except Exception as e:
                    logger.error(f"Error during RAG retrieval: {str(e)}")
            else:
                logger.warning("Skipping RAG retrieval - no files available")
                
            if retrieved_docs:
                context += "RELEVANT DOCUMENTS:\n"
                for i, doc in enumerate(retrieved_docs):
                    # Log metadata to help debug
                    logger.info(f"Doc {i} metadata: {doc.metadata}")
                    context += f"Document {i+1}:\n{doc.page_content}\n---\n"
            
            # Generate content with OpenAI
            system_prompt = f"""You are an expert NDIS report writer. Your task is to generate content for the {field.label} section of an NDIS report.
            
Guidelines:
- Use professional, clear language appropriate for NDIS reports
- Be specific and provide relevant details
- Focus on the client's support needs, goals, and progress
- Avoid vague language and generalizations
- Use person-centered language
- Be objective and evidence-based
- Follow any specific instructions in the prompt

Use the following context to inform your response:
{context}
            """
            
            try:
                response = client.chat.completions.create(
                    model=settings.GENERATION_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                
                # Save the generated content
                generated_content = response.choices[0].message.content
                field.value = generated_content
                field.save()
                
                # Add to report content
                report_content[field_name] = generated_content
            
            except Exception as e:
                logger.error(f"Error generating content for field {field.name}: {str(e)}")
                field.value = f"Error generating content: {str(e)}"
                field.save()
                report_content[field_name] = field.value
        
        # Update report content and status
        report.content = report_content
        report.status = 'generated'
        report.save()
        
        # Create a version
        ReportVersion.objects.create(
            report=report,
            version_number=1,
            content=report_content,
            created_by=report.session.user,
            comment="Initial AI-generated content"
        )
        
        return {
            "success": True,
            "report_id": report_id,
            "status": report.status
        }
    
    except Report.DoesNotExist:
        logger.error(f"Report not found: {report_id}")
        return {
            "success": False,
            "report_id": report_id,
            "error": "Report not found"
        }
    
    except Exception as e:
        logger.error(f"Error generating report {report_id}: {str(e)}")
        
        # Update report status if possible
        try:
            report = Report.objects.get(id=report_id)
            report.save()
        except:
            pass
        
        return {
            "success": False,
            "report_id": report_id,
            "error": str(e)
        }


@shared_task
def export_report_task(report_id, format='pdf'):
    """
    Export a report to PDF or DOCX format
    """
    try:
        # Get the report object
        report = Report.objects.get(id=report_id)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=f'.{format}', delete=False) as temp_file:
            temp_file_path = temp_file.name
        
        # Generate file based on format
        if format.lower() == 'pdf':
            success = _generate_pdf(report, temp_file_path)
        elif format.lower() == 'docx':
            success = _generate_docx(report, temp_file_path)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        if not success:
            raise Exception(f"Failed to generate {format.upper()} file")
        
        # Create exported report record
        from django.core.files.base import File
        
        export = ExportedReport(
            report=report,
            format=format.lower(),
            created_by=report.session.user
        )
        
        # Save file to model
        with open(temp_file_path, 'rb') as f:
            filename = f"{report.title.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
            export.file.save(filename, File(f))
        
        # Delete temporary file
        try:
            os.unlink(temp_file_path)
        except:
            pass
        
        return {
            "success": True,
            "report_id": report_id,
            "export_id": str(export.id),
            "format": format,
            "file_url": export.file.url
        }
    
    except Report.DoesNotExist:
        logger.error(f"Report not found: {report_id}")
        return {
            "success": False,
            "report_id": report_id,
            "error": "Report not found"
        }
    
    except Exception as e:
        logger.error(f"Error exporting report {report_id} to {format}: {str(e)}")
        
        # Clean up temporary file if it exists
        try:
            os.unlink(temp_file_path)
        except:
            pass
        
        return {
            "success": False,
            "report_id": report_id,
            "error": str(e)
        }


def _generate_pdf(report, output_path):
    """
    Generate a PDF file for the report
    """
    try:
        # Get styles
        styles = getSampleStyleSheet()
        
        # Create custom styles
        title_style = ParagraphStyle(
            'Title', 
            parent=styles['Title'],
            alignment=1,  # Center
            spaceAfter=12
        )
        
        heading_style = ParagraphStyle(
            'Heading',
            parent=styles['Heading2'],
            spaceAfter=6,
            spaceBefore=12
        )
        
        content_style = ParagraphStyle(
            'Content',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            spaceBefore=0,
            spaceAfter=10
        )
        
        # Create document
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Prepare content elements
        elements = []
        
        # Add title
        elements.append(Paragraph(report.title, title_style))
        elements.append(Spacer(1, 12))
        
        # Add date
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%d %B %Y')}", styles['Normal']))
        elements.append(Spacer(1, 24))
        
        # Add fields
        fields = report.fields.all().order_by('order')
        for field in fields:
            # Add field heading
            elements.append(Paragraph(field.label, heading_style))
            
            # Add field content
            elements.append(Paragraph(field.value, content_style))
        
        # Build document
        doc.build(elements)
        
        return True
    
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        return False


def _generate_docx(report, output_path):
    """
    Generate a DOCX file for the report
    """
    try:
        # Create document
        doc = Document()
        
        # Add title
        title = doc.add_heading(report.title, level=1)
        title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        
        # Add date
        date_paragraph = doc.add_paragraph(f"Generated: {datetime.now().strftime('%d %B %Y')}")
        date_paragraph.alignment = WD_PARAGRAPH_ALIGNMENT.RIGHT
        
        # Add fields
        fields = report.fields.all().order_by('order')
        for field in fields:
            # Add field heading
            heading = doc.add_heading(field.label, level=2)
            
            # Add field content
            doc.add_paragraph(field.value)
        
        # Save document
        doc.save(output_path)
        
        return True
    
    except Exception as e:
        logger.error(f"Error generating DOCX: {str(e)}")
        return False


@shared_task
def refine_field_content_task(field_id, instruction, tone='professional', length='maintain', format_style='paragraph'):
    """
    Refine field content using AI
    """
    try:
        # Get the field object
        field = OutputField.objects.get(id=field_id)
        
        # Create OpenAI client
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Prepare the prompt
        system_prompt = f"""You are an expert NDIS report editor. Your task is to refine the content based on the user's instructions.
        
Guidelines:
- Tone: {tone} (e.g., professional, conversational, formal, etc.)
- Length: {length} (maintain, shorter, longer)
- Format: {format_style} (paragraph, bullet points, numbered list)
- Maintain person-centered language
- Be specific and provide relevant details
- Focus on the client's support needs, goals, and progress
- Use professional language appropriate for NDIS reports

Instruction from the user: {instruction}

Please refine the original content according to these instructions while maintaining professional language suitable for an NDIS report.
"""
        
        # Generate refined content
        response = client.chat.completions.create(
            model=settings.REFINING_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": field.value}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        
        # Update the field content
        refined_content = response.choices[0].message.content
        field.value = refined_content
        field.save()
        
        # Update the report content
        report = field.report
        report_content = report.content
        report_content[field.name] = refined_content
        report.content = report_content
        
        # Update report status
        if report.status == 'generated':
            report.status = 'refined'
        
        report.save()
        
        return {
            "success": True,
            "field_id": field_id,
            "report_id": str(report.id)
        }
    
    except OutputField.DoesNotExist:
        logger.error(f"Field not found: {field_id}")
        return {
            "success": False,
            "field_id": field_id,
            "error": "Field not found"
        }
    
    except Exception as e:
        logger.error(f"Error refining field {field_id}: {str(e)}")
        return {
            "success": False,
            "field_id": field_id,
            "error": str(e)
        }
