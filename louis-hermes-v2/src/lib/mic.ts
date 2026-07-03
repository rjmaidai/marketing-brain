// Mikrofon-Verwaltung für die Laut-Übung.
//
// Stufe 1 aus dem Handover: Amplituden-Erkennung. Bewusst grosszügig —
// das Kind soll Erfolg erleben, nicht an Präzision scheitern.
// Wichtig (aus der Praxis gelernt): der Laut sitzt am LAUTESTEN Moment,
// nicht am ersten Geräusch. Wir triggern deshalb auf einen klaren Pegel-
// Ausschlag, nicht auf das erste Räuspern.
//
// Die Erlaubnis wird genau einmal geholt und der Stream wiederverwendet.

let ctx: AudioContext | null = null
let stream: MediaStream | null = null
let source: MediaStreamAudioSourceNode | null = null
let analyser: AnalyserNode | null = null
let buffer: Float32Array<ArrayBuffer> | null = null

export type MicState = 'unknown' | 'granted' | 'denied'

let state: MicState = 'unknown'
export const micState = () => state

/** Fragt (einmalig) die Mikrofon-Erlaubnis an und baut die Audio-Kette auf. */
export async function ensureMic(): Promise<MicState> {
  if (state === 'granted' && analyser) return 'granted'
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AudioCtx()
    source = ctx.createMediaStreamSource(stream)
    analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.6
    buffer = new Float32Array(new ArrayBuffer(analyser.fftSize * 4))
    source.connect(analyser)
    state = 'granted'
  } catch {
    state = 'denied'
  }
  return state
}

/** Aktueller Lautstärke-Pegel (0..~1), geglättet. Für die Orb-Animation. */
export function currentLevel(): number {
  if (!analyser || !buffer) return 0
  analyser.getFloatTimeDomainData(buffer)
  let sum = 0
  for (let i = 0; i < buffer.length; i++) {
    const v = buffer[i]
    sum += v * v
  }
  const rms = Math.sqrt(sum / buffer.length)
  return rms
}

/** iOS/Safari: AudioContext muss nach einer Nutzer-Geste fortgesetzt werden. */
export async function resumeMic() {
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      /* egal — wir laufen sonst einfach ohne */
    }
  }
}

export function stopMic() {
  stream?.getTracks().forEach((t) => t.stop())
  ctx?.close().catch(() => {})
  ctx = null
  stream = null
  source = null
  analyser = null
  buffer = null
  state = 'unknown'
}
