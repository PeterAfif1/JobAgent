"""Shared LLM client factory.

Clients are built lazily and cached so importing the graph never requires an
API key (the key is only needed when a node actually runs).
"""

from __future__ import annotations

from functools import lru_cache

from langchain_openai import ChatOpenAI

from .config import get_settings


@lru_cache
def reasoning_llm() -> ChatOpenAI:
    """GPT-4o — used for gap analysis and bullet rewriting."""
    s = get_settings()
    return ChatOpenAI(model=s.reasoning_model, api_key=s.openai_api_key, temperature=0.3)


@lru_cache
def scoring_llm() -> ChatOpenAI:
    """GPT-4o-mini — used for fit scoring (cheap, deterministic)."""
    s = get_settings()
    return ChatOpenAI(model=s.scoring_model, api_key=s.openai_api_key, temperature=0)
