# Marketing Brain

Ein strukturierter Denkraum: 3–5 Köpfe des Marketing-Hirns diskutieren eine Idee
oder ein Problem und liefern am Ende einen belastbaren Nenner plus eine offene
Frage, die der Nutzer selbst beantworten muss.

Kein Chatbot. Kein Q&A. Reibung statt Glättung.

## Zwei Zugänge

- **`/` — Das Gremium.** 9–12 Köpfe streiten sichtbar und liefern `[ERKENNTNIS]`
  + `[OFFENE FRAGE]`. Reibung, nicht Konsens.
- **`/berater` — Der Video-Berater.** Ein Echtzeit-Videoagent für Firmen mit
  Marketing-Anliegen. Hinter ihm urteilen dieselben 51 Köpfe (intern), er
  spricht aber mit **einer** souveränen Stimme — per Sprache oder Text bedienbar.
  Echtzeit-Gesicht via **Anam**, Stimme via **OpenAI** (gpt-4o-mini-tts); ohne
  Keys läuft er über einen animierten Avatar + Browser-Stimme.

### Video-Berater — wie er funktioniert

1. Firma schildert ihr Anliegen (Sprache via Web Speech API oder Text).
2. **Firmenprofil / Ideologie** (optional): Die Firma hinterlegt Positionierung,
   Werte und Weltsicht (lokal im Browser gespeichert). Das fließt in Selektion
   und Beratung ein — der Berater gewichtet die Argumente danach, bleibt aber
   ehrlich, wenn die Ideologie mit solidem Marketing kollidiert.
3. **Dateien analysieren** (optional): Die Firma hängt Dateien an — **PDF**
   (Studien, Meta-Analysen, Reports; nativ von Claude gelesen inkl. Tabellen),
   **Bilder** (Charts) oder **Text** (txt/md/csv/json). Der Berater stützt seine
   Empfehlung konkret auf deren Inhalt. (Grenzen: max. 6 Dateien, ~4 MB gesamt —
   Vercel-Body-Limit; größere PDFs bitte aufteilen.)
5. **Interne Selektion:** Claude wählt die passenden Köpfe (unsichtbar).
6. **Souveräne Synthese** (streaming): der Berater **vereint drei bis fünf
   Kopf-Argumente** zu einem Urteil — zeigt, wo sie konvergieren, benennt den
   echten Trade-off, wo sie sich widersprechen, und bezieht Position. Endet mit
   der einen Frage, die die Firma selbst beantworten muss.
7. **Stimme (OpenAI):** Jeder fertige Satz wird per `gpt-4o-mini-tts` vertont —
   der Berater beginnt zu sprechen, sobald der erste Satz steht.
8. **Gesicht (Anam):** Die OpenAI-Stimme wird als rohes PCM über Anams
   BYO-Audio-Kanal ins Echtzeit-Gesicht gestreamt, das lippensynchron spricht.

Die 51 Köpfe umfassen auch eine **Schweizer Perspektive** (Marke, Verhaltens-
ökonomie, Medien-Pionier, St. Galler Leistungs-Konsequenz, Klarheit/Haltung,
digitale Öffentlichkeit) — als Denk-Werkzeuge, nicht als Biografien.

**Provider-Kette (jede Stufe degradiert sauber):**

| Ebene | Primär | Fallback |
|-------|--------|----------|
| Denken | Claude (Marketing-Hirn, 51 Köpfe + Firmenprofil) | — (Pflicht) |
| Stimme | OpenAI `gpt-4o-mini-tts` (`OPENAI_API_KEY`) | Browser-Sprachsynthese |
| Gesicht | Anam Echtzeit-Avatar (`ANAM_API_KEY` + Persona/Avatar) | animierter Orb |

Alle API-Keys bleiben **server-seitig**. Der Browser erhält nur kurzlebige
Session-Tokens (`/api/anam-token`) bzw. fertiges Audio (`/api/tts`). Ein
alternativer HeyGen-Avatar liegt weiterhin im Repo (`lib/heygen.ts`,
`/api/heygen-token`), ist aber nicht der Standard-Provider.

## Du willst's einfach nur benutzen?

→ **[DEPLOY.md](./DEPLOY.md)** — Schritt-für-Schritt-Anleitung zum Live-Stellen via Vercel. Kein Terminal nötig.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Anthropic API (`claude-sonnet-4-20250514`), Streaming via Server-Sent Events

## Setup

```bash
npm install
cp .env.local.example .env.local
# ANTHROPIC_API_KEY eintragen
npm run dev
```

Dann http://localhost:3000 öffnen.

## Wie es funktioniert

1. Nutzer gibt eine Idee oder ein Problem ein (1–3 Sätze).
2. **Selektor-Call** (non-streaming): Claude wählt 9–12 Köpfe aus den 51
   verfügbaren und prüft Sequenz-/Ritson-/PMF-Gate.
3. **Diskussions-Call** (streaming): die ausgewählten Köpfe diskutieren in
   strukturiertem Format. Widersprüche werden explizit benannt, nicht
   geglättet.
4. Am Ende: `[ERKENNTNIS]` (der Nenner) + `[OFFENE FRAGE]` (die Frage, die der
   Nutzer selbst beantworten muss).

## Struktur

```
marketing-brain/
├── app/
│   ├── api/discuss/route.ts   # Streaming-API (SSE)
│   ├── layout.tsx
│   ├── page.tsx               # Input + Diskussion
│   └── globals.css
├── components/
│   ├── InputForm.tsx
│   ├── Discussion.tsx
│   ├── MessageBubble.tsx
│   └── Conclusion.tsx
└── lib/
    ├── heads.ts               # Die 51 Köpfe mit Metadaten (inkl. CH-Perspektive)
    ├── segments.ts            # Die 9 Segmente
    ├── brain-prompt.ts        # System-Prompts (Selektion + Diskussion)
    ├── parser.ts              # Stream-Parser für [KOPF: Name] / [ERKENNTNIS] / [OFFENE FRAGE]
    └── types.ts
```

## Skripte

- `npm run dev` — Dev-Server
- `npm run build` — Production-Build
- `npm run start` — Production-Server
- `npm run typecheck` — TypeScript ohne Emit
- `npm run lint` — Next-Lint

## Hinweise

- Ohne `ANTHROPIC_API_KEY` liefert die API-Route 500 mit hilfreichem Hinweis.
- Mobile-first: Layout ist auf Smartphones lesbar.
- Kein Login, keine Auth — direkt nutzbar.
