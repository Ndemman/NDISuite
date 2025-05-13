import pytest

def test_patch_chroma_minimal():
    """
    A minimal test to verify that the Chroma patch is working correctly.
    This test should show debug logs that confirm the patch is active.
    """
    from langchain_community.vectorstores import Chroma
    Chroma(collection_name="document_chunks").as_retriever()
