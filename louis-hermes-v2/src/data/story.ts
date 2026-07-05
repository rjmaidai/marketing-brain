// Louis & Hermès — VERSION 2 (neues Spiel).
// Neue Reihenfolge & Beat→Training-Mapping stammen aus SCRIPT GAME UPDATE.
// Videos sind echte Bewegtbilder; aufeinanderfolgende Beats ohne Spiel sind zu
// einer Datei zusammengeschnitten -> 11 Segmente statt 15 Einzel-Beats.

export type TrainingType = 'laut' | 'spuren' | 'merken' | 'puzzle'

export interface Training {
  type: TrainingType
  /** Nur bei 'laut': welche Lautkarte eingehängt wird (Buchstabe oder 'DIEB'). */
  laut?: string
  /** Nur bei 'puzzle': welches Bild vervollständigt wird. */
  variant?: 'marke' | 'face' | 'ball'
  /** Nur bei 'spuren' (Spürnase): welches Ziel am Ende der Spur wartet. */
  target?: 'muetze' | 'dieb'
  /** Nur bei 'merken': feste Grafik für die Kacheln (statt Poster des nächsten Beats). */
  pic?: string
}

export interface Beat {
  /** Beat-Nummer wie im Storyboard (1..21, ohne 18). */
  id: number
  /** Dateiname des fertigen Beat-Clips. */
  file: string
  /** Kurzbeschreibung des Moments — nur für Entwickler/Debug, nie im Bild. */
  moment: string
  /** Training, das NACH diesem Beat läuft (falls vorhanden). */
  training?: Training
}

// Die Laut-Übungen bekommen ihre Lautkarte bei JEDEM Durchlauf neu gemischt
// (siehe makeLautAssignment). Nur der DIEB (Beat 14) bleibt fix. Deshalb steht
// hier bei den normalen Laut-Beats KEIN fester Buchstabe mehr.
// Beats, die OHNE Spiel dazwischen laufen, sind zu je EINER Videodatei
// zusammengeschnitten (1+2, 11+14, 16+17, 19+20) — so wirkt es wie ein
// durchgehendes Video und jeder verbleibende Übergang liegt hinter einem Spiel.
// Die id trägt jeweils die Nummer des Beats, an dem das Spiel hängt.
export const BEATS: Beat[] = [
  { id: 2,  file: 'beat_01_02.mp4', moment: 'Louis im Spielzimmer mit der Polizeiuniform; er zieht Hermès die Uniform an.', training: { type: 'laut' } },
  { id: 3,  file: 'beat_03.mp4', moment: 'Hermès steht stolz in Uniform. Haustür zum Bauernhof öffnet sich.', training: { type: 'puzzle', variant: 'marke' } },
  { id: 8,  file: 'beat_08.mp4', moment: 'Der Wind weht Louis\' Polizeimütze weg.', training: { type: 'spuren', target: 'muetze' } },
  { id: 4,  file: 'beat_04.mp4', moment: 'Begegnung mit einem grossen Pferd. Hermès bleibt ruhig.', training: { type: 'laut' } },
  { id: 5,  file: 'beat_05.mp4', moment: 'Louis versteckt den Lieblingsball hinter einem Baum.', training: { type: 'puzzle', variant: 'ball' } },
  { id: 6,  file: 'beat_06.mp4', moment: 'Hermès bringt den Ball stolz zurück.', training: { type: 'merken', pic: 'ball.png' } },
  { id: 14, file: 'beat_11_14.mp4', moment: 'Blick über den Bauernhof; Hermès entdeckt den kleinen freundlichen Dieb, der Richtung See rennt.', training: { type: 'laut', laut: 'DIEB' } },
  { id: 15, file: 'beat_15.mp4', moment: 'Sie erreichen den See. Der Dieb wartet am anderen Ufer. Hermès kann nicht schwimmen.', training: { type: 'spuren', target: 'dieb' } },
  { id: 17, file: 'beat_16_17.mp4', moment: 'Louis reicht Hermès die Hand; gemeinsam die letzte Aufgabe. Hermès setzt die erste Pfote ins Wasser.', training: { type: 'laut' } },
  { id: 20, file: 'beat_19_20.mp4', moment: 'Hermès erreicht den Dieb am Ufer; der Dieb lacht und läuft davon. Louis hängt Hermès die Polizeimarke um.', training: { type: 'merken' } },
  { id: 21, file: 'beat_21.mp4', moment: 'Zurück im Spielzimmer schlafen Louis und Hermès.' },
]

// Alle Buchstaben-Lautkarten (der DIEB ist die fixe Story-Karte, separat).
export const LAUT_POOL = ['A', 'E', 'F', 'I', 'L', 'M', 'O', 'P', 'S', 'U']
// Beats mit normaler (gemischter) Lautkarte, in Story-Reihenfolge.
export const LAUT_BEATS = [2, 4, 17]

// Bei jedem Durchlauf neu mischen: welche Karte an welchem Laut-Beat kommt.
// 8 Beats aus 10 Karten -> jeder Durchlauf zeigt eine andere Auswahl, über die
// Durchläufe kommen alle Karten dran. Der DIEB (Beat 14) bleibt immer fix.
export function makeLautAssignment(): Record<number, string> {
  const pool = [...LAUT_POOL]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const map: Record<number, string> = {}
  LAUT_BEATS.forEach((id, idx) => {
    map[id] = pool[idx]
  })
  return map
}

// Ansage-Audios, die zu Beginn jedes Trainings gespielt werden.
export const SPIELSATZ: Record<TrainingType, string> = {
  laut: 'spiel_jetzt_bist_du_dran.mp3',
  merken: 'spiel_merke_reihenfolge.mp3',
  spuren: 'spiel_folge_der_spur.mp3',
  puzzle: 'spiel_waehle_richtige_teil.mp3',
}

// Zusätzliche Sprach-Ansagen.
export const VOICE = {
  hoerGutZu: 'hoer_gut_zu.mp3', // vor dem Start der Lautkarte
}
export const voiceSrc = (file: string) => `${import.meta.env.BASE_URL}assets/voice/${file}`

export const beatSrc = (file: string) => `${import.meta.env.BASE_URL}assets/beats/${file}`
export const lautkarteSrc = (laut: string) => `${import.meta.env.BASE_URL}assets/lautkarten/Lautkarte_${laut}.mp4`
export const spielsatzSrc = (file: string) => `${import.meta.env.BASE_URL}assets/spielsaetze/${file}`
// Freigestellte Grafiken (neues Spiel): Konfetti (marke/keks/ball), Puzzle-Bilder
// (marke_puzzle/face_puzzle), Spürnase-Ziele (muetze/dieb_frei), Fortschrittsturm (hau_tower).
export const graphicSrc = (name: string) => `${import.meta.env.BASE_URL}assets/graphics/${name}`
