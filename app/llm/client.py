from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from app.config import settings


@dataclass
class Message:
    role: str  # "user" | "assistant"
    content: str


class LLMClient(Protocol):
    async def complete(
        self,
        system: str,
        messages: list[Message],
        max_tokens: int = 1024,
    ) -> str: ...


class MockLLM:
    """Deterministic stand-in so the whole stack runs without API keys."""

    async def complete(
        self,
        system: str,
        messages: list[Message],
        max_tokens: int = 1024,
    ) -> str:
        last = messages[-1].content if messages else ""
        head = system.splitlines()[0] if system else "agent"
        return (
            f"[MOCK · {head[:80]}]\n"
            f"Eingabe: {last[:200]}\n"
            "→ Hier würde der Agent seine Position formulieren und die "
            "relevanten Lobes namentlich konsultieren."
        )


def get_llm() -> LLMClient:
    if settings.llm_provider == "anthropic":
        from app.llm.anthropic_client import AnthropicLLM

        return AnthropicLLM()
    return MockLLM()
