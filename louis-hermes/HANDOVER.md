# HANDOVER — Louis & Hermès

**Interaktive Sprach-App · Bilderbuch, das mitspielt**
Stand: 3. Juli 2026 · letzter gesicherter Commit: `84a805a`

Dieses Dokument hält fest, **was die App ist, wo alles liegt, was enthalten ist,
was wir gemeinsam gebaut haben und wie es weitergeht.** Es ist bewusst für
Nicht-Techniker geschrieben (mit technischen Details am Ende).

---

## 0. Das Wichtigste zuerst: Ist alles gesichert?

**Ja — vollständig und dauerhaft.** Der komplette Spielstand ist nicht an diesen
Chat gebunden:

- Der ganze Code **und alle Medien** (Videos, Stimmen, Bilder) liegen auf
  **GitHub** (Projekt `rjmaidai/marketing-brain`, Ordner `louis-hermes`) — an
  zwei Stellen (Hauptversion `main` + Arbeits-Branch), beide auf demselben Stand.
- Die App läuft **live auf Vercel** (dein Link).
- **Wenn dieser Chat endet, bleibt alles bestehen.** Du brauchst den Chat nicht,
  um die App zu behalten.

**Bild dazu:** *Vercel = das Schaufenster* (was dein Kind über den Link sieht).
*GitHub = der Lagerraum dahinter* (wo alles sicher liegt). Beide gehören dir.

---

## 1. Was ist die App?

**Louis & Hermès** ist eine ruhige, interaktive Sprach-Lern-App für ein Kind
(„Louis"). Sie erzählt in **20 Beats** (Bild + Voice-over) die Geschichte des
Polizeihundes **Hermès** und schiebt zwischen die Beats kleine Sprach- und
Denk-Übungen. Der Antrieb: **die Geschichte ist die Belohnung** — wer übt, sieht,
wie es weitergeht.

**Das oberste Gesetz: Ruhe.** Nichts bewegt sich von selbst, kein Zeitdruck,
keine Punkte. **Das Kind gibt den Takt, nie die App.** Übergänge sind langsam und
weich.

Technisch: eine **React-Single-Page-App**, die **komplett im Browser** auf
iPad/Tablet läuft. **Kein App-Store, kein Server, kein API-Key.** Fortschritt wird
lokal auf dem Gerät gespeichert.

---

## 2. Wo liegt was (die Landkarte)

| Was | Wo |
|---|---|
| Code + alle Medien | GitHub: `rjmaidai/marketing-brain`, Ordner **`louis-hermes/`** |
| Live-App | Vercel (dein Projekt), per Link teilbar |
| Diese App ist getrennt von | „Marketing Brain" (liegt nur im selben GitHub-Projekt, teilt sich den Aktenschrank) |

Vercel baut die App **automatisch neu**, sobald etwas auf die Hauptversion
gepusht wird — nach jeder Änderung war die aktualisierte App also nach ~1 Minute
unter demselben Link live.

---

## 3. Was ist alles enthalten (Inventar)

Alle fertigen Medien sind eingebettet (die App baut sie **nicht** selbst):

- **20 Beat-Clips** — `louis-hermes/public/assets/beats/beat_01…beat_21.mp4`
  (ohne 18; jeder Clip: Bild + Voice-over).
- **11 Lautkarten-Videos** — `…/assets/lautkarten/Lautkarte_<X>.mp4`
  Laute **A E F I L M O P S U** + Story-Karte **DIEB**.
- **4 Spiel-Ansagen** — `…/assets/spielsaetze/` („jetzt bist du dran",
  „merke die Reihenfolge", „folge der Spur", „wähle das richtige Teil").
- **Richtig/Falsch-Rückmeldung** — `…/assets/feedback/` (`richtig.png` +
  `richtig.mp3`, `falsch.png` + `falsch.mp3`; Hermès Daumen hoch / freundliches
  Schulterzucken).
- **Zusatz-Ansage** — `…/assets/voice/hoer_gut_zu.mp3` („Hör gut zu, lieber
  Louis", vor jeder Lautkarte).

---

## 4. Wie es sich spielt (Ablauf & Regeln)

Die Geschichte läuft Beat für Beat. Nach bestimmten Beats kommt eine Übung, dann
geht die Geschichte weiter.

**Ablauf eines Beats:** Bild blendet **langsam ein** → erst wenn das Bild da ist,
startet das **Voice-over** → am Ende erscheint ein **großer Weiter-Knopf** über
dem Bild (die ganze Bildfläche ist tippbar). Louis tippt, wenn er bereit ist.

**Die Übungen (aus der Story geboren):**

- **Laut-Übung** — „Hör gut zu" → die Lautkarte spielt (die Mutter spricht den
  Laut) → „Jetzt bist du dran": das Mikrofon hört kurz zu. Erkennt es den Laut →
  Lob und weiter. Kommt nichts oder ist es falsch → freundliches „probiere es
  nochmal, lieber Louis", und die **ganze Karte läuft erneut**. Nach spätestens
  3 Versuchen geht es ruhig weiter (nie feststecken). Ohne Mikrofon-Erlaubnis
  tippt die Bezugsperson weiter.
- **Merken** — sechs große Kacheln (Ausschnitte des **nächsten** Story-Bildes)
  leuchten in einer Reihenfolge auf, jede mit eigenem Ton; das Kind tippt sie
  nach. Bei Fehler wird die **komplette Aufgabe neu gestellt**.
- **Spuren folgen** — der Finger zieht Hermès' Fährte nach; die Linie wartet.
- **Bild-Puzzle** — das **nächste** Story-Bild fehlt ein Stück; das Kind wählt
  das passende Teil. Die Vorfreude aufs kommende Bild motiviert.

**Faire Regeln überall:** kein Zeitdruck, keine Bestrafung; „falsch" ist immer
ermutigend gemeint. Während eine Frage/Ansage läuft, ist **nichts anklickbar** —
erst danach. Bei Minispielen geht es nach **spätestens 3 Fehlversuchen** weiter.

---

## 5. Was wir gemeinsam gebaut haben (Chronik)

1. **Grundgerüst** — ruhige React/Vite-App im Ordner `louis-hermes`, komplett
   getrennt vom Marketing Brain; Storyboard als Daten (Beat→Übung 1:1 aus dem
   Handover-Manifest, Beat 18 gestrichen).
2. **Bild-Puzzle zeigt das nächste Story-Bild** — statt abstrakter Flächen wird
   das kommende Bild zerlegt (Motivation).
3. **Lautkarten voll sichtbar** (16:9-Rahmen) **und Beats starten automatisch**
   (ein durchgehendes Video-Fenster, beim Start freigeschaltet — löst die
   iPad-Sperre für Auto-Start mit Ton).
4. **Kind-freundlichere Bedienung** — großer Weiter-Knopf über dem Beat, frühere
   „Jetzt bist du dran"-Ansage, größere Puzzle-Teile.
5. **Mikrofon-Erkennung** für die Laut-Übung: erkannt → weiter, sonst 2–3× sanft
   nachfragen, dann ruhig weiter (nie frustrieren).
6. **Kachel-Töne + Merken mit Story-Bild + Richtig/Falsch-Feedback** (deine
   generierten Bilder & Stimmen von Hermès eingebaut).
7. **Zuverlässiges Audio** — ein fester Audio-Kanal für alle Stimmen/Töne
   (spielen konsistent); Feedback immer gleich lang, mit Stimme, **nicht
   wegklickbar**.
8. **Ruhe zwischen den Phasen** — langsame Ein-/Ausblendungen; Beat startet erst
   nach dem Einblenden; das Lob „überbrückt" den Wechsel (kein Aufblitzen).
9. **Ansage „Hör gut zu"** vor jeder Lautkarte.
10. **„Drücke auf weiter"** zunächst als Erinnerung, dann auf deinen Wunsch
    **ganz entfernt** (Weiter-Knopf ist still).
11. **Minispiele nie feststecken** — nach spätestens 3 Fehlversuchen weiter;
    Merken/Puzzle stellen die **ganze Aufgabe** bei Fehler neu; Klick-Sperre,
    solange die Frage läuft.
12. **Lautkarten pro Durchlauf neu gemischt** — alle 10 Buchstaben-Karten kommen
    über die Durchläufe dran; der **DIEB bleibt fix** (Beat 14).
13. **Laut-Ergebnis nicht mehr hastig** — Eingabemaske steht ≥ 2 s; nach
    erkanntem Ton ≥ 1 s Ruhe, dann erst das Ergebnis.

---

## 6. Wie man es live stellt / aktualisiert (Vercel)

Die App liegt im Unterordner `louis-hermes`. Beim **ersten** Einrichten in Vercel:
Projekt importieren → **Root Directory** auf `louis-hermes` setzen → **Deploy**.
Keine Environment Variables nötig.

Danach: **jede Änderung auf der Hauptversion (`main`)** löst bei Vercel
**automatisch** einen neuen Build aus — nach ~1 Minute ist die App unter dem
gleichen Link aktuell.

**Link umbenennen:** Der Link kommt vom **Vercel-Projektnamen**
(Settings → General → Project Name). Umbenennen z. B. auf `louis-hermes` ändert
die Adresse zu `louis-hermes.vercel.app`.

---

## 7. Wie man es lokal entwickelt (für Technik)

```bash
cd louis-hermes
npm install
npm run dev      # Dev-Server auf http://localhost:5173
npm run build    # Production-Build nach dist/
npm run preview  # gebaute Version lokal ansehen
```

Stack: **Vite + React 18 + TypeScript**, reine Client-App, keine Secrets. Audio
über die Web-Audio-API (ein gemeinsamer, per Fingergeste freigeschalteter Kanal).

**Struktur:**

```
louis-hermes/
├── public/assets/         # alle fertigen Medien (beats, lautkarten, spielsaetze, feedback, voice)
├── src/
│   ├── App.tsx            # Ablauf: Beats, Fades, Video-Element, Übergänge
│   ├── data/story.ts      # Storyboard, Beat→Übung-Mapping, Lautkarten-Mischung
│   ├── components/
│   │   ├── StartScreen.tsx    # Start + Mikrofon-Erlaubnis + Vorladen
│   │   ├── LautUebung.tsx     # Lautkarte + „hör gut zu" + Mikrofon-Erkennung
│   │   ├── SpurenFolgen.tsx   # Spiel „Spuren folgen"
│   │   ├── Merken.tsx         # Spiel „Merken" (Bild-Kacheln + Töne)
│   │   └── BildPuzzle.tsx     # Spiel „Bild-Puzzle" (nächstes Story-Bild)
│   └── lib/
│       ├── audio.ts       # zentraler Audio-Kanal (Stimmen, Ansagen, Kachel-Töne)
│       ├── feedback.ts    # Richtig/Falsch-Ebene (Bild + Stimme, nicht wegklickbar)
│       ├── poster.ts      # Standbild aus dem nächsten Beat holen (für Puzzle/Merken)
│       └── progress.ts    # Fortschritt lokal (localStorage)
```

---

## 8. Stellschrauben (leicht änderbar)

- **Einblend-Tempo der Beats** — `App.tsx`: `FADE_IN_MS` (900), `FADE_OUT_MS`
  (500), `PLAY_DELAY_MS` (1000).
- **Laut-Übung Timing** — `LautUebung.tsx`: `MIN_MASK_MS` (2000),
  `POST_INPUT_MS` (1000), `LISTEN_MS` (5200), `MAX_ATTEMPTS` (3).
- **Fehlversuche bis Weitergehen** — je `MAX_ATTEMPTS` in `Merken.tsx` /
  `BildPuzzle.tsx` (aktuell 3).
- **Mikrofon-Empfindlichkeit** — `LautUebung.tsx`, Schwelle im Zuhör-Abschnitt.
- **Länge der Feedback-Ebene** — `feedback.ts`: `MIN_MS`, `HOLD_MS`, `BRIDGE_MS`.

---

## 9. Mögliche nächste Schritte (offen, optional)

- **Eigenes GitHub-Projekt** für Louis & Hermès (statt Unterordner) — sauberer
  „eigener Aktenschrank".
- **Stufe 2 der Laut-Erkennung** (Phonem-Ähnlichkeit als stille Zusatzschicht,
  wie im Ursprungs-Handover skizziert).
- Feintuning von Timing/Lautstärke nach weiterem Testen mit dem Kind.

---

*Wenn eine einzige Sache hängen bleiben soll: **Das Kind gibt den Takt, nie die
App. Langsam ist richtig.***
