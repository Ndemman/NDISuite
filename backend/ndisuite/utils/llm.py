"""Utility to provide the appropriate LangChain chat LLM (Gemma or OpenAI)."""
from typing import Any
from django.conf import settings


def get_llm(**kwargs: Any):
    """Return a LangChain-compatible chat model instance.

    Priority:
    1. Use Gemma 27B if `GEMMA_API_KEY` present.
    2. Otherwise fallback to OpenAI model defined in settings.
    """
    if settings.GEMMA_API_KEY:
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=settings.GENERATION_MODEL_GEMMA,
            google_api_key=settings.GEMMA_API_KEY,
            **kwargs,
        )

    from langchain.chat_models import ChatOpenAI

    return ChatOpenAI(
        model=settings.GENERATION_MODEL,
        openai_api_key=settings.OPENAI_API_KEY,
        **kwargs,
    )
