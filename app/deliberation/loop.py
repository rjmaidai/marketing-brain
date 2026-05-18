"""The deliberation loop — how the five agents argue.

Round 1: Strategist diagnoses the layer.
Round 2: Analyst and Creative respond in parallel (empirics vs. craft).
Round 3: Skeptic attacks all prior positions.
Round 4: Judge synthesizes and renders verdict.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

from app.agents import (
    AgentTurn,
    AnalystAgent,
    CreativeAgent,
    JudgeAgent,
    SkepticAgent,
    StrategistAgent,
)
from app.deliberation.schemas import DeliberationResult, TurnPayload
from app.llm import LLMClient, get_llm


@dataclass
class Deliberation:
    llm: LLMClient

    @classmethod
    def default(cls) -> "Deliberation":
        return cls(llm=get_llm())

    async def run(self, question: str, context: str | None = None) -> DeliberationResult:
        framed = question if not context else f"{question}\n\nKontext:\n{context}"

        strategist = StrategistAgent(self.llm)
        analyst = AnalystAgent(self.llm)
        creative = CreativeAgent(self.llm)
        skeptic = SkepticAgent(self.llm)
        judge = JudgeAgent(self.llm)

        turns: list[AgentTurn] = []

        # Round 1 — Strategist opens with diagnosis
        turns.append(await strategist.speak(framed, prior_turns=turns))

        # Round 2 — Analyst and Creative respond in parallel
        analyst_turn, creative_turn = await asyncio.gather(
            analyst.speak(framed, prior_turns=turns),
            creative.speak(framed, prior_turns=turns),
        )
        turns.extend([analyst_turn, creative_turn])

        # Round 3 — Skeptic attacks
        turns.append(await skeptic.speak(framed, prior_turns=turns))

        # Round 4 — Judge synthesizes
        verdict_turn = await judge.speak(framed, prior_turns=turns)
        turns.append(verdict_turn)

        return DeliberationResult(
            question=question,
            turns=[
                TurnPayload(
                    agent=t.agent,
                    role=t.role,
                    consulted_lobes=t.consulted_lobes,
                    content=t.content,
                )
                for t in turns
            ],
            verdict=verdict_turn.content,
        )


async def run_deliberation(question: str, context: str | None = None) -> DeliberationResult:
    return await Deliberation.default().run(question, context)
