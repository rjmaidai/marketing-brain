"""Tests für die Routing-Regeln (Spec §3–§5)."""
from __future__ import annotations

from marketing_brain.catalog import load_catalog
from marketing_brain.router import Mode, classify, route


def test_crisis_dominiert():
    """Sobald 'Krise', 'Vorwurf', 'dpa' o. ä. fällt → Crisis-Modus."""
    assert classify("Wir haben eine Krise!") is Mode.CRISIS
    assert classify("Pressevorwurf wegen Datenleck.") is Mode.CRISIS
    assert classify("dpa fragt an. Was tun?") is Mode.CRISIS


def test_marketing_kette_default():
    """Generische 'wir wollen launchen'-Anfragen → marketing_kette."""
    plan = route("Wir wollen eine neue B2B-Marke launchen, von Strategie bis Retention.")
    assert plan.mode is Mode.MARKETING_KETTE
    # Ritson-Vorgate ist drin:
    assert any("Ritson" in n for n in plan.sequence_notes)
    # PMF-Gate-Notiz drin
    assert any("PMF" in n for n in plan.sequence_notes)
    # Halbert-Test drin
    assert any("Halbert" in n for n in plan.sequence_notes)


def test_distribution_pmf_gate_zuerst():
    """D4 (Sean Ellis) muss vor D2 (Balfour) feuern."""
    plan = route("Welche growth-loops sollen wir bauen?")
    assert plan.mode is Mode.DISTRIBUTION
    pmf_idx = plan.primary_lobes.index("Distribution:D4")
    loops_idx = plan.primary_lobes.index("Distribution:D2")
    assert pmf_idx < loops_idx, plan.primary_lobes


def test_conversion_halbert_zuerst():
    """C2 (Halbert „hungriger Markt") muss vor C4 (Hormozi-Offer) feuern."""
    plan = route("Wir bauen eine neue Landingpage, wie sieht das Offer aus?")
    assert plan.mode is Mode.CONVERSION
    halbert_idx = plan.primary_lobes.index("Conversion:C2")
    hormozi_idx = plan.primary_lobes.index("Conversion:C4")
    assert halbert_idx < hormozi_idx, plan.primary_lobes


def test_skeptiker_pflicht_pro_modus():
    """Jeder Modus hat einen pflicht-Skeptiker."""
    assert route("Wir haben eine Krise").skeptic == "Crisis:K5"
    assert route("Helft mit unserem Storytelling").skeptic == "Storytelling:S5"
    assert route("Wir bauen eine Influencer-Strategie").skeptic == "Influencer:I5"
    # Marketing-Hirn-Modi → Sutherland
    assert route("Welche Strategie passt zu unserem SaaS?").skeptic == "SocialMedia:05"


def test_offene_achsen_werden_nicht_geglaettet():
    """Crisis: K1↔K3 (Diagnose vs Tempo) muss erhalten bleiben."""
    plan = route("Pressevorwurf, dpa, Datenleck.")
    axes = [(a, b) for a, b, _ in plan.open_axes]
    assert ("Crisis:K1", "Crisis:K3") in axes
    assert ("Crisis:K3", "Crisis:K5") in axes


def test_storytelling_storr_als_schiedsrichter():
    plan = route("Wie strukturiere ich meine Markenstory?")
    assert plan.mode is Mode.STORYTELLING
    assert plan.skeptic == "Storytelling:S5"
    axes = [(a, b) for a, b, _ in plan.open_axes]
    assert ("Storytelling:S1", "Storytelling:S3") in axes


def test_influencer_i5_pflicht():
    plan = route("Wir suchen Creator für eine Kampagne — was ist das Asset?")
    assert plan.mode is Mode.INFLUENCER
    assert plan.skeptic == "Influencer:I5"


def test_reim_partner_werden_befuellt():
    """Eine SocialMedia/Crisis-Frage bekommt mindestens einen Reim-Partner."""
    plan = route("Pressevorwurf, dpa.")
    # Crisis:K1 (Gesetz) hat einen Reim auf SocialMedia:02 / Storytelling:S1 / Influencer:I1
    # Wir prüfen nur, dass die Mechanik überhaupt feuert:
    assert len(plan.rhyme_partners) >= 1


def test_routing_filtert_unbekannte_addressen_mit_catalog():
    catalog = load_catalog()
    plan = route("Wir bauen eine neue Marke.", catalog=catalog)
    for addr in plan.primary_lobes:
        assert catalog.get(addr) is not None
