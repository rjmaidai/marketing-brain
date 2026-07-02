// Zentraler Audio-Kanal für ALLE Ausgabe-Töne (Stimmen, Ansagen, Kachel-Töne).
//
// Warum: auf iPad/Safari ist ein je neu erzeugtes <audio>-Element oft blockiert
// (mal kommt der Ton, mal nicht). Über EINEN Web-Audio-Kontext, der beim Start
// in der Fingergeste freigeschaltet wird, spielt danach alles zuverlässig und
// gleich — genau das brauchen wir für „Jetzt bist du dran" und die Rückmeldung.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (ctx) return ctx
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null
  ctx = new AudioCtx()
  return ctx
}

/** Beim Start (Fingergeste) einmal aufwecken — danach klingt alles zuverlässig. */
export function resumeAudio() {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

// --- Kachel-Töne (Merken): ruhige C-Dur-Pentatonik, weiche Hüllkurve ---
const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]

export function playTone(i: number) {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  const t = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = NOTES[i % NOTES.length]
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.linearRampToValueAtTime(0.16, t + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.6)
}

// --- Samples (mp3: Ansagen + Rückmelde-Stimmen) ---
const cache = new Map<string, AudioBuffer | null>()

async function load(src: string): Promise<AudioBuffer | null> {
  if (cache.has(src)) return cache.get(src)!
  const c = getCtx()
  if (!c) return null
  try {
    const res = await fetch(src)
    const arr = await res.arrayBuffer()
    const buf = await c.decodeAudioData(arr)
    cache.set(src, buf)
    return buf
  } catch {
    cache.set(src, null)
    return null
  }
}

/** Vorab laden & dekodieren, damit die erste Wiedergabe sofort kommt. */
export function preloadSamples(srcs: string[]) {
  srcs.forEach((s) => {
    void load(s)
  })
}

/** Ein mp3 abspielen. Das Promise löst auf, wenn der Ton fertig ist. */
export async function playSample(src: string): Promise<void> {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') {
    try {
      await c.resume()
    } catch {
      /* egal */
    }
  }
  const buf = await load(src)
  if (!buf) return
  await new Promise<void>((resolve) => {
    const s = c.createBufferSource()
    s.buffer = buf
    s.connect(c.destination)
    s.onended = () => resolve()
    try {
      s.start()
    } catch {
      resolve()
    }
  })
}
