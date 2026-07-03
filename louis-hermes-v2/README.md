# Louis & Hermès

Eine ruhige, interaktive Sprach-App für Kinder — ein Bilderbuch, das mitspielt.
Läuft komplett im Browser auf iPad/Tablet. **Kein App-Store, kein Server, kein
API-Key.** Per Link teilbar. Fortschritt wird lokal im Gerät gespeichert.

Diese App ist ein **eigenständiges Projekt** und hat nichts mit dem Rest des
Repos (Marketing Brain) zu tun. Sie liegt nur im Unterordner `louis-hermes/`.

## Das oberste Gesetz: Ruhe

Nichts bewegt sich von selbst. Kein Auto-Advance, keine Timer, kein Countdown,
keine Wertung. Das Kind gibt den Takt — die App wartet immer.

## Wie es funktioniert

Die Geschichte läuft in 20 Beats (Bild + Voice-over). Zwischen den Beats liegt
ruhiges Training:

- **Laut-Übung** — eine Lautkarte zeigt den Laut, dann hört das Mikrofon kurz zu.
  Erkennt es den Laut → weiter. Kommt nichts, fragt es 2–3× sanft nach und geht
  dann trotzdem ruhig weiter (kein „falsch", keine Frustration). Ohne
  Mikrofon-Erlaubnis tippt die Bezugsperson weiter.
- **Spuren folgen** — der Finger zieht Hermès' Fährte nach. Die Linie wartet.
- **Merken** — eine kurze Reihenfolge leuchtet auf, dann tippt das Kind sie nach.
- **Bild-Puzzle** — das passende Teil auswählen. Es rastet ruhig ein.

Reihenfolge und Beat→Training-Mapping stammen 1:1 aus dem Handover
(`src/data/story.ts`). Die fertigen Assets (Beats, Lautkarten, Ansagen) liegen
unter `public/assets/`.

## Live stellen (Vercel — kein Terminal nötig)

1. Auf [vercel.com](https://vercel.com) einloggen, **Add New → Project**, dieses
   Repo importieren.
2. In der Konfigurations-Maske:
   - **Root Directory**: `louis-hermes` (auf „Edit" klicken und diesen Ordner
     wählen — wichtig, damit Vercel die App findet und nicht das Marketing Brain).
   - **Framework Preset**: Vite (wird meist automatisch erkannt).
   - **Environment Variables**: keine nötig.
3. **Deploy** klicken. Fertig — Vercel gibt eine Link-Adresse aus, die man aufs
   iPad schicken kann.

## Lokal entwickeln

```bash
cd louis-hermes
npm install
npm run dev      # Dev-Server auf http://localhost:5173
npm run build    # Production-Build nach dist/
npm run preview  # gebaute Version lokal ansehen
```

## Assets

- `public/assets/beats/` — 20 Beat-Clips (`beat_01`…`beat_21`, ohne 18)
- `public/assets/lautkarten/` — 11 Lautkarten (A E F I L M O P S U + DIEB)
- `public/assets/spielsaetze/` — 4 Ansage-Töne für die Spiele

Alle Assets sind fertig geschnitten. Die App baut sie **nicht** selbst, sie
spielt sie nur einzeln ab und schiebt Training dazwischen.
