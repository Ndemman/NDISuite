"""
Test to verify that RAG retrieval doesn't leak data between different sessions.
"""

import pytest
from unittest.mock import patch, MagicMock
import numpy as np
from django.conf import settings
from langchain.schema import Document
from langchain_community.embeddings import OpenAIEmbeddings

from reports.models import Session, ReportTemplate
from files.models import InputFile
from transcription.models import Transcript
from reports.tasks import generate_report_context


@pytest.fixture
def two_sessions_with_data():
    """Create two sessions with different files and transcripts for testing isolation."""
    # Session A data
    template_a = ReportTemplate.objects.create(
        name="Template A",
        structure={"section1": {"label": "Section 1", "generation_prompt": "Test prompt"}}
    )
    session_a = Session.objects.create(name="Session A", template=template_a)
    file_a = InputFile.objects.create(
        session=session_a,
        original_filename="file_a.pdf",
        file_type="pdf",
        status="processed"
    )
    file_a2 = InputFile.objects.create(
        session=session_a,
        original_filename="file_a2.pdf",
        file_type="pdf",
        status="processed"
    )
    transcript_a = Transcript.objects.create(
        session=session_a,
        source_file=file_a,
        text="Transcript content for session A",
        status="completed"
    )
    
    # Session B data
    template_b = ReportTemplate.objects.create(
        name="Template B",
        structure={"section1": {"label": "Section 1", "generation_prompt": "Test prompt"}}
    )
    session_b = Session.objects.create(name="Session B", template=template_b)
    file_b = InputFile.objects.create(
        session=session_b,
        original_filename="file_b.pdf",
        file_type="pdf",
        status="processed"
    )
    transcript_b = Transcript.objects.create(
        session=session_b, 
        text="Transcript content for session B",
        status="completed"
    )
    
    return {
        "session_a": session_a,
        "session_a_file_ids": [str(file_a.id), str(file_a2.id)],
        "session_a_transcript_id": str(transcript_a.id),
        "session_b": session_b,
        "session_b_file_id": str(file_b.id),
        "session_b_transcript_id": str(transcript_b.id)
    }


@pytest.fixture
def mock_vector_stores_for_isolation_test(two_sessions_with_data):
    """Mock Chroma vector stores for testing session isolation."""
    with patch('langchain.vectorstores.Chroma') as mock_chroma:
        from langchain.schema import Document
        import numpy as np
        
        # Helper function to create proper Document objects
        def make_doc(text, idx, fid, doc_type="file", session_id=None):
            metadata = {
                "file_id": fid,
                "type": doc_type,
                "similarity": 0.9 - 0.1*idx,
                "source_type": "pdf" if doc_type == "file" else None,
            }
            if session_id:
                metadata["session_id"] = session_id
            return Document(
                page_content=text,
                metadata=metadata
            )
        
        # Create mock for document chunks vectorstore
        doc_vs_instance = MagicMock()
        
        # Fix for ValueError: Expected Embeddings to be non-empty list
        doc_vs_instance._embedding_function = MagicMock()
        doc_vs_instance._embedding_function.embed_query.return_value = np.zeros(1536)
        
        # Create session A documents
        session_a_doc_chunks = [
            make_doc(f"Content from session A file {fid}", idx, fid, "file", str(two_sessions_with_data["session_a"].id))
            for idx, fid in enumerate(two_sessions_with_data["session_a_file_ids"])
        ]
        
        # Create session B documents
        session_b_doc_chunks = [
            make_doc(f"Content from session B file {two_sessions_with_data['session_b_file_id']}", 0, 
                    two_sessions_with_data["session_b_file_id"], "file", str(two_sessions_with_data["session_b"].id))
        ]
        
        # Setup document retriever - returns only appropriate session's files based on filter
        doc_retriever = MagicMock()
        
        def mock_doc_get_relevant(prompt, **kwargs):
            filter_dict = kwargs.get('filter', {})
            file_id_filter = filter_dict.get('file_id', {}).get('$in', [])
            
            # Return only documents whose file_ids are in the filter
            if set(file_id_filter) == set(two_sessions_with_data["session_a_file_ids"]):
                return session_a_doc_chunks
            elif two_sessions_with_data["session_b_file_id"] in file_id_filter:
                return session_b_doc_chunks
            return []
            
        doc_retriever.get_relevant_documents.side_effect = mock_doc_get_relevant
        doc_vs_instance.as_retriever.return_value = doc_retriever
        
        # Create mock for transcript vectorstores (one per session)
        transcript_stores = {}
        
        for session_key, transcript_id in [
            ("session_a", two_sessions_with_data["session_a_transcript_id"]),
            ("session_b", two_sessions_with_data["session_b_transcript_id"])
        ]:
            # Create session-specific transcript store
            trans_vs = MagicMock()
            trans_vs._embedding_function = MagicMock()
            trans_vs._embedding_function.embed_query.return_value = np.zeros(1536)
            
            # Create transcript chunks for this session
            session = two_sessions_with_data[session_key]
            trans_chunks = [
                make_doc(
                    f"Transcript content for {session_key}",
                    0,
                    f"file-{session_key[-1].upper()}",  # "file-A" or "file-B"
                    "transcript",
                    str(session.id)
                )
            ]
            
            # Add transcript-specific metadata
            for chunk in trans_chunks:
                chunk.metadata["transcript_id"] = transcript_id
            
            # Setup retriever to check the session_id filter
            trans_retriever = MagicMock()
            
            def make_trans_get_relevant(session_id):
                def mock_trans_get_relevant(prompt, **kwargs):
                    filter_dict = kwargs.get('filter', {})
                    if filter_dict.get('session_id') == session_id:
                        return trans_chunks
                    return []  # Return nothing if filter doesn't match
                return mock_trans_get_relevant
                
            trans_retriever.get_relevant_documents.side_effect = make_trans_get_relevant(str(session.id))
            trans_vs.as_retriever.return_value = trans_retriever
            
            # Store the transcript store for this session
            transcript_stores[f"session_{session.id}"] = trans_vs
        
        # Configure the Chroma mock to return different instances based on collection_name
        def mock_chroma_side_effect(**kwargs):
            collection_name = kwargs.get('collection_name', '')
            if collection_name == 'document_chunks':
                return doc_vs_instance
            elif collection_name in transcript_stores:
                return transcript_stores[collection_name]
            return MagicMock()
        
        mock_chroma.side_effect = mock_chroma_side_effect
        
        yield mock_chroma


def test_no_cross_session_leakage(mock_vector_stores_for_isolation_test, two_sessions_with_data):
    """Test that RAG only retrieves documents and transcripts from the current session."""
    # Mock OpenAI embeddings
    with patch('langchain.embeddings.openai.OpenAIEmbeddings') as mock_embeddings:
        mock_embeddings.return_value.embed_query.return_value = np.zeros(1536)
        
        # Get contexts for both sessions
        prompt = "What information is available?"
        
        # Session A context
        session_a_docs = generate_report_context(prompt, two_sessions_with_data["session_a"])
        
        # Session B context
        session_b_docs = generate_report_context(prompt, two_sessions_with_data["session_b"])
        
        # Extract session IDs from retrieved docs
        session_a_doc_sessions = {
            d.metadata.get("session_id") for d in session_a_docs 
            if d.metadata.get("session_id")
        }
        
        session_b_doc_sessions = {
            d.metadata.get("session_id") for d in session_b_docs 
            if d.metadata.get("session_id")
        }
        
        # Extract file IDs from retrieved docs
        session_a_file_ids = {
            d.metadata.get("file_id") for d in session_a_docs 
            if d.metadata.get("file_id")
        }
        
        session_b_file_ids = {
            d.metadata.get("file_id") for d in session_b_docs 
            if d.metadata.get("file_id")
        }
        
        # ISOLATION TESTS
        
        # 1. Session A should only have docs from session A
        if session_a_doc_sessions:  # Some docs might not have session_id
            assert str(two_sessions_with_data["session_a"].id) in session_a_doc_sessions
            assert str(two_sessions_with_data["session_b"].id) not in session_a_doc_sessions
        
        # 2. Session B should only have docs from session B
        if session_b_doc_sessions:
            assert str(two_sessions_with_data["session_b"].id) in session_b_doc_sessions
            assert str(two_sessions_with_data["session_a"].id) not in session_b_doc_sessions
        
        # 3. Session A should only have files from session A
        for file_id in two_sessions_with_data["session_a_file_ids"]:
            assert file_id in session_a_file_ids
        assert two_sessions_with_data["session_b_file_id"] not in session_a_file_ids
        
        # 4. Session B should only have files from session B
        assert two_sessions_with_data["session_b_file_id"] in session_b_file_ids
        for file_id in two_sessions_with_data["session_a_file_ids"]:
            assert file_id not in session_b_file_ids
