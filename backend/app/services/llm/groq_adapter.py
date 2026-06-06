"""Groq adapter (default provider)."""

from app.exceptions import LLMError

from .base import LLMAdapter


class GroqAdapter(LLMAdapter):
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        super().__init__(api_key, model)
        from groq import AsyncGroq

        self._client = AsyncGroq(api_key=api_key)

    async def chat(self, messages: list[dict]) -> str:
        try:
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.5,
            )
            return (response.choices[0].message.content or "").strip()
        except Exception as exc:  # noqa: BLE001 - surfaced as a structured error
            raise LLMError(f"Groq request failed: {exc}") from exc
