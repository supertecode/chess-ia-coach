"""LLM adapter factory.

`get_llm_adapter()` reads `LLM_PROVIDER` from settings and returns the matching
adapter, validating that the required API key is present. The instance is cached
so the underlying SDK client is reused across requests.
"""

from functools import lru_cache

from app.config import Settings, get_settings
from app.exceptions import AppError

from .anthropic_adapter import AnthropicAdapter
from .base import LLMAdapter
from .gemini_adapter import GeminiAdapter
from .groq_adapter import GroqAdapter
from .openai_adapter import OpenAIAdapter


class LLMConfigError(AppError):
    def __init__(self, message: str):
        super().__init__(message, "LLM_CONFIG_ERROR", status_code=500)


def _build_adapter(settings: Settings) -> LLMAdapter:
    provider = settings.llm_provider.lower().strip()

    if provider == "groq":
        if not settings.groq_api_key:
            raise LLMConfigError("GROQ_API_KEY is not set.")
        return GroqAdapter(settings.groq_api_key, settings.groq_model)

    if provider == "openai":
        if not settings.openai_api_key:
            raise LLMConfigError("OPENAI_API_KEY is not set.")
        return OpenAIAdapter(settings.openai_api_key, settings.openai_model)

    if provider == "anthropic":
        if not settings.anthropic_api_key:
            raise LLMConfigError("ANTHROPIC_API_KEY is not set.")
        return AnthropicAdapter(settings.anthropic_api_key, settings.anthropic_model)

    if provider == "gemini":
        if not settings.gemini_api_key:
            raise LLMConfigError("GEMINI_API_KEY is not set.")
        return GeminiAdapter(settings.gemini_api_key, settings.gemini_model)

    raise LLMConfigError(
        f"Unknown LLM_PROVIDER '{settings.llm_provider}'. "
        "Use one of: groq, openai, anthropic, gemini."
    )


@lru_cache
def get_llm_adapter() -> LLMAdapter:
    """Cached adapter singleton selected from settings."""
    return _build_adapter(get_settings())
