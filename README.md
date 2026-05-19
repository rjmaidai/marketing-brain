# Marketing-Hirn

Reference-First / Closed-Loop-Engine über **45 Lobes in 9 Segmenten / 5 Sub-Hirnen**:
Social Media · Strategie · Audience · Distribution · Conversion · Retention · Storytelling · Krise · Influencer.

Die Engine zieht Köpfe **nicht** nach semantischer Ähnlichkeit, sondern nach
hartkodierten Sequenz-Gates (Marketing-Kette, PMF-Gate, Halbert-Test,
Davis-Coombs-Brücke, K5-Gate, I5-Auszahlungsstufe) und bringt für jedes Segment ein
**Skeptiker-Korrektiv** mit an den Tisch.

Alle Ausgaben sind referenziert: jede Aussage trägt eine Lobe-Adresse
`{Segment}:{Lobe}.{Sektion}` (z. B. `Crisis:K3.4.4` für die Davis-Coombs-Brücke).

---

## Setup

```bash
pip install -e .
```

Optional für die Live-Engine (Claude Opus 4.7 mit Prompt-Caching auf den 45 Lobes):

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Ohne Key läuft die Engine im **Mock-Modus**: Routing + regelkonforme
Antwort-Skelette aus den geparsten Lobe-DNAs, kein API-Call.

---

## CLI

```bash
brain validate                       # 45 Lobes vollständig?
brain list                           # alle Köpfe übersicht
brain list --segment crisis
brain show Strategie:S1              # Lobe-Übersicht (DNA, Achse, Sektionen)
brain show Crisis:K3.4.4             # einzelne Sektion / Sub-Konzept
brain route "Pressevorwurf, dpa fragt an."     # nur den Plan zeigen
brain ask "..."                                # Vollantwort (Mock oder Live)
brain ask "..." --show-prompt                  # zusätzlich den vollständigen Prompt zeigen
brain ask "..." --json                         # strukturierte Ausgabe
brain rhymes --address SocialMedia:05          # Reim-Partner über die Hirne
```

---

## Architektur

```
data/
  lobes/<segment>/<id>_<author>.md   # die 45 Köpfe, segment-qualifiziert
  indexes/<segment>.md               # 5 Cortex-Dokumente

src/marketing_brain/
  parser.py     # md -> Lobe-Struktur (13- oder 16-teilig, Sub-Sektionen)
  catalog.py    # adressierbar mit {Segment}:{Lobe}[.Sektion]
  router.py     # Klassifikation + Sequenz-Gates + Skeptiker + offene Achsen
  prompts.py    # Hirn-Stimme + 7 nicht verhandelbare Regeln (R1-R7)
  engine.py     # Mock + Live (Anthropic SDK, Prompt-Caching auf Bundle)
  cli.py        # `brain ...`
```

### Die 7 Regeln (R1–R7)

| | |
|---|---|
| **R1** | **Reference-First.** Jede Aussage durch `{Segment}:{Lobe}.{Sektion}` gestützt. |
| **R2** | **Sequenz-Gates.** Marketing-Kette / PMF-Gate / Halbert-Test / Davis-Coombs / K5-Gate / I5-Auszahlung. |
| **R3** | **Skeptiker-Korrektiv** vor jeder Empfehlung (Sutherland · Dezenhall · I5 · Storr). |
| **R4** | **Offene Achsen nicht glätten** (Sharp↔Dunford, McKee↔Vonnegut, K1↔K3, …). |
| **R5** | **Pitch (.11)** und **Gehirn-Regel (.8)** wörtlich ziehen, wenn passend. |
| **R6** | **Verzicht** in jeder Empfehlung. |
| **R7** | **Reim-Brücken** zwischen den Hirnen knapp benennen, max. 2. |

### Sequenz-Gates (Auswahl)

- **Marketing-Kette** mit Ritson-Vorgate: Diagnose → Strategie → Taktik, dann erst
  Audience/Distribution/Conversion/Retention.
- **PMF-Gate** (Distribution:D4 Sean Ellis) **vor** D2 Balfour / D5 Berger.
- **Halbert-Test** (Conversion:C2) **vor** C4 Hormozi / C5 Brunson.
- **Davis-Coombs-Brücke** (Crisis:K3.4.4): K3-Schutzinfo schnell, finale Schuld-/Image-Aussage erst nach K1-Cluster-Diagnose.
- **K5-Gate** (Crisis:K5 Dezenhall) vor jeder vollständigen Offenlegung.
- **I5-Auszahlungsstufe** (Influencer:I5 Owned-Audience-Operator): kein I1-I4-Lobe ist „fertig" ohne I5-Transferpfad.

### Reim-Achsen über die Hirne

| Achse | Lobes |
|---|---|
| Gesetz/Empirie | SocialMedia:02 Sharp · Crisis:K1 Coombs · Storytelling:S1 McKee · Influencer:I1 MrBeast |
| Skeptiker | SocialMedia:05 Sutherland · Crisis:K5 Dezenhall · Influencer:I5 Owned-Audience · Storytelling:S5 Storr |
| Reflex/Tempo | SocialMedia:01 Vaynerchuk · Crisis:K3 Davis · Influencer:I2 Chamberlain |
| Handwerk/Disziplin | SocialMedia:03 Ritson · Crisis:K2 Benoit · Influencer:I3 MKBHD |
| Lange-Welle/Mess | SocialMedia:04 Binet & Field · Crisis:K4 Edelman |
| Klebrigkeit/Subtraktion | Storytelling:S4 Heath · Influencer:I4 Khaby Lame |
| Vertrauens-Bremse | Crisis:K4 · Influencer:I3 · Influencer:I5 |

---

## Live-Modus

Der `Engine.ask(..., mock=False)`-Pfad baut den Prompt in drei Schichten:

1. **System-Stimme** (klein, frozen) — Hirn-Voice + R1-R7.
2. **Lobe-Bundle** (~50k Tokens, frozen) — alle 45 Köpfe im Volltext, mit
   `cache_control: {type: "ephemeral", ttl: "1h"}`.
3. **User-Turn** (variabel) — die konkrete Anfrage + der Routing-Plan
   (aktive Lobes, Sequenz, Skeptiker, offene Achsen, Reim-Partner).

Damit zahlt der zweite Aufruf nur ~10 % der Input-Tokens. Modell-Default:
`claude-opus-4-7`. Anpassbar via `brain ask ... --model claude-sonnet-4-6`.

---

## Tests

```bash
pytest -q
```

Deckt ab: Parser-Sanity (alle 45 Köpfe, Sub-Sektionen wie K3.4.4), Routing-Klassifikation
(Krise dominiert, Default = Marketing-Kette), die hartkodierten Gates
(PMF vor Loop, Halbert vor Hormozi), die Pflicht-Skeptiker pro Modus, die offenen Achsen.
