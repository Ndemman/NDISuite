import pytest
from django.conf import settings
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
import uuid
from unittest.mock import patch, MagicMock


@pytest.fixture
def sample_docs():
    """Fixture to create test document data"""
    class SampleDocs:
        file_a = str(uuid.uuid4())
        file_b = str(uuid.uuid4())
    
    return SampleDocs()


@pytest.fixture
def vector_store(sample_docs):
    """Fixture to create a test vector store with sample documents"""
    
    # Test data
    texts = [
        "This is a test document from file A.",
        "This is another test document from file A.",
        "This is a test document from file B.",
        "This is another test document from file B.",
    ]
    
    # Metadata with file_ids
    metadatas = [
        {"file_id": sample_docs.file_a, "chunk_index": 0},
        {"file_id": sample_docs.file_a, "chunk_index": 1},
        {"file_id": sample_docs.file_b, "chunk_index": 0},
        {"file_id": sample_docs.file_b, "chunk_index": 1},
    ]
    
    # Mock the embeddings to avoid API calls
    mock_embeddings = MagicMock(spec=OpenAIEmbeddings)
    mock_embeddings.embed_documents.return_value = [[0.1] * 1536] * len(texts)
    mock_embeddings.embed_query.return_value = [0.1] * 1536
    
    # Create in-memory vector store
    vector_store = Chroma.from_texts(
        texts=texts,
        metadatas=metadatas,
        embedding=mock_embeddings,
        collection_name="test_collection"
    )
    
    return vector_store


def test_retriever_filters_by_file_id(vector_store, sample_docs):
    """Test that retriever correctly filters by file_id"""
    # Create retriever with filter for file_a
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 5, "filter": {"file_id": {"$in": [sample_docs.file_a]}}}
    )
    
    # Get documents
    docs = retriever.get_relevant_documents("test document")
    
    # Assert all returned documents have file_id = file_a
    assert len(docs) > 0, "No documents retrieved"
    assert all(d.metadata["file_id"] == sample_docs.file_a for d in docs), \
        "Retrieved documents with incorrect file_id"


def test_retriever_empty_results_when_no_match(vector_store):
    """Test that retriever returns empty list when no documents match filter"""
    # Create retriever with filter for non-existent file_id
    non_existent_id = str(uuid.uuid4())
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 5, "filter": {"file_id": {"$in": [non_existent_id]}}}
    )
    
    # Get documents
    docs = retriever.get_relevant_documents("test document")
    
    # Assert no documents returned
    assert len(docs) == 0, "Documents retrieved with non-existent file_id"
