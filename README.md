# Marketing Brain

Ein strukturierter Denkraum: 3–5 Köpfe des Marketing-Hirns diskutieren eine Idee
oder ein Problem und liefern am Ende einen belastbaren Nenner plus eine offene
Frage, die der Nutzer selbst beantworten muss.

Kein Chatbot. Kein Q&A. Reibung statt Glättung.

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
2. **Selektor-Call** (non-streaming): Claude wählt 3–5 Köpfe aus den 45
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
    ├── heads.ts               # Die 45 Köpfe mit Metadaten
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
