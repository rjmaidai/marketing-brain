"""Engine: orchestriert Routing → Prompt-Bau → Antwort.

Zwei Modi:
  • mock=True  → kein API-Call; gibt den vollständig zusammengebauten Prompt
                  (System + Lobe-Bundle + User-Turn) zurück, plus den Routing-Plan.
                  Damit kann die Engine ohne ANTHROPIC_API_KEY inspiziert werden.
  • mock=False → ruft das aktuelle Opus-Modell via Anthropic SDK; nutzt
                  Prompt-Caching auf System-Voice + Lobe-Bundle (45 Köpfe),
                  damit nachgelagerte Anfragen ~90 % günstiger sind.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any

from .catalog import Catalog, load_catalog
from .prompts import (
    build_lobe_bundle,
    build_system_voice,
    build_user_turn,
)
from .router import RoutingPlan, route


@dataclass
class EngineResult:
    """Was die Engine zurückgibt."""

    query: str
    plan: RoutingPlan
    answer: str = ""
    prompt_system: str = ""
    prompt_lobe_bundle_preview: str = ""   # nur Header-Vorschau, nicht der ganze Block
    prompt_user: str = ""
    mode: str = "mock"
    usage: dict[str, Any] = field(default_factory=dict)


class Engine:
    """Die eigentliche Hirn-Maschine."""

    def __init__(
        self,
        catalog: Catalog | None = None,
        *,
        model: str = "claude-opus-4-7",
        max_tokens: int = 16_000,
    ):
        self.catalog = catalog or load_catalog()
        self.model = model
        self.max_tokens = max_tokens
        self._lobe_bundle_cache: str | None = None

    # ---------------------------------------------------------------- public

    def ask(self, query: str, *, mock: bool | None = None) -> EngineResult:
        """Beantworte eine Anfrage.

        Wenn `mock` nicht gesetzt ist und kein ANTHROPIC_API_KEY in der Umgebung
        liegt, läuft die Engine automatisch im Mock-Modus (Prompt-Inspektion).
        """
        plan = route(query, catalog=self.catalog)

        if mock is None:
            mock = not os.environ.get("ANTHROPIC_API_KEY")

        system_voice = build_system_voice()
        user_turn = build_user_turn(query, plan, self.catalog)
        # Der Lobe-Bundle wird *immer* gebaut, damit der Mock-Modus den
        # exakten Live-Prompt-Aufbau zeigt — aber wir kürzen nur die Preview.
        lobe_bundle = self._build_lobe_bundle_cached()
        preview = "\n".join(lobe_bundle.splitlines()[:18]) + "\n…(45 Lobes, gekürzt)"

        result = EngineResult(
            query=query,
            plan=plan,
            prompt_system=system_voice,
            prompt_lobe_bundle_preview=preview,
            prompt_user=user_turn,
            mode="mock" if mock else "live",
        )

        if mock:
            result.answer = self._mock_answer(plan)
            return result

        # ---- live path (anthropic SDK) ----
        try:
            import anthropic
        except ImportError as exc:
            raise RuntimeError(
                "Live-Modus benötigt das 'anthropic'-Paket. "
                "Installiere mit: pip install anthropic"
            ) from exc

        client = anthropic.Anthropic()
        # Prompt-Caching: System ist eine Liste mit zwei text-Blöcken,
        # damit Lobe-Bundle stabil cacht.
        response = client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            system=[
                {
                    "type": "text",
                    "text": system_voice,
                    "cache_control": {"type": "ephemeral"},
                },
                {
                    "type": "text",
                    "text": lobe_bundle,
                    # 1h-TTL: 45 Lobes ändern sich nie.
                    "cache_control": {"type": "ephemeral", "ttl": "1h"},
                },
            ],
            messages=[{"role": "user", "content": user_turn}],
        )
        result.answer = "\n".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        )
        result.usage = {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "cache_creation_input_tokens": getattr(response.usage, "cache_creation_input_tokens", 0),
            "cache_read_input_tokens": getattr(response.usage, "cache_read_input_tokens", 0),
        }
        return result

    # ---------------------------------------------------------------- helpers

    def _build_lobe_bundle_cached(self) -> str:
        if self._lobe_bundle_cache is None:
            self._lobe_bundle_cache = build_lobe_bundle(self.catalog)
        return self._lobe_bundle_cache

    def _mock_answer(self, plan: RoutingPlan) -> str:
        """Hand-gebastelte Mock-Antwort: zeigt, welche Lobes WIE feuern würden.

        Bewusst regelkonform: gibt drei Hebel mit echten Referenzen, das
        Skeptiker-Veto und einen Verzichts-Satz aus dem Material.
        """
        lines: list[str] = []
        lines.append(f"[MOCK-Modus — kein API-Call. Routing: {plan.mode.value}]")
        lines.append("")
        # Diagnose
        diag = self._diagnose_line(plan)
        if diag:
            lines.append(f"Diagnose: {diag}")
            lines.append("")
        # Drei Hebel aus den primären Lobes
        if plan.primary_lobes:
            lines.append("Hebel:")
            for addr in plan.primary_lobes[:3]:
                lobe = self.catalog.get(addr)
                if not lobe:
                    continue
                dna = lobe.one_sentence_dna or "(keine DNA)"
                lines.append(f"  – {addr} ({lobe.author}): {dna} [{addr}.2]")
            lines.append("")
        # Sequenz-Notiz
        if plan.sequence_notes:
            lines.append("Sequenz:")
            for note in plan.sequence_notes[:2]:
                lines.append(f"  – {note}")
            lines.append("")
        # Skeptiker
        if plan.skeptic:
            skeptic = self.catalog.get(plan.skeptic)
            if skeptic:
                lines.append(
                    f"Skeptiker-Veto ({plan.skeptic} — {skeptic.author}): "
                    f"{skeptic.one_sentence_dna or 'siehe ' + plan.skeptic + '.2'} "
                    f"[{plan.skeptic}.2]"
                )
                lines.append("")
        # Offene Achsen
        if plan.open_axes:
            lines.append("Offene Achsen (nicht glätten):")
            for a, b, desc in plan.open_axes[:2]:
                lines.append(f"  – {a} ↔ {b}: {desc}")
            lines.append("")
        # Reim-Brücken
        if plan.rhyme_partners:
            lines.append("Reim-Brücken:")
            for a, b, axis in plan.rhyme_partners[:2]:
                lines.append(f"  – {a} reimt auf {b} ({axis})")
            lines.append("")
        # Pitch-Einzeiler oder Gehirn-Regel, wenn die erste Lobe einen liefert
        first = self.catalog.get(plan.primary_lobes[0]) if plan.primary_lobes else None
        if first:
            pitch = first.pitch_oneliner
            regel = first.gehirn_regel
            if pitch:
                lines.append(f"Pitch ({first.address}.11): „{pitch}\"")
            elif regel:
                lines.append(f"Gehirn-Regel ({first.address}.8): {regel}")
        lines.append("")
        lines.append(
            "Verzicht: Dieses Routing gilt nicht, wenn die Anfrage tatsächlich in einem "
            "anderen Hirn liegt — Skeptiker im Zweifel zuerst anhören, dann erst die "
            "empfehlenden Köpfe sprechen lassen."
        )
        lines.append("")
        lines.append(
            "[Setze ANTHROPIC_API_KEY, um die Engine live laufen zu lassen — das Hirn "
            "übernimmt dann Diagnose & Sequenz selbst, statt aus den DNA-Sätzen zu zitieren.]"
        )
        return "\n".join(lines)

    def _diagnose_line(self, plan: RoutingPlan) -> str:
        mode_to_diagnosis = {
            "crisis": "Krise — erst Cluster diagnostizieren (K1), bevor jemand spricht.",
            "marketing_kette": "Marketing als Schichten-System: Ritson-Vorgate (Diagnose → Strategie → Taktik) statt Sofort-Taktik.",
            "strategie": "Strategie-Frage: 'Im Vergleich zu was?' (Dunford) ist die einzige Frage, die zählt.",
            "audience": "Audience-Frage: was ist der eigentliche Job (JTBD), für den engagiert wird?",
            "distribution": "Distribution-Frage: gibt es PMF (D4)? Ohne PMF läuft kein Loop.",
            "conversion": "Conversion-Frage: gibt es einen hungrigen Markt (C2)? Sonst ist die Offer-Mechanik egal.",
            "retention": "Retention-Frage: die ersten 100 Tage (R2) entscheiden über die nächsten 10 Jahre.",
            "social_media": "Social-Media-Frage: ehrliche Messung (02/04) zuerst, Reflex/Tempo (01) erst danach.",
            "storytelling": "Storytelling-Frage: Form (S1) vs. Stimme (S3) — Storr (S5) ist der Schiedsrichter.",
            "influencer": "Influencer-Frage: was ist das eigentliche Asset, und gehört es dir wirklich (I5)?",
            "meta": "Querfrage: die vier Skeptiker reden zuerst, bevor jemand 'die Lösung' sagt.",
        }
        return mode_to_diagnosis.get(plan.mode.value, "")
