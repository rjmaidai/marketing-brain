from __future__ import annotations

from anthropic import AsyncAnthropic

from app.config import settings
from app.llm.client import Message


class AnthropicLLM:
    def __init__(self) -> None:
        self._client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model

    async def complete(
        self,
        system: str,
        messages: list[Message],
        max_tokens: int = 1024,
    ) -> str:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": m.role, "content": m.content} for m in messages],
        )
        return "".join(block.text for block in response.content if block.type == "text")
