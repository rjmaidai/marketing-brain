// Fortschritt lokal im Browser speichern (localStorage) — kein Server, kein Login.
// Wir merken uns nur, wie weit das Kind schon war, damit man dort weitermachen kann.

const KEY = 'louis-hermes-progress-v1'

export interface Progress {
  /** Index in BEATS, bis zu dem schon gespielt wurde. */
  furthest: number
  /** Laute, die schon einmal klar erkannt wurden (für spätere Stufe 2). */
  mastered: string[]
}

const empty: Progress = { furthest: 0, mastered: [] }

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...empty }
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      furthest: typeof parsed.furthest === 'number' ? parsed.furthest : 0,
      mastered: Array.isArray(parsed.mastered) ? parsed.mastered : [],
    }
  } catch {
    return { ...empty }
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* Speicher voll oder gesperrt — dann läuft die App eben ohne Merken. */
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* egal */
  }
}
