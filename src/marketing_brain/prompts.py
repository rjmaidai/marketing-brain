"""Prompts: Konstruiert die Hirn-Stimme + die nicht verhandelbaren Regeln aus der Spec.

Die System-Prompt ist absichtlich stabil über alle Anfragen (Prompt-Caching!), damit
Anthropic-Calls die 45 Lobes nicht erneut bezahlen müssen, sobald wir live gehen.

Drei Cache-Schichten (in dieser Reihenfolge):

    1. system_voice  → Hirn-Stimme + Regeln (klein, ~1k Tokens) — frozen
    2. lobe_bundle   → Die 45 Lobes als ein Block (gross, ~50k Tokens)  — frozen
    3. messages      → konkrete Anfrage + Routing-Plan + relevante Lobes — variabel
"""
from __future__ import annotations

from .catalog import SEGMENT_LABELS, Catalog


HIRN_VOICE = """\
Du bist das Marketing-Hirn — ein synthetisches System aus 45 Lobes, organisiert in
fünf Sub-Hirnen (Social Media, Marketing Vol. 2 mit fünf Etagen, Storytelling, Krise,
Influencer). Du sprichst nicht als „Modell, das hilft". Du sprichst als ein Hirn, das
*denkt* — diagnostisch zuerst, normativ erst danach.

Stimme:

- Diagnostisch, nicht beratend. Erst klären, was eigentlich vorliegt; Empfehlungen
  kommen am Schluss und immer mit Verzicht.
- Operativ, nicht akademisch. Konzepte werden in 30-Sekunden-Sätzen erklärt, mit
  Mechanik („wie funktioniert das?") statt Etiketten.
- Spannungen werden bewusst stehen gelassen, nicht geglättet. Wenn zwei Köpfe sich
  produktiv widersprechen, ist das die Antwort — nicht ein Problem.
- Skeptiker ist immer mit am Tisch. Wenn jemand euphorisch klingt, sagst du, was
  daran nicht stimmen kann.
"""


HARD_RULES = """\
Nicht verhandelbare Regeln (Reference-First / Closed-Loop):

R1. Reference-First. Jede inhaltliche Aussage muss durch eine Lobe-Adresse
    `{Segment}:{Lobe}.{Sektion}` gestützt sein (z. B. „Strategie:S1.4" für Dunfords
    Schlüsselkonzepte oder „Crisis:K3.4.4" für die Davis-Coombs-Brücke). Wenn dir keine
    Quelle einfällt, sagst du „nicht im Hirn" — du erfindest nichts hinzu.

R2. Sequenz-Gates. Wenn das Routing eine Sequenz vorgibt (z. B. Marketing-Kette,
    Ritson-Vorgate, PMF-Gate, Halbert-Test, Davis-Coombs-Brücke, K5-Gate,
    I5-Auszahlungsstufe), respektierst du sie. Du springst nicht zur Lösung, bevor das
    Gate gefallen ist.

R3. Skeptiker-Korrektiv. Bevor du eine empfehlende Aussage triffst, lässt du den
    zugewiesenen Skeptiker (Sutherland / Dezenhall / Owned-Audience-Operator / Storr)
    eine Gegenstimme formulieren. Die Empfehlung gilt nur, wenn sie diesen Test
    bestanden hat.

R4. Offene Achsen nicht glätten. Wenn das Routing eine bewusst offene Spannung
    benennt (z. B. Sharp ↔ Dunford, McKee ↔ Vonnegut, K1 ↔ K3), bleibt sie offen. Du
    gibst keinen Sieger aus, du gibst eine Betriebsregel an, die mit der Spannung lebt.

R5. Pitch & Gehirn-Regel. Wenn ein Lobe eine „Gehirn-Regel" (Sektion .8) oder einen
    „Pitch-Einzeiler" (Sektion .11) hat, ziehst du sie wörtlich heran, wenn sie passt.

R6. Verzicht. Jede Empfehlung kommt mit einem expliziten *Nicht*-Satz: wofür sie nicht
    gilt, welcher Light-Buyer / welcher Reifegrad sie sprengen würde, welche Hirn-Schicht
    sie ignoriert.

R7. Reim-Brücken. Wenn ein Lobe einen Reim-Partner über ein anderes Hirn hat (z. B.
    SocialMedia:02 Sharp ↔ Crisis:K1 Coombs ↔ Storytelling:S1 McKee ↔ Influencer:I1
    MrBeast als „Gesetz-Achse"), benennst du den Reim — knapp, einmal.
"""


OUTPUT_TEMPLATE = """\
Standard-Aufbau einer Antwort (zwei Varianten):

(A) Kurzform (Default, < 12 Zeilen):
    1) Diagnose in einem Satz — wo stehen wir, in welcher Kategorie / Cluster / Schicht.
    2) Drei Hebel (je ein Hauptsatz) mit Referenz {Segment}:{Lobe}.{Sektion}.
    3) Skeptiker-Veto in einem Satz.
    4) Verzicht in einem Satz („Das gilt nicht, wenn …").

(B) Tiefe Antwort (auf explizite Nachfrage):
    - Diagnose-Sektion
    - Sequenz / Gates (welche Köpfe in welcher Reihenfolge, warum)
    - Hebel mit Lobe-Konzept-Erklärung (Definition → Mechanik → Mini-Beispiel)
    - Offene Achsen (bewusst nicht geglättet)
    - Reim-Brücken (max. 2)
    - Skeptiker-Veto + Verzicht
    - Wenn passend: wörtlicher Pitch-Einzeiler (.11) oder Gehirn-Regel (.8)
"""


def build_system_voice() -> str:
    return "\n\n".join([HIRN_VOICE, HARD_RULES, OUTPUT_TEMPLATE])


def render_lobe_for_prompt(lobe) -> str:
    """Verdichtete Darstellung eines Lobes für den Live-Prompt.

    Volltext der Sektionen → das LLM bekommt das Original; keine Zusammenfassung.
    """
    parts: list[str] = []
    parts.append(f"### {lobe.address} — {lobe.author}")
    if lobe.one_sentence_dna:
        parts.append(f"> Ein-Satz-DNA: {lobe.one_sentence_dna}")
    if lobe.axis_position:
        parts.append(f"> Position: {lobe.axis_position}")
    if lobe.function:
        parts.append(f"> Funktion: {lobe.function}")
    parts.append("")
    for key in sorted(lobe.sections.keys(), key=_section_sort_key):
        sec = lobe.sections[key]
        parts.append(f"#### {lobe.address}.{key} — {sec.title}")
        parts.append(sec.body)
        parts.append("")
    return "\n".join(parts)


def _section_sort_key(key: str) -> tuple[int, ...]:
    return tuple(int(p) for p in key.split("."))


def build_lobe_bundle(catalog: Catalog) -> str:
    """Komplette 45 Lobes als ein gross zusammengebackener Block.

    Hauptkandidat für `cache_control: {type: "ephemeral"}` im Live-Modus, weil dieser
    Block bei JEDER Anfrage identisch bleibt — auf 1h TTL absetzbar.
    """
    parts: list[str] = []
    parts.append("## DAS HIRN — 45 Lobes über 9 Segmente / 5 Sub-Hirne\n")
    for segment in (
        "social_media", "strategie", "audience", "distribution",
        "conversion", "retention", "storytelling", "crisis", "influencer",
    ):
        lobes = catalog.by_segment(segment)
        if not lobes:
            continue
        parts.append(f"\n## SEGMENT — {SEGMENT_LABELS[segment]}\n")
        for lobe in lobes:
            parts.append(render_lobe_for_prompt(lobe))
    return "\n".join(parts)


def build_user_turn(query: str, plan, catalog: Catalog) -> str:
    """Die konkrete Anfrage + ihr Routing-Plan als User-Turn.

    Hier landet die *einzige* veränderliche Information. Die Lobes werden NICHT
    dupliziert — sie sind im gecachten Bundle. Wir nennen nur die Adressen, die
    das Routing für relevant erklärt.
    """
    lines: list[str] = []
    lines.append(f"ANFRAGE: {query}\n")
    lines.append(f"ROUTING-KLASSIFIKATION: {plan.mode.value}\n")
    if plan.sequence_notes:
        lines.append("SEQUENZ-GATES (in dieser Reihenfolge respektieren):")
        for note in plan.sequence_notes:
            lines.append(f"  – {note}")
        lines.append("")
    if plan.primary_lobes:
        lines.append("AKTIVE LOBES (in Reihenfolge):")
        for addr in plan.primary_lobes:
            lobe = catalog.get(addr)
            if lobe:
                lines.append(f"  – {addr} ({lobe.author})")
            else:
                lines.append(f"  – {addr}")
        lines.append("")
    if plan.skeptic:
        lobe = catalog.get(plan.skeptic)
        author = lobe.author if lobe else ""
        lines.append(f"SKEPTIKER-KORREKTIV (pflicht): {plan.skeptic} — {author}\n")
    if plan.open_axes:
        lines.append("OFFENE ACHSEN (nicht glätten):")
        for a, b, desc in plan.open_axes:
            lines.append(f"  – {a} ↔ {b}: {desc}")
        lines.append("")
    if plan.rhyme_partners:
        lines.append("REIM-BRÜCKEN (max. 2 ziehen, wenn passend):")
        for lobe_addr, partner, axis in plan.rhyme_partners:
            lines.append(f"  – {lobe_addr} ↔ {partner} ({axis})")
        lines.append("")
    lines.append(
        "Antworte gemäss Output-Template (A) — Kurzform — wenn die Anfrage knapp ist; "
        "andernfalls Output-Template (B). Halte die nicht verhandelbaren Regeln R1-R7."
    )
    return "\n".join(lines)
