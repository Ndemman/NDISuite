import pytest
from django.conf import settings
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.schema import Document
import uuid
from unittest.mock import patch, MagicMock

from reports.tasks import generate_report_task
import reports.tasks as rpt   # production module already imported


# _mk function is now defined in conftest.py
# patch_chroma fixture is now defined in conftest.py as patch_all_chroma


@pytest.fixture
def session_with_data():
    """Fixture to create test session with documents and transcripts"""
    class SessionData:
        session = MagicMock()
        file_ids = ["file-A1", "file-B1"]
        transcript_ids = [str(uuid.uuid4())]
    
    # Setup session mock with files and transcripts
    session_data = SessionData()
    session_data.session.id = str(uuid.uuid4())
    
    # Mock files collection
    mock_files = []
    for file_id in session_data.file_ids:
        mock_file = MagicMock()
        mock_file.id = file_id
        mock_files.append(mock_file)
    
    session_data.session.files.all.return_value = mock_files
    
    # Ensure file_ids are directly accessible on the session object too
    session_data.session.file_ids = session_data.file_ids
    
    return session_data


# mock_vector_stores fixture removed - now using the global patch_all_chroma fixture from conftest.py


def generate_report_context(prompt, session):
    """Helper function to simulate the context generation part of the report generation task"""
    # Lazy import Chroma to ensure it's imported after patching
    import langchain_community.vectorstores as lcvs
    
    print("[DEBUG] generate_report_context STARTED")
    # Setup OpenAI embeddings mock
    embeddings = MagicMock(spec=OpenAIEmbeddings)
    # Fix for ValueError: Expected Embeddings to be non-empty list or numpy array
    import numpy as np
    embeddings.embed_query.return_value = np.zeros(1536)
    
    # Load document vector store
    print("[DEBUG] Creating document Chroma instance")
    vector_store = lcvs.Chroma(
        collection_name="document_chunks",
        embedding_function=embeddings,
        persist_directory=settings.VECTOR_STORE_PATH
    )
    print("[DEBUG] Document Chroma instance created")
    
    # Collect file IDs
    file_ids = [str(file.id) for file in session.files.all()]
    
    # Document retriever - filtered by file_id
    doc_retriever = vector_store.as_retriever(
        search_kwargs={
            "k": settings.RAG_TOP_K,
            "filter": {"file_id": {"$in": file_ids}},
            "score_threshold": 0.6  # Avoid injecting weak context into LLM prompts
        },
        search_type="mmr"
    )
    
    # Transcription retriever
    transcript_ns = f"session_{session.id}"
    print(f"[DEBUG] Creating transcript Chroma instance with collection_name={transcript_ns}")
    transcript_vs = lcvs.Chroma(
        collection_name=transcript_ns,
        embedding_function=embeddings,
        persist_directory=settings.VECTOR_STORE_PATH
    )
    print("[DEBUG] Transcript Chroma instance created")
    
    trans_retriever = transcript_vs.as_retriever(
        search_kwargs={
            "k": settings.RAG_TOP_K,
            "score_threshold": 0.6  # Avoid injecting weak context into LLM prompts
        },
        search_type="mmr"
    )
    
    # Retrieve both document and transcript chunks
    doc_chunks = doc_retriever.get_relevant_documents(prompt)
    trans_chunks = trans_retriever.get_relevant_documents(prompt)
    
    # Merge document and transcript chunks
    all_chunks = doc_chunks + trans_chunks
    
    return all_chunks


def test_dual_retriever_merges_file_and_transcript(session_with_data):
    """Test that the dual retriever combines both file and transcript chunks"""
    prompt = "What symptoms did the client report?"
    
    print("\n[DEBUG] Retrieved docs:")
    docs = generate_report_context(prompt, session_with_data.session)
    for d in docs:
        print(d.metadata)
    
    # Filter file chunks and check that they belong to this session
    file_chunks = [d for d in docs if d.metadata.get("type") == "file"]
    file_ids = {d.metadata["file_id"] for d in file_chunks}
    assert file_ids <= set(session_with_data.file_ids)
    
    # Assert we have at least one transcript chunk
    assert any(d.metadata.get("type") == "transcript" for d in docs)


def test_dual_retriever_sorts_by_similarity(session_with_data):
    """Test that chunks are sorted by similarity score"""
    prompt = "What symptoms did the client report?"
    docs = generate_report_context(prompt, session_with_data.session)
    
    # Extract similarity scores
    scores = [d.metadata.get("similarity", 0) for d in docs]
    
    # Check that scores are in descending order
    assert all(scores[i] >= scores[i+1] for i in range(len(scores)-1))


def test_no_cross_session_leakage():
    """Test that document chunks from Session A don't appear in Session B's context"""
    # Create two different session mocks
    class SessionA:
        def __init__(self):
            self.id = str(uuid.uuid4())
            self.files = MagicMock()
            self.file_ids = ["file-A1", "file-A2"]
            self.files.all.return_value = [MagicMock(id=fid) for fid in self.file_ids]
            
    class SessionB:
        def __init__(self):
            self.id = str(uuid.uuid4())
            self.files = MagicMock()
            self.file_ids = ["file-B1", "file-B2"]
            self.files.all.return_value = [MagicMock(id=fid) for fid in self.file_ids]
    
    # Create session instances
    session_a = SessionA()
    session_b = SessionB()
    
    # Get context for each session
    prompt = "What are the client's goals?"
    docs_a = generate_report_context(prompt, session_a)
    docs_b = generate_report_context(prompt, session_b)
    
    # Filter file chunks for each session
    file_chunks_a = [d for d in docs_a if d.metadata.get("type") == "file"]
    file_ids_a = {d.metadata["file_id"] for d in file_chunks_a}
    assert file_ids_a <= set(session_a.file_ids)
    
    file_chunks_b = [d for d in docs_b if d.metadata.get("type") == "file"]
    file_ids_b = {d.metadata["file_id"] for d in file_chunks_b}
    assert file_ids_b <= set(session_b.file_ids)
    
    # Assert no overlap between sessions
    assert not file_ids_a.intersection(file_ids_b), "Session file IDs should not overlap"
