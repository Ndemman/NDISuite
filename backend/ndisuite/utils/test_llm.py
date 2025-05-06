import importlib

from django.conf import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chat_models import ChatOpenAI


def test_get_llm_returns_gemma_when_key_present(monkeypatch):
    monkeypatch.setattr(settings, "GEMMA_API_KEY", "dummy_key")
    monkeypatch.setattr(settings, "GENERATION_MODEL_GEMMA", "gemma-27b")

    llm_module = importlib.reload(importlib.import_module("ndisuite.utils.llm"))
    llm = llm_module.get_llm()

    assert isinstance(llm, ChatGoogleGenerativeAI)


def test_get_llm_falls_back_to_openai(monkeypatch):
    monkeypatch.setattr(settings, "GEMMA_API_KEY", "")
    monkeypatch.setattr(settings, "GENERATION_MODEL", "gpt-4o")

    llm_module = importlib.reload(importlib.import_module("ndisuite.utils.llm"))
    llm = llm_module.get_llm()

    assert isinstance(llm, ChatOpenAI)
