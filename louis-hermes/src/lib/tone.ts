// Kachel-Töne fürs Merken-Spiel: jede Kachel hat ihren eigenen weichen Klang,
// damit das Kind sich die Reihenfolge auch über die Töne merken kann (wie Senso).
// Ruhige Pentatonik, sanfte Hüllkurve — kein harter Anschlag.

let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  if (ctx) return ctx
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null
  ctx = new AudioCtx()
  return ctx
}

// Beim Start (Fingergeste) einmal aufwecken, damit die Töne später klingen.
export function resumeTones() {
  const c = ac()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

// Sechs Töne einer C-Dur-Pentatonik (C5 D5 E5 G5 A5 C6) — freundlich, ohne Dissonanz.
const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]

export function playTone(i: number) {
  const c = ac()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  const t = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = NOTES[i % NOTES.length]
  // weiches An- und Ausklingen
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.linearRampToValueAtTime(0.16, t + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.6)
}
