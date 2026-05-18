"""Registry of all 35 lobes across the three brains.

Each lobe is the smallest unit a persona-prompt can be built from. The full
13-section content lives in markdown and gets ingested into Qdrant; this
registry is the metadata + retrieval handle.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Lobe:
    id: str            # e.g. "vol2.S5"
    brain: str         # "social" | "marketing" | "storytelling"
    layer: str         # marketing: Strategie/Audience/...; social: "-"; storytelling: "-"
    name: str          # "Michael Porter"
    dna: str           # one-sentence DNA
    axis_position: str # position on the brain's spine


# --- Social Media Brain (Vol. 1) — Mess-Achse -----------------------------
SOCIAL: list[Lobe] = [
    Lobe("vol1.01", "social", "-", "Gary Vaynerchuk",
         "Aufmerksamkeit ist ein unterbewerteter Rohstoff; sei früh, sei laut, miss nicht.",
         "Miss gar nicht / miss später"),
    Lobe("vol1.02", "social", "-", "Byron Sharp",
         "Marken wachsen durch Reichweite und Verfügbarkeit, nicht durch Loyalität — empirisch belegt.",
         "Miss die richtigen Gesetze"),
    Lobe("vol1.03", "social", "-", "Mark Ritson",
         "Strategie vor Taktik. Die meisten Marketer tun das Gegenteil und reden sich's schön.",
         "Miss erst, wenn du eine messbare Strategie hast"),
    Lobe("vol1.04", "social", "-", "Les Binet & Peter Field",
         "Markenaufbau und Abverkauf sind zwei Maschinen mit zwei Zeithorizonten; ~60/40.",
         "Miss über die richtige Zeitspanne"),
    Lobe("vol1.05", "social", "-", "Rory Sutherland",
         "Die wertvollsten Hebel sind psychologisch und irrational — also miss klüger.",
         "Miss, aber wisse, was deine Messung nicht sieht"),
]

# --- Marketing Brain (Vol. 2) — 5 Schichten -------------------------------
MARKETING_STRATEGY: list[Lobe] = [
    Lobe("vol2.S1", "marketing", "Strategie", "April Dunford",
         "Positioning ist die wichtigste strategische Entscheidung — die meisten treffen sie nie bewusst.",
         "Wirkung durch bewusstes Positioning"),
    Lobe("vol2.S2", "marketing", "Strategie", "Marty Neumeier",
         "Eine Marke ist, was die Welt sagt, dass du bist. ZAG, oder du gehst unter.",
         "Wirkung durch radikale Differenzierung"),
    Lobe("vol2.S3", "marketing", "Strategie", "Al Ries & Jack Trout",
         "Positionierung passiert im Kopf des Konsumenten. Der Erste sein schlägt der Beste sein.",
         "Wirkung durch mentale Verfügbarkeit"),
    Lobe("vol2.S4", "marketing", "Strategie", "Roger Martin",
         "Strategie ist eine Kette aus fünf Entscheidungen — wer keine getroffen hat, hat keine Strategie.",
         "Wirkung durch entschiedene Wahl"),
    Lobe("vol2.S5", "marketing", "Strategie", "Michael Porter",
         "Strategie ist die bewusste Wahl, anders zu sein. Operative Exzellenz ist keine Strategie.",
         "Wirkung durch strukturelle Differenzierung"),
]

MARKETING_AUDIENCE: list[Lobe] = [
    Lobe("vol2.A1", "marketing", "Audience", "Clayton Christensen",
         "Kunden engagieren Produkte für einen Job, der erledigt werden muss.",
         "Wirkung durch Job-Verständnis"),
    Lobe("vol2.A2", "marketing", "Audience", "Bob Moesta",
         "Verstehe, was den Kunden vorher unzufrieden machte und was ihn jetzt zog — sonst weisst du nicht, an wen du verkauft hast.",
         "Wirkung durch Switch-Verständnis"),
    Lobe("vol2.A3", "marketing", "Audience", "Robert Cialdini",
         "Sieben Prinzipien steuern Zustimmung: Reziprozität, Verbindlichkeit, sozialer Beweis, Sympathie, Autorität, Knappheit, Einheit.",
         "Wirkung durch Einflussprinzipien"),
    Lobe("vol2.A4", "marketing", "Audience", "Daniel Kahneman",
         "Menschen entscheiden nicht rational — System 1 und System 2. Marketing redet meistens zum falschen.",
         "Wirkung durch Bias-Verständnis"),
    Lobe("vol2.A5", "marketing", "Audience", "Indi Young",
         "Bevor du baust, hör zu — bis du die mentalen Modelle deiner Audience kartieren kannst.",
         "Wirkung durch tiefes Zuhören"),
]

MARKETING_DISTRIBUTION: list[Lobe] = [
    Lobe("vol2.D1", "marketing", "Distribution", "Seth Godin",
         "Marketing ist, was du einer Gruppe ermöglichst, die zueinander finden will.",
         "Wirkung durch Tribe-Bildung"),
    Lobe("vol2.D2", "marketing", "Distribution", "Brian Balfour",
         "Growth ist kein Trick und kein Kanal — Growth ist ein Loop, der sich selbst nährt.",
         "Wirkung durch Growth-Loops"),
    Lobe("vol2.D3", "marketing", "Distribution", "Andrew Chen",
         "Jedes Wachstum hat ein Cold-Start-Problem, kein Kanal überlebt die Sättigung.",
         "Wirkung durch Kanal-Diversifikation"),
    Lobe("vol2.D4", "marketing", "Distribution", "Sean Ellis",
         "Product-Market-Fit ist ein Zustand, kein Slogan. Ohne ihn ist Growth-Hacking teures Rumprobieren.",
         "Wirkung erst nach PMF"),
    Lobe("vol2.D5", "marketing", "Distribution", "Jonah Berger",
         "Was viral geht, geht nicht zufällig viral — sechs Hebel (STEPPS) sind lehrbar.",
         "Wirkung durch Viralitätshebel"),
]

MARKETING_CONVERSION: list[Lobe] = [
    Lobe("vol2.C1", "marketing", "Conversion", "Eugene Schwartz",
         "Werbung erzeugt nicht Wunsch — sie kanalisiert das Wunschsystem, das schon im Markt da ist.",
         "Wirkung durch Awareness-Stage-Matching"),
    Lobe("vol2.C2", "marketing", "Conversion", "Gary Halbert",
         "Ein hungriger Markt schlägt jedes Produkt, jedes Copywriting, jede Strategie.",
         "Wirkung durch Marktwahl"),
    Lobe("vol2.C3", "marketing", "Conversion", "David Ogilvy",
         "Der Konsument ist keine Idiotin — schreib für die klügste Person, die du kennst.",
         "Wirkung durch Respekt + Handwerk"),
    Lobe("vol2.C4", "marketing", "Conversion", "Alex Hormozi",
         "Wert mal Wahrscheinlichkeit, geteilt durch Zeit und wahrgenommenen Aufwand — Grand Slam Offer.",
         "Wirkung durch Offer-Mechanik"),
    Lobe("vol2.C5", "marketing", "Conversion", "Russell Brunson",
         "Funnels sind Geschichten in Schritten. Wer den Funnel nicht als Story versteht, baut Trichter, durch die niemand fällt.",
         "Wirkung durch Story-Funnel"),
]

MARKETING_RETENTION: list[Lobe] = [
    Lobe("vol2.R1", "marketing", "Retention", "Fred Reichheld",
         "Loyalität ist Profit, der wartet. NPS ist die einfachste Zahl, die zeigt, ob du sie verdienst.",
         "Wirkung durch Empfehlungs-Ökonomie"),
    Lobe("vol2.R2", "marketing", "Retention", "Joey Coleman",
         "Die ersten 100 Tage nach dem Kauf entscheiden über die nächsten zehn Jahre.",
         "Wirkung durch Onboarding"),
    Lobe("vol2.R3", "marketing", "Retention", "Kevin Kelly",
         "1000 True Fans reichen — wenn du sie wirklich hast.",
         "Wirkung durch Tiefe statt Reichweite"),
    Lobe("vol2.R4", "marketing", "Retention", "Nir Eyal",
         "Habit Loops: Trigger, Action, Reward, Investment. Bewusst designt, nicht zufällig.",
         "Wirkung durch Gewohnheits-Design"),
    Lobe("vol2.R5", "marketing", "Retention", "Pat Flynn",
         "Superfans entstehen, wenn Beziehung wichtiger ist als Reichweite.",
         "Wirkung durch Superfan-Bindung"),
]

# --- Storytelling Brain — Haftungs-Achse ----------------------------------
STORYTELLING: list[Lobe] = [
    Lobe("story.S1", "storytelling", "-", "Robert McKee",
         "Struktur ist das Skelett der Seele; Geschichte ist die Metapher fürs Leben, erzählt über Wertewechsel in Szenen.",
         "Haftung durch Form"),
    Lobe("story.S2", "storytelling", "-", "Joseph Campbell",
         "Archetypisches Tiefenmuster resoniert — und wird zur tödlichen Formel, wenn man es kopiert statt versteht.",
         "Haftung durch Archetyp (und ihr Missbrauch)"),
    Lobe("story.S3", "storytelling", "-", "Kurt Vonnegut",
         "Form einer Geschichte ist eine einfache Gefühlskurve; erzähl ökonomisch, sei grausam zu Figuren, lass Traurigkeit und Komik dieselbe Luft atmen.",
         "Haftung durch Gefühlsform & Stimme"),
    Lobe("story.S4", "storytelling", "-", "Chip & Dan Heath",
         "Ideen bleiben hängen durch SUCCES: Simple, Unexpected, Concrete, Credible, Emotional, Stories — der Fluch des Wissens zerstört das.",
         "Haftung durch Klebrigkeit (messbar)"),
    Lobe("story.S5", "storytelling", "-", "Will Storr",
         "Das Gehirn ist eine Vorhersagemaschine, Geschichte ist die kontrollierte Beschädigung des Selbst-Mythos.",
         "Haftung durch den Defekt des Selbst"),
]

LOBES: list[Lobe] = (
    SOCIAL
    + MARKETING_STRATEGY
    + MARKETING_AUDIENCE
    + MARKETING_DISTRIBUTION
    + MARKETING_CONVERSION
    + MARKETING_RETENTION
    + STORYTELLING
)

_BY_ID: dict[str, Lobe] = {lobe.id: lobe for lobe in LOBES}


def lobes_by_ids(ids: list[str]) -> list[Lobe]:
    return [_BY_ID[i] for i in ids if i in _BY_ID]


def lobes_by_layer(layer: str) -> list[Lobe]:
    return [l for l in LOBES if l.layer == layer]
