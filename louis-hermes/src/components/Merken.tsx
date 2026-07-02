import { useCallback, useEffect, useRef, useState } from 'react'
import { spielsatzSrc, SPIELSATZ } from '../data/story'
import { resumeMic } from '../lib/mic'
import { capturePoster } from '../lib/poster'
import { playTone, resumeAudio, playSample } from '../lib/audio'
import { showFeedback } from '../lib/feedback'

// Spiel „Merken": eine kurze Reihenfolge leuchtet auf, dann tippt das Kind sie nach.
// Die sechs Kacheln sind Ausschnitte des NÄCHSTEN Story-Bildes (3×2), fast
// bildfüllend — so sieht das Kind schon, was kommt, und ist motiviert.
// Kein Zeitdruck; bei einem Fehler zeigt es die Reihenfolge ruhig noch einmal.

interface Props {
  seed: number
  nextBeatSrc?: string
  onDone: () => void
}

const COLS = 3
const ROWS = 2
const TILE_COUNT = COLS * ROWS

// Warme Rückfall-Farben, falls kein Standbild geladen werden kann.
const FALLBACK = ['#a9c6d8', '#e0a878', '#8aa06a', '#c8794a', '#b98a5e', '#7f9bad']

function makeSequence(seed: number, len: number): number[] {
  // Deterministisch aus dem Seed — ruhig reproduzierbar, keine Zufallsquelle.
  const seq: number[] = []
  let s = seed * 2654435761
  for (let i = 0; i < len; i++) {
    s = (s ^ (s << 13)) >>> 0
    s = (s ^ (s >> 17)) >>> 0
    seq.push(s % TILE_COUNT)
  }
  return seq
}

// Position des Ausschnitts i (0..5) im 3×2-Raster für background-position.
function tilePos(i: number) {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  return `${col * 50}% ${row * 100}%`
}

export function Merken({ seed, nextBeatSrc, onDone }: Props) {
  const sequence = useRef(makeSequence(seed, 3)).current
  const [img, setImg] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [lit, setLit] = useState<number | null>(null)
  const [showing, setShowing] = useState(true)
  const [inputIdx, setInputIdx] = useState(0)
  const doneRef = useRef(false)
  const timers = useRef<number[]>([])

  // Standbild des nächsten Beats holen (oder ruhig ohne Bild weitermachen).
  useEffect(() => {
    let alive = true
    if (!nextBeatSrc) {
      setReady(true)
      return
    }
    capturePoster(nextBeatSrc).then((data) => {
      if (!alive) return
      setImg(data)
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [nextBeatSrc])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  const showSequence = useCallback(() => {
    setShowing(true)
    setInputIdx(0)
    clearTimers()
    // Ruhig nacheinander aufleuchten lassen — mit dem eigenen Ton jeder Kachel.
    sequence.forEach((tile, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setLit(tile)
          playTone(tile)
        }, 700 + i * 1100),
      )
      timers.current.push(window.setTimeout(() => setLit(null), 700 + i * 1100 + 700))
    })
    timers.current.push(
      window.setTimeout(() => setShowing(false), 700 + sequence.length * 1100 + 200),
    )
  }, [sequence])

  useEffect(() => {
    if (!ready) return
    resumeMic()
    resumeAudio()
    let alive = true
    // ERST die Ansage „Merke dir die Reihenfolge" zu Ende sprechen,
    // DANN die Abfolge starten — sonst laufen Stimme und Aufleuchten
    // gleichzeitig und verwirren.
    playSample(spielsatzSrc(SPIELSATZ.merken)).then(() => {
      if (alive) showSequence()
    })
    return () => {
      alive = false
      clearTimers()
    }
  }, [ready, showSequence])

  function tap(tile: number) {
    if (showing || doneRef.current) return
    // Kurz aufleuchten + eigener Ton als ruhiges Echo.
    setLit(tile)
    playTone(tile)
    window.setTimeout(() => setLit(null), 220)

    if (tile === sequence[inputIdx]) {
      const next = inputIdx + 1
      if (next >= sequence.length) {
        doneRef.current = true
        showFeedback('richtig').then(onDone)
      } else {
        setInputIdx(next)
      }
    } else {
      // Sanft: kurzes „nochmal", dann die Reihenfolge ruhig noch einmal zeigen.
      showFeedback('falsch').then(showSequence)
    }
  }

  if (!ready) {
    return (
      <div className="stage">
        <div className="training fade-in">
          <div className="training-title">Einen Moment …</div>
          <div className="mic-orb" style={{ opacity: 0.5 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="stage">
      <div className="training fade-in">
        <div className="training-title">
          {showing ? 'Merke dir die Reihenfolge' : 'Jetzt du — tippe sie nach'}
        </div>
        <div className="mem-grid">
          {Array.from({ length: TILE_COUNT }, (_, i) => (
            <button
              key={i}
              className={`mem-tile${lit === i ? ' lit' : ''}`}
              aria-label={`Feld ${i + 1}`}
              onClick={() => tap(i)}
              style={
                img
                  ? {
                      backgroundImage: `url(${img})`,
                      backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
                      backgroundPosition: tilePos(i),
                    }
                  : { background: FALLBACK[i] }
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
