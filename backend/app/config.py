"""Application settings loaded from environment / .env.

Centralizing config here keeps the rest of the codebase free of `os.getenv`
calls and makes it trivial to swap the LLM provider via env vars only.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # LLM provider selection: groq | openai | anthropic | gemini
    llm_provider: str = "groq"

    # API keys (only the one matching llm_provider is required at runtime)
    groq_api_key: str | None = None
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None

    # Model overrides (sensible defaults per provider)
    groq_model: str = "llama-3.3-70b-versatile"
    openai_model: str = "gpt-4o"
    anthropic_model: str = "claude-sonnet-4-6"
    gemini_model: str = "gemini-1.5-pro"

    # Stockfish
    stockfish_path: str = "/usr/local/bin/stockfish"
    stockfish_default_depth: int = 15

    # Server
    backend_port: int = 8000
    frontend_url: str = "http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
