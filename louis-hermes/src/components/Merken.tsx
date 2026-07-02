import { useCallback, useEffect, useRef, useState } from 'react'
import { spielsatzSrc, SPIELSATZ } from '../data/story'
import { resumeMic } from '../lib/mic'

// Spiel „Merken": eine kurze Reihenfolge leuchtet auf, dann tippt das Kind sie nach.
// Ein Polizeihund merkt sich Dinge. Kein Zeitdruck; bei einem Fehler zeigt es die
// Reihenfolge ruhig noch einmal — kein „falsch", kein bestrafender Ton.

interface Props {
  seed: number
  onDone: () => void
}

const TILE_COUNT = 6

function makeSequence(seed: number, len: number): number[] {
  // Deterministisch aus dem Seed — keine Zufallsquelle nötig, ruhig reproduzierbar.
  const seq: number[] = []
  let s = seed * 2654435761
  for (let i = 0; i < len; i++) {
    s = (s ^ (s << 13)) >>> 0
    s = (s ^ (s >> 17)) >>> 0
    seq.push(s % TILE_COUNT)
  }
  return seq
}

export function Merken({ seed, onDone }: Props) {
  const sequence = useRef(makeSequence(seed, 3)).current
  const [lit, setLit] = useState<number | null>(null)
  const [showing, setShowing] = useState(true)
  const [inputIdx, setInputIdx] = useState(0)
  const doneRef = useRef(false)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  const showSequence = useCallback(() => {
    setShowing(true)
    setInputIdx(0)
    clearTimers()
    // Ruhig nacheinander aufleuchten lassen — langsam, nicht hektisch.
    sequence.forEach((tile, i) => {
      timers.current.push(
        window.setTimeout(() => setLit(tile), 700 + i * 1100),
      )
      timers.current.push(
        window.setTimeout(() => setLit(null), 700 + i * 1100 + 700),
      )
    })
    timers.current.push(
      window.setTimeout(() => setShowing(false), 700 + sequence.length * 1100 + 200),
    )
  }, [sequence])

  useEffect(() => {
    resumeMic()
    const a = new Audio(spielsatzSrc(SPIELSATZ.merken))
    a.play().catch(() => {})
    showSequence()
    return () => {
      a.pause()
      clearTimers()
    }
  }, [showSequence])

  function tap(tile: number) {
    if (showing || doneRef.current) return
    // Kurz aufleuchten als ruhiges Echo.
    setLit(tile)
    window.setTimeout(() => setLit(null), 220)

    if (tile === sequence[inputIdx]) {
      const next = inputIdx + 1
      if (next >= sequence.length) {
        doneRef.current = true
        window.setTimeout(onDone, 550)
      } else {
        setInputIdx(next)
      }
    } else {
      // Sanft: einfach die Reihenfolge noch einmal zeigen. Keine Strafe.
      window.setTimeout(showSequence, 500)
    }
  }

  return (
    <div className="stage">
      <div className="training fade-in">
        <div className="training-title">{showing ? 'Merke dir die Reihenfolge' : 'Jetzt du — tippe sie nach'}</div>
        <div className="tiles">
          {Array.from({ length: TILE_COUNT }, (_, i) => (
            <button
              key={i}
              className={`tile${lit === i ? ' lit' : ''}`}
              aria-label={`Feld ${i + 1}`}
              onClick={() => tap(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
