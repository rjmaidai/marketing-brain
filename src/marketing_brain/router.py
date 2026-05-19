"""Router: Klassifiziert eine Anfrage und plant die Sequenz aus Lobes.

Implementiert die Regeln aus marketing_hirn_engine_spec.md §3–§5:

  • Sequenz-Gates (nicht semantische Ähnlichkeit):
      - Marketing-Kette: Strategie → Audience → Distribution → Conversion → Retention
        (Ritson-Vorgate: erst Diagnose, dann Strategie, dann Taktik)
      - PMF-Gate (D4 Sean Ellis) bevor D2/D5 sprechen
      - Halbert-Test (C2) bevor C4/C5 Offer-Mechanik bauen
      - Crisis: K1-Diagnose × K2-Move-Set, K3-Schutzinfo schnell, K5-Gate
        vor Tell-it-all, niemals K3+K4 allein
      - Influencer: I5-Owned-Audience-Gate als Auszahlungsstufe aller I1-I4
      - Storytelling: McKee/Vonnegut-Spannung offen lassen, Storr als Schiedsrichter

  • Skeptiker-Korrektiv (immer mit am Tisch, je nach Segment):
      - SocialMedia / Marketing → Sutherland (SocialMedia:05)
      - Crisis                 → Dezenhall   (Crisis:K5)
      - Influencer             → Owned-Audience-Operator (Influencer:I5)
      - Storytelling           → Storr       (Storytelling:S5)

  • Open Axis: bewusst offene Spannungen werden nicht geglättet.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Iterable

from .catalog import Catalog


class Mode(str, Enum):
    """Welche Frage-Klasse liegt vor?"""

    MARKETING_KETTE = "marketing_kette"      # Ende-zu-Ende-Marketing
    STRATEGIE = "strategie"
    AUDIENCE = "audience"
    DISTRIBUTION = "distribution"
    CONVERSION = "conversion"
    RETENTION = "retention"
    SOCIAL_MEDIA = "social_media"
    STORYTELLING = "storytelling"
    CRISIS = "crisis"
    INFLUENCER = "influencer"
    META = "meta"                             # Querfrage: vergleiche Hirne / Reim


# Suchhilfen — Stichwörter, die jeweils einen Modus anziehen.
KEYWORDS: dict[Mode, list[str]] = {
    Mode.CRISIS: [
        "krise", "krisen", "shitstorm", "rückruf", "rueckruf", "skandal",
        "vorwurf", "vorwürfe", "vorwuerfe", "presse-anfrage", "dpa", "boulevard",
        "leak", "datenpanne", "ermittlung", "behörde", "behoerde", "regulator",
        "vakuum", "no-comment", "kein kommentar", "imageschaden",
    ],
    Mode.INFLUENCER: [
        "influencer", "creator", "creator-economy", "mrbeast", "tiktok-creator",
        "youtuber", "owned audience", "owned-audience", "newsletter-liste",
        "follower", "abonnenten-liste", "creator-deal", "talent", "personal brand",
    ],
    Mode.STORYTELLING: [
        "story", "geschichte", "narrativ", "drehbuch", "szene", "figur",
        "heldenreise", "plot", "drama", "spannungsbogen", "controlling idea",
        "claim-story", "markenstory",
    ],
    Mode.SOCIAL_MEDIA: [
        "social media", "instagram", "tiktok", "linkedin", "reichweite",
        "feed", "algorithmus", "post", "content", "engagement", "attention",
        "aufmerksamkeit", "kpi", "metric", "messung", "attribution", "tracking",
    ],
    Mode.STRATEGIE: [
        "positionierung", "positioning", "strategie", "marken-strategie",
        "category", "kategorie", "where to play", "differenzierung", "porter",
        "5 forces", "fünf kräfte", "zag", "ries und trout", "ries trout",
    ],
    Mode.AUDIENCE: [
        "audience", "zielgruppe", "persona", "jobs to be done", "jtbd",
        "kundeninterview", "mental model", "research", "kahneman", "system 1",
        "system 2", "bias", "cialdini", "moesta", "indi young",
    ],
    Mode.DISTRIBUTION: [
        "distribution", "growth", "wachstum", "loop", "viral", "channel",
        "kanal", "akquise", "akquisition", "permission marketing", "tribe",
        "cold start", "product-market fit", "pmf", "stepps",
    ],
    Mode.CONVERSION: [
        "conversion", "funnel", "landingpage", "copy", "copywriting",
        "verkauf", "verkaufsseite", "angebot", "offer", "value equation",
        "hormozi", "schwartz", "halbert", "ogilvy", "brunson", "lead-magnet",
        "hook-story-offer",
    ],
    Mode.RETENTION: [
        "retention", "churn", "loyalität", "loyalty", "nps", "onboarding",
        "habit", "wiederkauf", "lifetime value", "ltv", "superfan",
        "true fan", "community", "kelly", "eyal", "reichheld", "coleman",
    ],
}


@dataclass
class RoutingPlan:
    """Was hat der Router für diese Frage entschieden?"""

    query: str
    mode: Mode
    primary_lobes: list[str] = field(default_factory=list)
    sequence_notes: list[str] = field(default_factory=list)
    skeptic: str | None = None
    open_axes: list[tuple[str, str, str]] = field(default_factory=list)
    rhyme_partners: list[tuple[str, str, str]] = field(default_factory=list)
    rationale: list[str] = field(default_factory=list)

    def all_addresses(self) -> list[str]:
        """Alle Lobe-Adressen, die der Engine reichen muss (Reihenfolge bewahrt)."""
        seen: list[str] = []
        for a in self.primary_lobes:
            if a not in seen:
                seen.append(a)
        if self.skeptic and self.skeptic not in seen:
            seen.append(self.skeptic)
        return seen

    def to_dict(self) -> dict:
        return {
            "query": self.query,
            "mode": self.mode.value,
            "primary_lobes": self.primary_lobes,
            "sequence_notes": self.sequence_notes,
            "skeptic": self.skeptic,
            "open_axes": [list(t) for t in self.open_axes],
            "rhyme_partners": [list(t) for t in self.rhyme_partners],
            "rationale": self.rationale,
        }


def classify(query: str) -> Mode:
    """Heuristische Klassifizierung — keine semantische Ähnlichkeit, nur Schlagworte
    aus der Spec."""
    q = query.lower()

    # Krise dominiert alles: Wenn 'krise' oder ähnlich auftaucht → Krise.
    crisis_hits = _hits(q, KEYWORDS[Mode.CRISIS])
    if crisis_hits >= 1:
        return Mode.CRISIS

    # Marketing-Kette: explizite Multi-Schicht-Anfrage
    if re.search(r"\b(marketing[-\s]?strategie|von strategie bis|end-to-end|gesamt[-\s]?marketing|launch[-\s]?plan|kampagn[en]?[-\s]?plan)\b", q):
        return Mode.MARKETING_KETTE

    # Querfrage / Meta
    if re.search(r"\b(reim|reimt|vergleich|gegenüber|gegenueber|spannung|hirn[-\s]?übergreifend|hirnuebergreifend)\b", q):
        return Mode.META

    scores: dict[Mode, int] = {}
    for mode in (
        Mode.INFLUENCER,
        Mode.STORYTELLING,
        Mode.SOCIAL_MEDIA,
        Mode.STRATEGIE,
        Mode.AUDIENCE,
        Mode.DISTRIBUTION,
        Mode.CONVERSION,
        Mode.RETENTION,
    ):
        scores[mode] = _hits(q, KEYWORDS[mode])

    best = max(scores, key=lambda m: scores[m])
    if scores[best] == 0:
        # Default: Marketing-Kette ist der Vol.2-„rote Faden"
        return Mode.MARKETING_KETTE
    return best


def _hits(query: str, words: Iterable[str]) -> int:
    n = 0
    for w in words:
        if w in query:
            n += 1
    return n


# ---------------------------------------------------------------------------
# Sequenz-Gates und Skeptiker-Korrektive
# ---------------------------------------------------------------------------


def _strategie_sequence() -> list[str]:
    # Ritson-Vorgate: Diagnose first → Dunford als Operationsmesser zuerst
    return ["Strategie:S1", "Strategie:S4", "Strategie:S5", "Strategie:S2", "Strategie:S3"]


def _audience_sequence() -> list[str]:
    return ["Audience:A1", "Audience:A5", "Audience:A2", "Audience:A4", "Audience:A3"]


def _distribution_sequence() -> list[str]:
    # PMF-Gate: D4 zuerst — wenn kein PMF, dann hat D2/D5 wenig zu tun.
    return ["Distribution:D4", "Distribution:D2", "Distribution:D3", "Distribution:D1", "Distribution:D5"]


def _conversion_sequence() -> list[str]:
    # Halbert-Test (C2) zuerst: gibt es einen hungrigen Markt?
    return ["Conversion:C2", "Conversion:C1", "Conversion:C4", "Conversion:C3", "Conversion:C5"]


def _retention_sequence() -> list[str]:
    return ["Retention:R2", "Retention:R4", "Retention:R1", "Retention:R3", "Retention:R5"]


def _social_media_sequence() -> list[str]:
    # Sharp/Binet/Ritson zuerst — Vaynerchuk holt den Reflex, Sutherland korrigiert
    return ["SocialMedia:02", "SocialMedia:04", "SocialMedia:03", "SocialMedia:01"]


def _storytelling_sequence() -> list[str]:
    # McKee (Form) zuerst, dann Vonnegut (Stimme), Heath (klebrig), Campbell (Tiefe),
    # Storr als Schiedsrichter.
    return ["Storytelling:S1", "Storytelling:S3", "Storytelling:S4", "Storytelling:S2"]


def _crisis_sequence() -> list[str]:
    # K1 Diagnose, K2 Move-Set, K3 Schutzinfo schnell, K4 Vertrauens-Mess, dann K5 als Korrektiv
    return ["Crisis:K1", "Crisis:K2", "Crisis:K3", "Crisis:K4"]


def _influencer_sequence() -> list[str]:
    # I1-I4 produzieren, I5 ist die Auszahlungsstufe (siehe Index §4.2)
    return ["Influencer:I1", "Influencer:I2", "Influencer:I3", "Influencer:I4"]


SKEPTIC_PER_MODE: dict[Mode, str] = {
    Mode.SOCIAL_MEDIA: "SocialMedia:05",     # Sutherland
    Mode.STRATEGIE: "SocialMedia:05",
    Mode.AUDIENCE: "SocialMedia:05",
    Mode.DISTRIBUTION: "SocialMedia:05",
    Mode.CONVERSION: "SocialMedia:05",
    Mode.RETENTION: "SocialMedia:05",
    Mode.MARKETING_KETTE: "SocialMedia:05",
    Mode.STORYTELLING: "Storytelling:S5",    # Will Storr
    Mode.CRISIS: "Crisis:K5",                 # Dezenhall
    Mode.INFLUENCER: "Influencer:I5",         # Owned Audience Operator
    Mode.META: "SocialMedia:05",
}


OPEN_AXES_PER_MODE: dict[Mode, list[tuple[str, str, str]]] = {
    # (Lobe A, Lobe B, Beschreibung der Spannung — bewusst nicht glätten)
    Mode.STRATEGIE: [
        ("Strategie:S1", "SocialMedia:02", 'Best-Fit Customers (Dunford) vs. „Reach all category buyers" (Sharp)'),
        ("Strategie:S5", "Strategie:S2", "Porter (System-Trade-offs) vs. Neumeier (Markenidentität / ZAG)"),
    ],
    Mode.SOCIAL_MEDIA: [
        ("SocialMedia:01", "SocialMedia:03", "Vaynerchuk (Reflex/Tempo) vs. Ritson (Diagnose → Strategie → Taktik)"),
        ("SocialMedia:02", "SocialMedia:05", "Sharp (Empirie/Gesetz) vs. Sutherland (Skeptiker/Inversion)"),
    ],
    Mode.CONVERSION: [
        ("Conversion:C4", "Conversion:C3", 'Hormozi (Offer-Maschine) vs. Ogilvy (Markenstimme, „klügste Frau")'),
        ("Conversion:C1", "Conversion:C2", "Schwartz (Awareness Stages) vs. Halbert (hungriger Markt)"),
    ],
    Mode.STORYTELLING: [
        ("Storytelling:S1", "Storytelling:S3", "McKee (Form/Struktur) vs. Vonnegut (Stimme/Ökonomie) — Storr ist der Schiedsrichter (S5)"),
        ("Storytelling:S2", "Storytelling:S3", "Campbell (Archetyp) vs. Vonnegut (gegen Klischee)"),
    ],
    Mode.CRISIS: [
        ("Crisis:K1", "Crisis:K3", "Coombs (Diagnose first) vs. Davis (Tempo first) — Auflösung: Davis-Coombs-Brücke (K3.4.4)"),
        ("Crisis:K3", "Crisis:K5", 'Davis („tell it all") vs. Dezenhall (Recht/Verhandlung) — K5-Gate vor Tell-it-all'),
    ],
    Mode.INFLUENCER: [
        ("Influencer:I1", "Influencer:I2", "MrBeast (optimierte Maschine) vs. Chamberlain (unverwechselbare Stimme) — Reim auf McKee↔Vonnegut"),
        ("Influencer:I3", "Influencer:I1", "MKBHD (Vertrauen verzinst über Jahrzehnt) vs. MrBeast (Quartal/Reichweite) — Zeithorizont zuerst deklarieren"),
    ],
    Mode.AUDIENCE: [
        ("Audience:A1", "Audience:A3", "Christensen (Job-To-Be-Done) vs. Cialdini (Zustimmungs-Prinzipien)"),
    ],
    Mode.DISTRIBUTION: [
        ("Distribution:D4", "Distribution:D2", "Sean Ellis (PMF-Gate) vs. Balfour (Growth-Loops) — ohne PMF läuft kein Loop"),
        ("Distribution:D1", "Distribution:D5", "Godin (Tribe / Permission) vs. Berger (STEPPS / viral)"),
    ],
    Mode.RETENTION: [
        ("Retention:R3", "Retention:R1", "Kevin Kelly (1000 True Fans) vs. Reichheld (NPS / Mass)"),
    ],
}


RHYME_PEERS: dict[str, list[tuple[str, str]]] = {
    # Adresse → [(Reim-Partner, Achse), ...]
    # Gesetz/Empirie-Achse
    "SocialMedia:02": [("Crisis:K1", "Gesetz"), ("Storytelling:S1", "Gesetz"), ("Influencer:I1", "Gesetz")],
    "Crisis:K1":      [("SocialMedia:02", "Gesetz"), ("Storytelling:S1", "Gesetz"), ("Influencer:I1", "Gesetz")],
    "Storytelling:S1": [("SocialMedia:02", "Gesetz"), ("Crisis:K1", "Gesetz"), ("Influencer:I1", "Gesetz")],
    "Influencer:I1":  [("SocialMedia:02", "Gesetz"), ("Crisis:K1", "Gesetz"), ("Storytelling:S1", "Gesetz")],
    # Skeptiker-Achse
    "SocialMedia:05": [("Crisis:K5", "Skeptiker"), ("Influencer:I5", "Skeptiker"), ("Storytelling:S5", "Skeptiker")],
    "Crisis:K5":      [("SocialMedia:05", "Skeptiker"), ("Influencer:I5", "Skeptiker"), ("Storytelling:S5", "Skeptiker")],
    "Influencer:I5":  [("SocialMedia:05", "Skeptiker"), ("Crisis:K5", "Skeptiker"), ("Storytelling:S5", "Skeptiker")],
    "Storytelling:S5": [("SocialMedia:05", "Skeptiker"), ("Crisis:K5", "Skeptiker"), ("Influencer:I5", "Skeptiker")],
    # Reflex/Tempo
    "SocialMedia:01": [("Crisis:K3", "Reflex/Tempo"), ("Influencer:I2", "Reflex/Tempo")],
    "Crisis:K3":      [("SocialMedia:01", "Reflex/Tempo"), ("Influencer:I2", "Reflex/Tempo")],
    "Influencer:I2":  [("SocialMedia:01", "Reflex/Tempo"), ("Crisis:K3", "Reflex/Tempo")],
    # Handwerk/Disziplin
    "SocialMedia:03": [("Crisis:K2", "Handwerk"), ("Influencer:I3", "Handwerk")],
    "Crisis:K2":      [("SocialMedia:03", "Handwerk"), ("Influencer:I3", "Handwerk")],
    "Influencer:I3":  [("SocialMedia:03", "Handwerk"), ("Crisis:K2", "Handwerk"), ("Crisis:K4", "Vertrauens-Bremse"), ("Influencer:I5", "Vertrauens-Bremse")],
    # Mess-über-Zeit
    "SocialMedia:04": [("Crisis:K4", "Lange-Welle/Mess")],
    "Crisis:K4":      [("SocialMedia:04", "Lange-Welle/Mess"), ("Influencer:I3", "Vertrauens-Bremse"), ("Influencer:I5", "Vertrauens-Bremse")],
    # Klebrigkeit/Subtraktion
    "Storytelling:S4": [("Influencer:I4", "Klebrigkeit/Subtraktion")],
    "Influencer:I4":  [("Storytelling:S4", "Klebrigkeit/Subtraktion")],
}


def route(query: str, catalog: Catalog | None = None) -> RoutingPlan:
    """Erzeugt einen Routing-Plan für eine Frage."""
    mode = classify(query)
    plan = RoutingPlan(query=query, mode=mode)
    plan.rationale.append(f"Klassifiziert als: {mode.value}")

    if mode is Mode.MARKETING_KETTE:
        plan.sequence_notes.append(
            "Ritson-Vorgate (SocialMedia:03): Diagnose → Strategie → Taktik. "
            "Erst Strategie klären, bevor Audience/Distribution/Conversion/Retention gefüttert werden."
        )
        plan.primary_lobes = (
            _strategie_sequence()[:2]
            + _audience_sequence()[:2]
            + _distribution_sequence()[:2]
            + _conversion_sequence()[:2]
            + _retention_sequence()[:2]
        )
        for seg, fn, desc in [
            ("strategie", _strategie_sequence, "Strategie: erst Dunford-Diagnose (S1), dann Choice (S4)."),
            ("distribution", _distribution_sequence, "Distribution: PMF-Gate (D4) BEVOR Growth-Loops (D2)."),
            ("conversion", _conversion_sequence, "Conversion: Halbert-Test (C2) BEVOR Hormozi-Offer (C4)."),
        ]:
            plan.sequence_notes.append(desc)
    elif mode is Mode.STRATEGIE:
        plan.primary_lobes = _strategie_sequence()
        plan.sequence_notes.append("Reihenfolge: S1 (Dunford) → S4 (Martin Choice) → S5 (Porter System) → S2 (Neumeier) → S3 (Ries/Trout).")
    elif mode is Mode.AUDIENCE:
        plan.primary_lobes = _audience_sequence()
        plan.sequence_notes.append("Reihenfolge: A1 (JTBD) → A5 (Young Listening) → A2 (Moesta Switch) → A4 (Kahneman) → A3 (Cialdini).")
    elif mode is Mode.DISTRIBUTION:
        plan.primary_lobes = _distribution_sequence()
        plan.sequence_notes.append("PMF-Gate: D4 (Sean Ellis) zuerst — wenn PMF fehlt, hat D2/D5 wenig zu sagen.")
    elif mode is Mode.CONVERSION:
        plan.primary_lobes = _conversion_sequence()
        plan.sequence_notes.append("Halbert-Test (C2): hungriger Markt? Erst dann Schwartz-Awareness (C1) und Hormozi-Offer (C4).")
    elif mode is Mode.RETENTION:
        plan.primary_lobes = _retention_sequence()
        plan.sequence_notes.append("Reihenfolge: R2 (Onboarding 100 Tage) → R4 (Habit-Loop) → R1 (NPS) → R3 (1000 True Fans) → R5 (Superfans).")
    elif mode is Mode.SOCIAL_MEDIA:
        plan.primary_lobes = _social_media_sequence() + ["SocialMedia:05"]
        plan.sequence_notes.append("Sharp/Binet/Ritson zuerst (Empirie + Mess + Diagnose), dann Vaynerchuk-Reflex, Sutherland-Korrektiv.")
        # Skeptiker ist hier schon dabei
    elif mode is Mode.STORYTELLING:
        plan.primary_lobes = _storytelling_sequence()
        plan.sequence_notes.append("McKee (Form) zuerst, Vonnegut (Stimme) als Antagonist, Heath (klebrig) + Campbell (Archetyp), Storr (S5) als Schiedsrichter.")
    elif mode is Mode.CRISIS:
        plan.primary_lobes = _crisis_sequence()
        plan.sequence_notes.append("K1 (Coombs Cluster-Diagnose) × K2 (Benoit-Zug). Davis-Coombs-Brücke: K3 nur für instruktive Schutzinfo, finale Schuld-/Image-Aussage erst nach K1.")
        plan.sequence_notes.append("K5-Gate: vor jeder vollständigen Offenlegung Dezenhall-Korrektiv ziehen. Schutzinfo nie zurückhalten, echte Schuld nie aussitzen.")
    elif mode is Mode.INFLUENCER:
        plan.primary_lobes = _influencer_sequence()
        plan.sequence_notes.append("I5 (Owned-Audience-Operator) ist Auszahlungsstufe aller I1-I4 — kein Lobe ist 'fertig' ohne I5-Transferpfad.")
    elif mode is Mode.META:
        # Querfrage: ziehe Skeptiker aller vier 'Hirne' + die offensichtlichste Reim-Achse
        plan.primary_lobes = [
            "SocialMedia:02", "SocialMedia:05",
            "Crisis:K1", "Crisis:K5",
            "Storytelling:S1", "Storytelling:S5",
            "Influencer:I1", "Influencer:I5",
        ]
        plan.sequence_notes.append("Meta-Modus: Reim-Achsen aktivieren (Gesetz × Skeptiker × Handwerk × Reflex).")

    # Skeptiker-Korrektiv
    plan.skeptic = SKEPTIC_PER_MODE.get(mode)
    if plan.skeptic:
        plan.rationale.append(f"Skeptiker-Korrektiv pflicht: {plan.skeptic}")

    # Offene Achsen
    plan.open_axes = OPEN_AXES_PER_MODE.get(mode, [])
    if plan.open_axes:
        plan.rationale.append(f"Offene Achsen (nicht glätten): {len(plan.open_axes)}")

    # Reim-Partner für die ersten zwei Primary-Lobes
    seen_rhymes: set[tuple[str, str, str]] = set()
    for lobe_addr in plan.primary_lobes[:2]:
        for partner, axis in RHYME_PEERS.get(lobe_addr, []):
            triple = (lobe_addr, partner, axis)
            if triple not in seen_rhymes:
                seen_rhymes.add(triple)
                plan.rhyme_partners.append(triple)

    # Wenn ein Katalog mitgegeben ist, filtere unbekannte Adressen raus (Hygiene)
    if catalog is not None:
        plan.primary_lobes = [a for a in plan.primary_lobes if catalog.get(a) is not None]
        if plan.skeptic and catalog.get(plan.skeptic) is None:
            plan.skeptic = None

    return plan
