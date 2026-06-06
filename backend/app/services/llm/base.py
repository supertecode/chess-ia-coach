"""Abstract LLM adapter interface.

Every provider implements the same `chat()` coroutine, so the rest of the app
is provider-agnostic. Switching providers only requires changing `.env`.
"""

from abc import ABC, abstractmethod


class LLMAdapter(ABC):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    @abstractmethod
    async def chat(self, messages: list[dict]) -> str:
        """Send OpenAI-style messages and return the assistant reply text.

        `messages` is a list of `{"role": "system|user|assistant",
        "content": str}` dicts. Adapters whose native API differs (e.g.
        Anthropic, Gemini) translate this shape internally.
        """
        raise NotImplementedError
