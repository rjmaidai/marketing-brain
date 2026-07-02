// Louis & Hermès — Storyboard als Daten.
// Reihenfolge & Beat→Training-Mapping stammen 1:1 aus dem Handover-Manifest.
// Beat 18 ist gestrichen (kein Voiceover) — die Nummerierung bleibt trotzdem,
// damit sie zu den Asset-Dateinamen passt.

export type TrainingType = 'laut' | 'spuren' | 'merken' | 'puzzle'

export interface Training {
  type: TrainingType
  /** Nur bei 'laut': welche Lautkarte eingehängt wird (Buchstabe oder 'DIEB'). */
  laut?: string
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
export const BEATS: Beat[] = [
  { id: 1,  file: 'beat_01.mp4', moment: 'Louis im Spielzimmer, vor ihm die Polizeiuniform.' },
  { id: 2,  file: 'beat_02.mp4', moment: 'Louis zieht Hermès die Uniform an.', training: { type: 'laut' } },
  { id: 3,  file: 'beat_03.mp4', moment: 'Hermès steht stolz in Uniform. Die Haustür öffnet sich.', training: { type: 'puzzle' } },
  { id: 4,  file: 'beat_04.mp4', moment: 'Begegnung mit einem grossen Pferd.', training: { type: 'laut' } },
  { id: 5,  file: 'beat_05.mp4', moment: 'Louis versteckt den Lieblingsball hinter einem Baum.', training: { type: 'spuren' } },
  { id: 6,  file: 'beat_06.mp4', moment: 'Hermès bringt den Ball stolz zurück.', training: { type: 'laut' } },
  { id: 7,  file: 'beat_07.mp4', moment: 'Pause vor dem Holzspeicher. Louis gibt Hermès einen Keks.', training: { type: 'laut' } },
  { id: 8,  file: 'beat_08.mp4', moment: 'Der Wind weht Louis\' Polizeimütze weg.', training: { type: 'merken' } },
  { id: 9,  file: 'beat_09.mp4', moment: 'Hermès schliesst das Hoftor mit der Nase.', training: { type: 'laut' } },
  { id: 10, file: 'beat_10.mp4', moment: 'Hermès begleitet das Pferd zurück nach Hause.', training: { type: 'puzzle' } },
  { id: 11, file: 'beat_11.mp4', moment: 'Blick über den Bauernhof. Eine Prüfung fehlt noch.', training: { type: 'laut' } },
  { id: 12, file: 'beat_12.mp4', moment: 'Hermès wartet geduldig vor Louis, bis er nickt.', training: { type: 'merken' } },
  { id: 13, file: 'beat_13.mp4', moment: 'Louis gibt Hermès einen kleinen Snack.', training: { type: 'laut' } },
  { id: 14, file: 'beat_14.mp4', moment: 'Hermès entdeckt den kleinen freundlichen Dieb. Er rennt Richtung See.', training: { type: 'laut', laut: 'DIEB' } },
  { id: 15, file: 'beat_15.mp4', moment: 'Sie erreichen den See. Der Dieb wartet am anderen Ufer.', training: { type: 'spuren' } },
  { id: 16, file: 'beat_16.mp4', moment: 'Louis streckt Hermès die Hand entgegen.', training: { type: 'laut' } },
  { id: 17, file: 'beat_17.mp4', moment: 'Hermès setzt die erste Pfote ins Wasser, blickt kurz zum Dieb.' },
  { id: 19, file: 'beat_19.mp4', moment: 'Geschafft. Hermès hat die Aufgabe gemeistert.', training: { type: 'puzzle' } },
  { id: 20, file: 'beat_20.mp4', moment: 'Louis hängt Hermès die Polizeimarke um. Der Dieb winkt.' },
  { id: 21, file: 'beat_21.mp4', moment: 'Zurück im Spielzimmer schlafen Louis und Hermès.' },
]

// Alle Buchstaben-Lautkarten (der DIEB ist die fixe Story-Karte, separat).
export const LAUT_POOL = ['A', 'E', 'F', 'I', 'L', 'M', 'O', 'P', 'S', 'U']
// Beats mit normaler (gemischter) Lautkarte, in Story-Reihenfolge.
export const LAUT_BEATS = [2, 4, 6, 7, 9, 11, 13, 16]

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
