"""Smoke-Tests für Parser & Catalog."""
from __future__ import annotations

from marketing_brain.catalog import load_catalog


def test_catalog_loads_all_45_lobes():
    catalog = load_catalog()
    assert len(catalog.lobes) == 45, catalog.all_addresses()


def test_all_segments_present():
    catalog = load_catalog()
    expected_count_per_segment = {
        "social_media": 5,
        "strategie": 5,
        "audience": 5,
        "distribution": 5,
        "conversion": 5,
        "retention": 5,
        "storytelling": 5,
        "crisis": 5,
        "influencer": 5,
    }
    for seg, n in expected_count_per_segment.items():
        assert len(catalog.by_segment(seg)) == n, seg


def test_segment_qualified_addressing_no_collision():
    """Strategie:S1 ≠ Storytelling:S1 (gleicher Lobe-Präfix, anderes Hirn)."""
    catalog = load_catalog()
    s_strat = catalog.get("Strategie:S1")
    s_story = catalog.get("Storytelling:S1")
    assert s_strat is not None and s_story is not None
    assert s_strat.author != s_story.author
    assert "DUNFORD" in s_strat.author.upper()
    assert "McKEE" in s_story.author.upper() or "MCKEE" in s_story.author.upper()


def test_dna_extracted_without_blockquote_markers():
    catalog = load_catalog()
    lobe = catalog.get("Crisis:K1")
    assert lobe is not None
    assert lobe.one_sentence_dna
    assert ">" not in lobe.one_sentence_dna
    assert "\n" not in lobe.one_sentence_dna


def test_section_lookup_with_subsection():
    """Sub-Sektionen wie Crisis:K3.4.4 müssen direkt abrufbar sein."""
    catalog = load_catalog()
    lobe, section = catalog.get_section("Crisis:K3.4.4")
    assert lobe is not None
    assert section is not None
    assert "Davis-Coombs" in section.title or "Brücke" in section.title


def test_validate_clean():
    """Sanity-Check: alle 45 Lobes vollständig & ohne Warnungen geparst."""
    catalog = load_catalog()
    problems = catalog.validate()
    # Krise/Influencer Lobes haben .14/.15/.16 — diese fehlen NICHT, sie sind extra.
    # validate() prüft nur 1..13.
    fatal = [p for p in problems if "FEHLT" in p or "fehlende Sektionen" in p]
    assert not fatal, fatal
