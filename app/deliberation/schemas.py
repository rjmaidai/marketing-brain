from __future__ import annotations

from pydantic import BaseModel, Field


class DeliberationRequest(BaseModel):
    question: str = Field(..., description="Marketing-Frage / Brief / Problem.")
    context: str | None = Field(None, description="Optionaler Zusatzkontext (Brand, Audience, Daten).")


class TurnPayload(BaseModel):
    agent: str
    role: str
    consulted_lobes: list[str]
    content: str


class DeliberationResult(BaseModel):
    question: str
    turns: list[TurnPayload]
    verdict: str
