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

// Die Laut-Übungen bekommen der Reihe nach eine Lautkarte zugewiesen.
// Verfügbar sind: A E F I L M O P S U  (+ DIEB als Story-Karte bei Beat 14).
// Reihenfolge bewusst früh-phonetisch freundlich gewählt.
export const BEATS: Beat[] = [
  { id: 1,  file: 'beat_01.mp4', moment: 'Louis im Spielzimmer, vor ihm die Polizeiuniform.' },
  { id: 2,  file: 'beat_02.mp4', moment: 'Louis zieht Hermès die Uniform an.', training: { type: 'laut', laut: 'M' } },
  { id: 3,  file: 'beat_03.mp4', moment: 'Hermès steht stolz in Uniform. Die Haustür öffnet sich.', training: { type: 'puzzle' } },
  { id: 4,  file: 'beat_04.mp4', moment: 'Begegnung mit einem grossen Pferd.', training: { type: 'laut', laut: 'A' } },
  { id: 5,  file: 'beat_05.mp4', moment: 'Louis versteckt den Lieblingsball hinter einem Baum.', training: { type: 'spuren' } },
  { id: 6,  file: 'beat_06.mp4', moment: 'Hermès bringt den Ball stolz zurück.', training: { type: 'laut', laut: 'L' } },
  { id: 7,  file: 'beat_07.mp4', moment: 'Pause vor dem Holzspeicher. Louis gibt Hermès einen Keks.', training: { type: 'laut', laut: 'O' } },
  { id: 8,  file: 'beat_08.mp4', moment: 'Der Wind weht Louis\' Polizeimütze weg.', training: { type: 'merken' } },
  { id: 9,  file: 'beat_09.mp4', moment: 'Hermès schliesst das Hoftor mit der Nase.', training: { type: 'laut', laut: 'S' } },
  { id: 10, file: 'beat_10.mp4', moment: 'Hermès begleitet das Pferd zurück nach Hause.', training: { type: 'puzzle' } },
  { id: 11, file: 'beat_11.mp4', moment: 'Blick über den Bauernhof. Eine Prüfung fehlt noch.', training: { type: 'laut', laut: 'I' } },
  { id: 12, file: 'beat_12.mp4', moment: 'Hermès wartet geduldig vor Louis, bis er nickt.', training: { type: 'merken' } },
  { id: 13, file: 'beat_13.mp4', moment: 'Louis gibt Hermès einen kleinen Snack.', training: { type: 'laut', laut: 'E' } },
  { id: 14, file: 'beat_14.mp4', moment: 'Hermès entdeckt den kleinen freundlichen Dieb. Er rennt Richtung See.', training: { type: 'laut', laut: 'DIEB' } },
  { id: 15, file: 'beat_15.mp4', moment: 'Sie erreichen den See. Der Dieb wartet am anderen Ufer.', training: { type: 'spuren' } },
  { id: 16, file: 'beat_16.mp4', moment: 'Louis streckt Hermès die Hand entgegen.', training: { type: 'laut', laut: 'U' } },
  { id: 17, file: 'beat_17.mp4', moment: 'Hermès setzt die erste Pfote ins Wasser, blickt kurz zum Dieb.' },
  { id: 19, file: 'beat_19.mp4', moment: 'Geschafft. Hermès hat die Aufgabe gemeistert.', training: { type: 'puzzle' } },
  { id: 20, file: 'beat_20.mp4', moment: 'Louis hängt Hermès die Polizeimarke um. Der Dieb winkt.' },
  { id: 21, file: 'beat_21.mp4', moment: 'Zurück im Spielzimmer schlafen Louis und Hermès.' },
]

// Ansage-Audios, die zu Beginn jedes Trainings gespielt werden.
export const SPIELSATZ: Record<TrainingType, string> = {
  laut: 'spiel_jetzt_bist_du_dran.mp3',
  merken: 'spiel_merke_reihenfolge.mp3',
  spuren: 'spiel_folge_der_spur.mp3',
  puzzle: 'spiel_waehle_richtige_teil.mp3',
}

export const beatSrc = (file: string) => `${import.meta.env.BASE_URL}assets/beats/${file}`
export const lautkarteSrc = (laut: string) => `${import.meta.env.BASE_URL}assets/lautkarten/Lautkarte_${laut}.mp4`
export const spielsatzSrc = (file: string) => `${import.meta.env.BASE_URL}assets/spielsaetze/${file}`
