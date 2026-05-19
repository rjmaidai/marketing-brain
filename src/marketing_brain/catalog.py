"""Catalog: lädt alle 45 Lobes + 5 Index-Dateien und macht sie adressierbar.

Adressierung folgt der Spec §1:
    {Segment}:{Lobe-ID}[.Sektion]

Beispiele:
    SocialMedia:01.6       — Sutherland-Block 6
    Strategie:S1.4         — Dunford „Schlüsselkonzepte"
    Storytelling:S1.4      — McKee „Schlüsselkonzepte" (kollidiert NICHT mit Strategie:S1)
    Crisis:K3.4.4          — Davis „Davis-Coombs-Brücke"

Lookup ist case-insensitive für Segment und unterstützt Kurzformen
(z. B. "Story:S1" für "Storytelling:S1").
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from .parser import Lobe, parse_lobe


SEGMENT_ORDER = (
    "social_media",
    "strategie",
    "audience",
    "distribution",
    "conversion",
    "retention",
    "storytelling",
    "crisis",
    "influencer",
)


SEGMENT_LABELS = {
    "social_media": "SocialMedia",
    "strategie": "Strategie",
    "audience": "Audience",
    "distribution": "Distribution",
    "conversion": "Conversion",
    "retention": "Retention",
    "storytelling": "Storytelling",
    "crisis": "Crisis",
    "influencer": "Influencer",
}


SEGMENT_AXIS = {
    "social_media": "Mess-Achse",
    "strategie": "Strategie-Achse",
    "audience": "Verstehens-Achse",
    "distribution": "Verteilungs-Achse",
    "conversion": "Wandlungs-Achse",
    "retention": "Bindungs-Achse",
    "storytelling": "Haftungs-Achse",
    "crisis": "Kontroll-Achse",
    "influencer": "Asset-Achse",
}


# Vier Reim-Achsen über alle Hirne (Spec / Index-Dokumente):
# Gesetz · Skeptiker · Reflex/Tempo · Handwerk
RHYME_AXIS = {
    "Gesetz/Empirie":      ["SocialMedia:02", "Crisis:K1", "Storytelling:S1", "Influencer:I1"],
    "Skeptiker":           ["SocialMedia:05", "Crisis:K5", "Influencer:I5", "Storytelling:S5"],
    "Reflex/Tempo":        ["SocialMedia:01", "Crisis:K3", "Influencer:I2"],
    "Handwerk/Disziplin":  ["SocialMedia:03", "Crisis:K2", "Influencer:I3"],
    "Lange-Welle/Mess":    ["SocialMedia:04", "Crisis:K4"],
    "Klebrigkeit/Subtraktion": ["Storytelling:S4", "Influencer:I4"],
    "Vertrauens-Bremse":   ["Crisis:K4", "Influencer:I3", "Influencer:I5"],
}


@dataclass
class Catalog:
    """In-Memory-Katalog aller geparsten Lobes."""

    lobes: dict[str, Lobe] = field(default_factory=dict)  # address → Lobe
    indexes: dict[str, str] = field(default_factory=dict)  # segment → raw markdown
    data_root: Path | None = None

    # ---------- Lookup ----------

    def get(self, address: str) -> Lobe | None:
        """Holt einen Lobe per Adresse. Akzeptiert Section-Suffix (wird ignoriert)."""
        addr = self._normalize(address)
        if addr is None:
            return None
        # eventuelle .section abschneiden
        if "." in addr.split(":", 1)[1]:
            addr = addr.split(".", 1)[0]
        return self.lobes.get(addr)

    def get_section(self, address: str):
        """Erwartet `Segment:LobeID.Section[.SubSection]` und gibt (Lobe, Section) zurück."""
        addr = self._normalize(address)
        if addr is None or ":" not in addr or "." not in addr.split(":", 1)[1]:
            return (None, None)
        head, _, sec_key = addr.partition(":")
        lobe_id, _, section_path = sec_key.partition(".")
        lobe = self.lobes.get(f"{head}:{lobe_id}")
        if lobe is None:
            return (None, None)
        return (lobe, lobe.section(section_path))

    def by_segment(self, segment: str) -> list[Lobe]:
        """Alle Lobes eines Segments in Reihenfolge ihrer ID."""
        seg = self._segment_key(segment)
        if seg is None:
            return []
        return sorted(
            (l for l in self.lobes.values() if l.segment == seg),
            key=lambda l: (len(l.lobe_id), l.lobe_id),
        )

    def all_addresses(self) -> list[str]:
        return sorted(self.lobes.keys())

    def label(self, segment: str) -> str:
        return SEGMENT_LABELS.get(segment, segment)

    # ---------- Reim-Achsen ----------

    def rhyme_peers(self, address: str) -> dict[str, list[str]]:
        """Welche Lobes 'reimen' auf den gegebenen über die anderen Hirne?"""
        addr = self._normalize(address)
        if addr is None:
            return {}
        result: dict[str, list[str]] = {}
        for axis, members in RHYME_AXIS.items():
            if addr in members:
                result[axis] = [m for m in members if m != addr]
        return result

    # ---------- Validation ----------

    def validate(self) -> list[str]:
        """Sanity-Checks: alle 45 Lobes geladen? Sektionen vollständig? Warnungen?"""
        problems: list[str] = []
        expected = {
            "social_media": ["01", "02", "03", "04", "05"],
            "strategie": ["S1", "S2", "S3", "S4", "S5"],
            "audience": ["A1", "A2", "A3", "A4", "A5"],
            "distribution": ["D1", "D2", "D3", "D4", "D5"],
            "conversion": ["C1", "C2", "C3", "C4", "C5"],
            "retention": ["R1", "R2", "R3", "R4", "R5"],
            "storytelling": ["S1", "S2", "S3", "S4", "S5"],
            "crisis": ["K1", "K2", "K3", "K4", "K5"],
            "influencer": ["I1", "I2", "I3", "I4", "I5"],
        }
        for seg, ids in expected.items():
            for lid in ids:
                addr = f"{SEGMENT_LABELS[seg]}:{lid}"
                if addr not in self.lobes:
                    problems.append(f"FEHLT: {addr}")
        for lobe in self.lobes.values():
            for w in lobe.warnings:
                problems.append(f"{lobe.address}: {w}")
            # Standard 1..13 prüfen
            missing = [str(n) for n in range(1, 14) if str(n) not in lobe.sections]
            if missing:
                problems.append(f"{lobe.address}: fehlende Sektionen {','.join(missing)}")
        return problems

    # ---------- Hilfs ----------

    def _segment_key(self, segment: str) -> str | None:
        s = segment.strip().lower().replace(" ", "_")
        if s in SEGMENT_LABELS:
            return s
        # Kurzformen
        aliases = {
            "social": "social_media",
            "sm": "social_media",
            "marketing": "strategie",  # Marketing-Vol2-Default = Strategie
            "story": "storytelling",
            "stories": "storytelling",
            "krise": "crisis",
            "krisen": "crisis",
            "k": "crisis",
            "influencer": "influencer",
            "infl": "influencer",
        }
        if s in aliases:
            return aliases[s]
        for full in SEGMENT_LABELS:
            if SEGMENT_LABELS[full].lower() == s:
                return full
        return None

    def _normalize(self, address: str) -> str | None:
        """Vereinheitlicht eine Adresse zu 'SegmentLabel:LobeID[.section]'."""
        if not address or ":" not in address:
            return None
        seg, rest = address.split(":", 1)
        key = self._segment_key(seg)
        if key is None:
            return None
        label = SEGMENT_LABELS[key]
        return f"{label}:{rest.strip()}"


def load_catalog(data_root: Path | None = None) -> Catalog:
    """Lädt alle 45 Lobes + 5 Index-Dateien aus data/."""
    if data_root is None:
        # Default: <repo>/data
        here = Path(__file__).resolve().parent
        data_root = here.parents[1] / "data"

    catalog = Catalog(data_root=data_root)
    lobes_root = data_root / "lobes"

    if not lobes_root.exists():
        raise FileNotFoundError(f"Lobe-Verzeichnis fehlt: {lobes_root}")

    for segment in SEGMENT_ORDER:
        seg_dir = lobes_root / segment
        if not seg_dir.exists():
            continue
        for md in sorted(seg_dir.glob("*.md")):
            lobe = parse_lobe(md, segment)
            catalog.lobes[lobe.address] = lobe

    indexes_root = data_root / "indexes"
    if indexes_root.exists():
        for md in indexes_root.glob("*.md"):
            seg = md.stem
            catalog.indexes[seg] = md.read_text(encoding="utf-8")

    return catalog
