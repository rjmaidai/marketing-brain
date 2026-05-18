from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from app.brains import Lobe, lobes_by_ids
from app.llm import LLMClient
from app.llm.client import Message


@dataclass
class AgentTurn:
    agent: str
    role: str
    consulted_lobes: list[str]
    content: str
    meta: dict = field(default_factory=dict)


class BaseAgent(ABC):
    """An agent has a fixed role, a stable set of consulted lobes, and
    produces a single turn per deliberation round."""

    name: str
    role: str
    default_lobes: list[str]

    def __init__(self, llm: LLMClient) -> None:
        self._llm = llm

    @abstractmethod
    def system_prompt(self) -> str: ...

    def _persona_block(self, lobe_ids: list[str]) -> str:
        lobes = lobes_by_ids(lobe_ids)
        if not lobes:
            return ""
        lines = ["Konsultiere diese Lobes als Persona-Stimmen:"]
        for l in lobes:
            lines.append(f"- [{l.id}] {l.name} — {l.dna}")
        return "\n".join(lines)

    async def speak(
        self,
        question: str,
        prior_turns: list[AgentTurn],
        lobe_ids: list[str] | None = None,
    ) -> AgentTurn:
        lobe_ids = lobe_ids or self.default_lobes
        system = f"{self.system_prompt()}\n\n{self._persona_block(lobe_ids)}"

        transcript = "\n\n".join(
            f"### {t.agent} ({t.role})\n{t.content}" for t in prior_turns
        )
        user_content = (
            f"FRAGE:\n{question}\n\n"
            f"BISHERIGE RUNDE:\n{transcript or '(noch leer — du bist der erste Sprecher)'}\n\n"
            f"Sprich jetzt als {self.name}. Sei knapp, nimm Position, "
            f"benenne die Lobes, deren Logik du anwendest."
        )

        content = await self._llm.complete(
            system=system,
            messages=[Message(role="user", content=user_content)],
            max_tokens=900,
        )
        return AgentTurn(
            agent=self.name,
            role=self.role,
            consulted_lobes=lobe_ids,
            content=content,
        )
