"""Google Gemini adapter.

Gemini uses `user`/`model` roles (not `assistant`) and takes the system prompt
as `system_instruction`, so we translate the OpenAI-style messages here.
"""

from app.exceptions import LLMError

from .base import LLMAdapter


class GeminiAdapter(LLMAdapter):
    def __init__(self, api_key: str, model: str = "gemini-1.5-pro"):
        super().__init__(api_key, model)
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        self._genai = genai

    async def chat(self, messages: list[dict]) -> str:
        system_parts = [m["content"] for m in messages if m["role"] == "system"]
        contents = [
            {
                "role": "model" if m["role"] == "assistant" else "user",
                "parts": [m["content"]],
            }
            for m in messages
            if m["role"] in ("user", "assistant")
        ]
        try:
            model = self._genai.GenerativeModel(
                model_name=self.model,
                system_instruction="\n\n".join(system_parts) or None,
            )
            response = await model.generate_content_async(contents)
            return (response.text or "").strip()
        except Exception as exc:  # noqa: BLE001 - surfaced as a structured error
            raise LLMError(f"Gemini request failed: {exc}") from exc
