import os
import logging
import time
from django.utils import timezone

import openai
from openai import OpenAI
from dotenv import load_dotenv

from .models import RefinementSession, HighlightedSection, RefiningInstruction, RefinedContent
from session_manager.models import OutputField

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class RefinementService:
    """Service for handling content refinement using OpenAI"""
    
    @staticmethod
    def start_refinement_session(output_field):
        """Start a new refinement session for an output field"""
        session = RefinementSession.objects.create(
            output_field=output_field,
            status='ACTIVE'
        )
        
        logger.info(f"Started refinement session {session.id} for output field {output_field.id}")
        return session
    
    @staticmethod
    def create_highlighted_section(refinement_session, selected_text, start_index, end_index):
        """Create a highlighted section for refinement"""
        highlighted_section = HighlightedSection.objects.create(
            refinement_session=refinement_session,
            selected_text=selected_text,
            start_index=start_index,
            end_index=end_index
        )
        
        logger.info(f"Created highlighted section {highlighted_section.id} in session {refinement_session.id}")
        return highlighted_section
    
    @staticmethod
    def submit_refinement_instruction(highlighted_section, instruction_text):
        """Submit an instruction for refining a highlighted section"""
        refining_instruction = RefiningInstruction.objects.create(
            highlighted_section=highlighted_section,
            instruction_text=instruction_text,
            status='PENDING',
            model=os.getenv('REFINING_MODEL', 'gpt-3.5-turbo')
        )
        
        logger.info(f"Created refining instruction {refining_instruction.id}")
        return refining_instruction
    
    @staticmethod
    def process_refinement(instruction_id):
        """Process a refinement instruction"""
        try:
            instruction = RefiningInstruction.objects.get(id=instruction_id)
            
            # Update status
            instruction.status = 'IN_PROGRESS'
            instruction.save()
            
            # Start timing
            start_time = time.time()
            
            # Get context from output field
            highlighted_section = instruction.highlighted_section
            refinement_session = highlighted_section.refinement_session
            output_field = refinement_session.output_field
            
            # Get the original text to refine
            original_text = highlighted_section.selected_text
            
            # Prepare prompt
            prompt = f"""
            I have a section of text that needs to be refined according to specific instructions.
            
            ORIGINAL TEXT:
            {original_text}
            
            REFINEMENT INSTRUCTIONS:
            {instruction.instruction_text}
            
            Please provide an improved version of the text that follows these instructions. 
            Maintain the same general meaning but apply the requested changes.
            """
            
            # Call OpenAI API
            response = client.chat.completions.create(
                model=instruction.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that refines text based on instructions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Calculate processing time
            end_time = time.time()
            processing_time_ms = int((end_time - start_time) * 1000)
            
            # Extract refined content
            refined_text = response.choices[0].message.content.strip()
            
            # Create refined content
            refined_content = RefinedContent.objects.create(
                refining_instruction=instruction,
                original_text=original_text,
                refined_text=refined_text
            )
            
            # Update instruction status
            instruction.status = 'COMPLETED'
            instruction.completed_at = timezone.now()
            instruction.save()
            
            logger.info(f"Completed refinement instruction {instruction.id}, processing time: {processing_time_ms}ms")
            return refined_content
            
        except Exception as e:
            logger.error(f"Error processing refinement instruction {instruction_id}: {str(e)}")
            
            # Update instruction status
            try:
                instruction.status = 'FAILED'
                instruction.error_message = str(e)
                instruction.save()
            except:
                pass
                
            raise
    
    @staticmethod
    def apply_refinements(output_field_id):
        """Apply all completed refinements to an output field"""
        output_field = OutputField.objects.get(id=output_field_id)
        original_content = output_field.generated_content
        
        # Get all completed refinements
        refinement_sessions = RefinementSession.objects.filter(output_field=output_field)
        applied_refinements = []
        
        for session in refinement_sessions:
            for highlighted_section in session.highlighted_sections.all():
                for instruction in highlighted_section.refining_instructions.filter(status='COMPLETED'):
                    try:
                        refined_content = instruction.refined_content
                        applied_refinements.append({
                            'start_index': highlighted_section.start_index,
                            'end_index': highlighted_section.end_index,
                            'original_text': refined_content.original_text,
                            'refined_text': refined_content.refined_text
                        })
                    except RefiningInstruction.refined_content.RelatedObjectDoesNotExist:
                        continue
        
        # Sort refinements by start index (descending to avoid index shifting)
        applied_refinements.sort(key=lambda x: x['start_index'], reverse=True)
        
        # Apply refinements
        content = original_content
        for refinement in applied_refinements:
            start = refinement['start_index']
            end = refinement['end_index']
            refined_text = refinement['refined_text']
            
            # Replace the text
            content = content[:start] + refined_text + content[end:]
        
        # Update output field
        output_field.generated_content = content
        output_field.save()
        
        # Mark refinement sessions as completed
        for session in refinement_sessions:
            session.status = 'COMPLETED'
            session.completed_at = timezone.now()
            session.save()
        
        logger.info(f"Applied {len(applied_refinements)} refinements to output field {output_field_id}")
        return content
