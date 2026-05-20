# HANDOFF — Marketing Brain Deploy

**Datum:** 2026-05-20
**User:** Raphael (rjmaidai)
**Repo:** rjmaidai/marketing-brain
**Branch:** main (enthält fertige Next.js-App)

---

## Wo wir stehen

Die App ist fertig und liegt auf `main`. Es geht NUR noch ums Deployen auf Vercel.

Der User ist auf der Vercel-Import-Seite, hat das Repo `rjmaidai/marketing-brain` importiert, sieht die Konfigurations-Maske (Application Preset: Next.js, Root Directory: ./, Environment Variables aufgeklappt).

**Status:** User bekommt beim Deploy Fehlermeldungen. Inhalt unbekannt — nächste Session muss Screenshot anfordern.

## Was der User JETZT tun muss

1. In Vercel-Maske, Block "Environment Variables":
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: sein Anthropic API-Key (`sk-ant-...`)
   - **Environments**: "Production and Preview" (Default)
2. **Deploy** klicken.

Wenn Deploy fehlschlägt → Screenshot der Fehlermeldung anfordern, dann Build-Logs in Vercel öffnen lassen (Tab "Logs" oder "Build Logs" auf der Deploy-Seite).

## Wichtiger Kontext für nächste Session

- User ist deutschsprachig, Schweizer Deutsch ok.
- User ist FRUSTRIERT — letzte Session ist abgestürzt, viel Zeit verloren. **NICHT raten, NICHT spekulieren.** Konkrete Schritte basierend auf dem was er zeigt. Bei Unklarheit: Screenshot anfordern.
- User möchte keine Erklärungen über "warum" — nur klare Klick-Anweisungen.
- **Sprache: einfach, kurz, KEINE Fachwörter.** Nicht "branch", "merge", "deploy", "commit", "PR", "env var" etc. — wenn nötig umschreiben ("Nebenversion", "rüberschieben", "Vercel baut neu", "Schalter in Vercel"). Eine Frage = ja/nein. Wenn was unklar bleibt, User wird wütend (zu Recht).
- User hat KEINEN Zugriff auf Terminal / Code. Er arbeitet nur im Browser (Vercel UI).
- Claude (du in der Cloud-Sandbox) hat KEINEN Zugriff auf den Browser des Users, keine Chrome-Extension, kein Vercel-API-Token. Du kannst NUR ins Repo committen/pushen.

## Repo-Status

- `main` (4686b79): Fertige Next.js 14 App mit Tailwind, Streaming-API gegen Anthropic
  - `app/api/discuss/route.ts` — Streaming-API (claude-sonnet-4-5 default, via `ANTHROPIC_MODEL` override)
  - `lib/heads.ts` — alle 45 Köpfe
  - `lib/brain-prompt.ts` — System-Prompt mit Ritson-Gate
  - `components/` — InputForm, Discussion, MessageBubble, Conclusion
  - `DEPLOY.md` — Setup-Anleitung
- Andere Branches (NICHT benutzen, sind alte Versuche):
  - `claude/build-brain-system-yBsqI` (Python/FastAPI)
  - `claude/marketing-brain-setup-2eDQd` (Python WIP)
  - `claude/build-update-system-Eo22N` (Quelle von main, identisch)
  - `claude/fix-crashed-feature-UYv8p` (leer)

## Modell-Hinweis

`app/api/discuss/route.ts` nutzt per Default `claude-sonnet-4-5`. Falls Vercel-Build fehlschlägt mit "model not found" — Model-ID prüfen und ggf. via `ANTHROPIC_MODEL` env var überschreiben (z.B. `claude-sonnet-4-5-20250929` oder aktuelle Variante).

## Nächste Schritte falls Build grün

1. Vercel öffnet Deploy-URL (z.B. `marketing-brain-xxx.vercel.app`)
2. User testet mit Beispiel-Idee aus PDF-Spec ("App für Kinder, KI-Hörabenteuer")
3. Wenn API-Call schiefgeht → `ANTHROPIC_API_KEY` in Vercel-Settings prüfen, Function-Logs lesen.

---

**Erste Frage an den User in der neuen Session:**
"Bist du noch auf der Vercel-Deploy-Seite? Schick Screenshot von der aktuellen Fehlermeldung."
