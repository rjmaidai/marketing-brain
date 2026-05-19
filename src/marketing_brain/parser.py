"""Parser: Liest eine Lobe-Markdown-Datei und zerlegt sie in eine Lobe-Struktur.

Eingangsformat (gilt für alle 45 Köpfe):

    # LOBE {ID} — {AUTHOR}[ (optional Suffix)][ · VOLLE TIEFE]

    > Ein-Satz-DNA: *...*
    > Position auf der {Achse}-Achse: **„..."**
    > [Funktion im Gehirn: **...**]

    ---

    ## {ID}.1 — Wer
    ...

    ## {ID}.2 — Der zentrale Glaubenssatz
    ...

    (...)

    ## {ID}.13 — ...
    ...

    [optional .14/.15/.16 bei Krise & Influencer]

    — Ende Lobe {ID} —

Der Parser ist absichtlich tolerant: kleine Schreibvarianten werden geschluckt,
strukturelle Brüche werden als Warnungen registriert (siehe Lobe.warnings).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


HEADER_RE = re.compile(r"^#\s+LOBE\s+([A-Z]?\d+)\s+[—–-]\s+(.+?)\s*$")
# matches `## X.Y[.Z] — Titel` and `### X.Y[.Z] — Titel` (nested subsections)
SECTION_RE = re.compile(r"^(#{2,3})\s+([A-Z]?\d+)\.(\d+)(?:\.(\d+))?\s+[—–-]\s+(.+?)\s*$")
END_RE = re.compile(r"^[—–-]+\s*Ende\s+Lobe\s+([A-Z]?\d+)\s*[—–-]*\s*$", re.IGNORECASE)


@dataclass
class Section:
    """Eine Sektion innerhalb eines Lobes (z. B. S1.4 oder K3.4.2)."""

    number: str         # "1", "4", "4.2", "14"
    title: str
    body: str = ""

    @property
    def key(self) -> str:
        return self.number


@dataclass
class Lobe:
    """Ein Kopf des Hirns. Adressierung: {segment}:{lobe_id}[.section]."""

    segment: str                 # "social_media" | "strategie" | "audience" | ...
    lobe_id: str                 # "01".."05", "S1".."S5", "K1".."K5", ...
    author: str                  # "GARY VAYNERCHUK", "APRIL DUNFORD", ...
    source_path: Path
    one_sentence_dna: str = ""
    axis_position: str = ""       # raw Zeile "Position auf der ...-Achse: ..."
    function: str = ""            # "Funktion im Gehirn: ..." (optional)
    sections: dict[str, Section] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)

    @property
    def address(self) -> str:
        # Segment-Anzeige: kapitalisiert. "social_media" → "SocialMedia"
        seg = "".join(p.capitalize() for p in self.segment.split("_"))
        return f"{seg}:{self.lobe_id}"

    def section(self, key: str) -> Section | None:
        return self.sections.get(key)

    # Bequeme Eigenschaften (Spec §10 — bei Output bewusst zu ziehen):
    @property
    def gehirn_regel(self) -> str:
        """Aus .8: die fett markierte 'Gehirn-Regel'-Zeile (falls vorhanden)."""
        sec = self.section("8")
        if not sec:
            return ""
        m = re.search(r"\*\*Gehirn-Regel:\*\*\s+(.+?)(?:\n\n|\Z)", sec.body, re.DOTALL)
        return _clean_ws(m.group(1)) if m else ""

    @property
    def pitch_oneliner(self) -> str:
        """Aus .11: die fett markierte 'Pitch-Einzeiler'-Zeile (falls vorhanden)."""
        sec = self.section("11")
        if not sec:
            return ""
        m = re.search(
            r'\*\*[„"](.+?)["“]\*\*',
            sec.body,
            re.DOTALL,
        )
        if m:
            return _clean_ws(m.group(1))
        m2 = re.search(r"Pitch-Einzeiler[^:]*:\s*\*\*(.+?)\*\*", sec.body, re.DOTALL)
        return _clean_ws(m2.group(1)) if m2 else ""


def _clean_ws(text: str) -> str:
    # Entferne Blockquote-Marker `>` am Zeilenanfang, dann normalisiere Whitespace
    text = re.sub(r"(?m)^\s*>\s?", "", text)
    return re.sub(r"\s+", " ", text).strip()


def parse_lobe(path: Path, segment: str) -> Lobe:
    """Lies eine .md-Datei und gib eine Lobe zurück."""
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    lobe_id: str | None = None
    author: str = ""
    one_sentence_dna = ""
    axis_position = ""
    function = ""
    warnings: list[str] = []

    # 1. Header finden
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i >= len(lines):
        raise ValueError(f"{path}: leere Datei")
    m = HEADER_RE.match(lines[i])
    if not m:
        raise ValueError(f"{path}: erster Inhalts-Zeile ist kein Lobe-Header: {lines[i]!r}")
    lobe_id = m.group(1)
    raw_author = m.group(2)
    # "GARY VAYNERCHUK" oder "LANNY DAVIS (Speed-Doktrin) · VOLLE TIEFE"
    author = re.sub(r"\s*·\s*VOLLE\s+TIEFE\s*$", "", raw_author, flags=re.IGNORECASE).strip()
    i += 1

    # 2. Vorspann: Blockquote-Zeilen bis zur ersten ---
    preamble: list[str] = []
    while i < len(lines):
        line = lines[i].rstrip()
        if line.strip().startswith("---"):
            i += 1
            break
        if line.startswith(">") or line.strip() == "":
            preamble.append(line)
        else:
            # ein paar Lobes (Krise) haben eine zweite Tiefenfassungs-Quote vor dem ---
            preamble.append(line)
        i += 1

    preamble_text = "\n".join(preamble)
    # Ein-Satz-DNA: alles im ersten ">"-Block bis zur nächsten Leerzeile
    m = re.search(r">\s*Ein-Satz-DNA:\s*\*(.+?)\*", preamble_text, re.DOTALL)
    if m:
        one_sentence_dna = _clean_ws(m.group(1))
    else:
        warnings.append("Keine Ein-Satz-DNA gefunden")

    m = re.search(r">\s*Position auf der\s+(.+?)\s*$", preamble_text, re.MULTILINE)
    if m:
        axis_position = m.group(1).strip()
    m = re.search(r">\s*Funktion im Gehirn:\s*(.+?)(?:\n|$)", preamble_text)
    if m:
        function = re.sub(r"\*+", "", m.group(1)).strip()

    # 3. Sektionen sammeln
    sections: dict[str, Section] = {}
    current: Section | None = None
    buf: list[str] = []

    def flush():
        nonlocal buf, current
        if current is not None:
            current.body = "\n".join(buf).strip()
            sections[current.key] = current
        buf = []

    while i < len(lines):
        line = lines[i]
        if END_RE.match(line.strip()):
            flush()
            current = None
            i += 1
            continue
        m = SECTION_RE.match(line)
        if m:
            flush()
            # group(1) = "##" oder "###" (Tiefe), group(2) = Lobe-ID, group(3) = major,
            # group(4) = minor (optional), group(5) = Titel
            sec_lobe = m.group(2)
            major = m.group(3)
            minor = m.group(4)
            title = m.group(5)
            if sec_lobe != lobe_id:
                warnings.append(f"Sektion-Header verweist auf {sec_lobe} statt {lobe_id}")
            number = f"{major}.{minor}" if minor else major
            current = Section(number=number, title=_clean_ws(title))
            i += 1
            continue
        if current is None:
            # Inhalte vor der ersten Sektion (z. B. eine zweite Vorspann-Quote)
            if line.strip().startswith("---"):
                i += 1
                continue
        else:
            buf.append(line)
        i += 1

    flush()

    if not sections:
        raise ValueError(f"{path}: keine Sektionen erkannt")
    if "1" not in sections:
        warnings.append("Sektion .1 (Wer) fehlt")
    if "2" not in sections:
        warnings.append("Sektion .2 (Glaubenssatz) fehlt")

    return Lobe(
        segment=segment,
        lobe_id=lobe_id,
        author=author,
        source_path=path,
        one_sentence_dna=one_sentence_dna,
        axis_position=axis_position,
        function=function,
        sections=sections,
        warnings=warnings,
    )
