import pytest, sys
import logging
from unittest.mock import MagicMock
from langchain.schema import Document

logger = logging.getLogger(__name__)

def _mk(text, idx, fid, kind="file"):
    return Document(
        page_content=text,
        metadata={"file_id": fid, "type": kind, "similarity": 0.9 - 0.05*idx},
    )

def pytest_configure():
    """Patch Chroma before any test modules are collected, guaranteeing the mock is used for all imports."""
    import langchain.vectorstores as lvs
    import langchain_community.vectorstores as lcvs
    
    class ChromaMock:
        """Mock for Chroma that provides session-specific state."""
        def __init__(self, *, collection_name=None, **_):
            self.collection_name = collection_name

        def as_retriever(self, *, search_kwargs=None, **_):
            # capture **this call's** filter; default to "no filter"
            filt = (search_kwargs or {}).get("filter", {})
            allowed_ids = set(filt.get("file_id", {}).get("$in", []))

            # Work out what kind of collection we're mocking
            is_transcript = self.collection_name and self.collection_name.startswith("session_")
            session_id_in_name = self.collection_name.split("_", 1)[1] if is_transcript else None

            def _get_relevant(_prompt):
                docs = []
                if is_transcript:
                    # only add a transcript chunk if *this* session asked for it
                    if not allowed_ids or session_id_in_name in allowed_ids:
                        docs.append(
                            _mk(
                                f"transcript chunk for session {session_id_in_name}",
                                0,
                                session_id_in_name,        # file_id == session-specific tag
                                kind="transcript",
                            )
                        )
                else:  # document_chunks
                    for fid in allowed_ids:
                        docs.append(_mk(f"chunk from {fid}", 0, fid, kind="file"))
                return docs

            m = MagicMock()
            m.get_relevant_documents.side_effect = _get_relevant
            return m

    def chroma_factory(*args, **kwargs):
        """Factory function that returns a ChromaMock instance."""
        return ChromaMock(**kwargs)

    # Overwrite at the source modules - before any test imports happen
    lvs.Chroma = chroma_factory
    lcvs.Chroma = chroma_factory
    sys.modules["langchain.vectorstores"].Chroma = chroma_factory
    sys.modules["langchain_community.vectorstores"].Chroma = chroma_factory
    
    # Patch the reference in the test_dual_retriever module directly
    try:
        import importlib
        # Try to resolve the module path used by pytest
        # First try the direct path
        try:
            tdr_mod = importlib.import_module("ndisuite.tests.rag.test_dual_retriever")
            tdr_mod.Chroma = chroma_factory
            logger.debug("Patched Chroma in ndisuite.tests.rag.test_dual_retriever")
        except ImportError:
            # If that fails, try with app prefix (used in container)
            try:
                tdr_mod = importlib.import_module("app.ndisuite.tests.rag.test_dual_retriever")
                tdr_mod.Chroma = chroma_factory
                logger.debug("Patched Chroma in app.ndisuite.tests.rag.test_dual_retriever")
            except ImportError:
                logger.debug("Could not find test_dual_retriever module to patch directly")
    except Exception as e:
        logger.debug(f"Error patching test_dual_retriever module: {e}")
    
    logger.debug("Chroma patched with ChromaMock during pytest_configure")


@pytest.hookimpl(tryfirst=True)
def pytest_runtest_setup(item):
    """Verify that Chroma is still patched before each test runs."""
    # Local import to ensure we're checking the current state
    import langchain_community.vectorstores as lcvs
    assert callable(lcvs.Chroma), "Chroma patch lost!"




