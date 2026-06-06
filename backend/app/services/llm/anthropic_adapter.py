"""Anthropic adapter.

Anthropic takes the system prompt as a separate `system` argument and only
accepts user/assistant turns in `messages`, so we split them out here.
"""

from app.exceptions import LLMError

from .base import LLMAdapter


class AnthropicAdapter(LLMAdapter):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6"):
        super().__init__(api_key, model)
        from anthropic import AsyncAnthropic

        self._client = AsyncAnthropic(api_key=api_key)

    async def chat(self, messages: list[dict]) -> str:
        system_parts = [m["content"] for m in messages if m["role"] == "system"]
        conversation = [
            {"role": m["role"], "content": m["content"]}
            for m in messages
            if m["role"] in ("user", "assistant")
        ]
        try:
            response = await self._client.messages.create(
                model=self.model,
                max_tokens=1024,
                system="\n\n".join(system_parts) or None,
                messages=conversation,
            )
            return "".join(
                block.text for block in response.content if block.type == "text"
            ).strip()
        except Exception as exc:  # noqa: BLE001 - surfaced as a structured error
            raise LLMError(f"Anthropic request failed: {exc}") from exc
