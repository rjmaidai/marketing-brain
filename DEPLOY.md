# Marketing Brain — Deploy-Anleitung für ganz Dumme (also dich)

Ziel: Die App läuft öffentlich im Web, du tippst eine Idee rein, die Köpfe diskutieren. Kein Terminal, kein Node, nichts installieren.

Geschätzte Zeit: **10 Minuten**.

---

## Was du brauchst

- Ein Anthropic-Account (für den API-Key, kostet ein paar Cent pro Diskussion)
- Ein Vercel-Account (gratis)
- Den GitHub-Account, auf dem das Repo `rjmaidai/marketing-brain` liegt

---

## Schritt 1 — Anthropic API-Key holen (3 Min)

1. Geh auf **https://console.anthropic.com**
2. Login / Account anlegen.
3. **Billing** öffnen, Kreditkarte hinterlegen und 5–10 $ Guthaben aufladen (reicht für sehr viele Diskussionen).
4. Links im Menü auf **API Keys** → **Create Key**.
5. Name z.B. „marketing-brain", **Create**.
6. **Den Key sofort kopieren** (beginnt mit `sk-ant-…`) und in eine Notiz packen — er wird dir nur dieses eine Mal angezeigt.

---

## Schritt 2 — Vercel-Account anlegen (2 Min)

1. Geh auf **https://vercel.com/signup**
2. Klick **Continue with GitHub** und logge dich mit dem GitHub-Account ein, auf dem `rjmaidai/marketing-brain` liegt.
3. Den kostenlosen **Hobby**-Plan wählen, falls gefragt.

---

## Schritt 3 — Repo in Vercel importieren (3 Min)

1. In Vercel oben rechts: **Add New… → Project**.
2. In der Liste „Import Git Repository" das Repo **`rjmaidai/marketing-brain`** suchen → **Import**.
   - Falls das Repo nicht auftaucht: Klick **Adjust GitHub App Permissions** und gib Vercel Zugriff auf das Repo.
3. Auf der Konfigurations-Seite, die jetzt erscheint:
   - **Framework Preset**: Next.js (wird automatisch erkannt)
   - **Root Directory**: leer lassen
   - **Build Command** / **Output Directory**: nicht anfassen, Defaults sind richtig
4. **„Environment Variables" aufklappen** (kleines Dropdown auf der Seite) und genau einen Eintrag hinzufügen:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: dein Key aus Schritt 1 (`sk-ant-…`)
   - **Add** klicken
5. Ganz unten: **Deploy** klicken.

---

## Schritt 4 — Richtigen Branch als Production setzen (1 Min)

Wichtig: Der Code liegt auf dem Branch `claude/build-update-system-Eo22N`, nicht auf `main`. Wenn Vercel `main` deployt, ist die App leer.

**Direkt nach dem ersten Deploy:**

1. In Vercel: das Projekt öffnen → **Settings** (oben) → **Git** (links im Menü).
2. **Production Branch** auf `claude/build-update-system-Eo22N` ändern → **Save**.
3. Zurück zu **Deployments** (oben) → beim aktuellsten Deployment auf die drei Punkte `…` → **Redeploy**.

Beim Redeploy in der Modal-Box den Haken bei „Use existing Build Cache" entfernen, dann **Redeploy**.

---

## Schritt 5 — Benutzen

1. Wenn Vercel fertig gebaut hat (Konfetti im Browser), klick auf **Visit**.
2. Deine App läuft jetzt unter einer URL wie `marketing-brain-xyz.vercel.app`.
3. Idee in das Textfeld tippen (1–3 Sätze), **„Lass die Köpfe sprechen"** klicken.
4. Die 3–5 ausgewählten Köpfe diskutieren live, am Ende kommt der Nenner + die offene Frage.

URL bookmarken oder teilen — fertig.

---

## Wenn was schief geht

### „Application error" oder 500 nach Klick auf „Köpfe sprechen"
→ API-Key fehlt oder ist falsch eingetragen.

1. Vercel → Projekt → **Settings → Environment Variables**.
2. Prüfen, dass `ANTHROPIC_API_KEY` da ist und mit `sk-ant-` beginnt.
3. Falls falsch: Edit, neu speichern.
4. **Deployments → … → Redeploy** (sonst greift die Änderung nicht).

### Seite ist leer oder „404"
→ Wahrscheinlich der falsche Branch wird deployt.

1. **Settings → Git → Production Branch** auf `claude/build-update-system-Eo22N` setzen.
2. **Deployments → … → Redeploy**.

### Anthropic sagt „insufficient credits" oder „rate limit"
→ Guthaben aufladen unter **console.anthropic.com → Billing**.

### Build schlägt fehl mit TypeScript-/Build-Fehler
→ Schick mir den Fehler aus dem Vercel-Build-Log, dann fix ich's.

---

## Was kostet das?

- **Vercel**: gratis im Hobby-Plan, mehr als genug für persönliche Nutzung.
- **Anthropic API**: ca. **0,02–0,05 $ pro Diskussion** (zwei Calls, ~3000 Token zusammen). Mit 5 $ Guthaben hast du also locker 100+ Diskussionen.

---

## Wenn du später was am Code änderst

- Änderung committen + pushen auf den Branch `claude/build-update-system-Eo22N`.
- Vercel deployt automatisch bei jedem Push.

---

Das war's. Wenn irgendwo der Knoten hängt: Screenshot machen und schicken.
