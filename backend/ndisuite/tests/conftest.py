import sys
import pytest
from unittest.mock import MagicMock
from langchain.schema import Document

###############################################################################
# 0.  Build a single mock factory
###############################################################################
def _mk(text, idx, fid, kind="file"):
    return Document(
        page_content=text,
        metadata={
            "file_id": fid,
            "type": kind,
            "similarity": 0.9 - 0.05 * idx,
        },
    )

# Sample documents for different paths
file_docs = [_mk("chunk from file", 0, "file-A1", "file"), _mk("chunk from file", 1, "file-B1", "file")]
trans_docs = [_mk("chunk from transcript", 1, None, "transcript")]

class _FilteredRetriever:
    def __init__(self, docs, search_kwargs):
        self._docs, self._kw = docs, search_kwargs or {}

    def get_relevant_documents(self, _prompt):
        # For transcript retriever (no file_id filter)
        if "filter" not in self._kw or "file_id" not in self._kw.get("filter", {}):
            print("[DEBUG] No file_id filter found, returning all docs")
            return self._docs
            
        # For document retriever with file_id filter
        allowed = set(
            self._kw.get("filter", {})
                    .get("file_id", {})
                    .get("$in", [])
        )
        print("[DEBUG] allowed file_ids filter:", allowed)
        return [d for d in self._docs if d.metadata.get("file_id") in allowed]

def _chroma_factory(*_a, **kw):
    print(f"[DEBUG] Chroma factory called — kwargs: {kw}")
    from types import SimpleNamespace
    
    def _as_retriever(**search_kwargs):
        print("[DEBUG] as_retriever called with:", search_kwargs)
        # Unwrap nested search_kwargs if present
        search_kwargs = search_kwargs.get("search_kwargs", search_kwargs)
        docs = file_docs if kw.get("collection_name") == "document_chunks" else trans_docs
        return _FilteredRetriever(docs, search_kwargs)
        
    vs = SimpleNamespace(as_retriever=_as_retriever)
    return vs

###############################################################################
# 1.  Patch *once* at session-start, before any test file is imported
###############################################################################
def pytest_sessionstart(session):
    """Patch Chroma before any test modules are imported."""
    # overwrite in the two source modules
    import langchain.vectorstores as lcv
    import langchain_community.vectorstores as lccv
    import reports.tasks as rpt

    lcv.Chroma = _chroma_factory
    lccv.Chroma = _chroma_factory
    rpt.Chroma = _chroma_factory

    # expose in sys.modules so any later `from … import Chroma`
    # receives the factory immediately
    sys.modules["langchain.vectorstores"].Chroma = _chroma_factory
    sys.modules["langchain_community.vectorstores"].Chroma = _chroma_factory

###############################################################################
# 2.  Sanity-check – fails fast if someone un-patches Chroma
###############################################################################
@pytest.hookimpl(tryfirst=True)
def pytest_runtest_setup(item):
    """Verify that Chroma is still patched before each test runs."""
    from langchain_community.vectorstores import Chroma
    assert Chroma is _chroma_factory, "Chroma patch lost!"

@pytest.fixture(autouse=True, scope="session")
def patch_all_chroma():
    """Fixture for comprehensive patching of Chroma instances.
    Note that most patching is done at module level before this fixture.
    This fixture is maintained for compatibility and cleanup."""
    from pytest import MonkeyPatch
    mp = MonkeyPatch()

    # Additional safety: patch any newly imported modules during the test run
    patch_targets = [
        "langchain.vectorstores.Chroma",
        "langchain_community.vectorstores.Chroma",
        "reports.tasks.Chroma",
        "ndisuite.tests.rag.test_dual_retriever.Chroma",
        "ndisuite.tests.rag.conftest.Chroma",
        "ndisuite.tests.conftest.Chroma",
        "ndisuite.tests.rag.test_utils.Chroma",
        "ndisuite.rag.retrievers.Chroma",
    ]

    for path in patch_targets:
        try:
            mp.setattr(path, chroma_factory, raising=True)
        except Exception:
            print(f"[WARN] Patch path failed: {path}")
    
    print("[DEBUG] Session-scoped patch_all_chroma fixture running")

    yield
    # Clean up at the end of the session
    mp.undo()
    print("[DEBUG] Session-scoped patch_all_chroma fixture cleanup complete")
