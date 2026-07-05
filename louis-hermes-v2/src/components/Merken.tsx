import { useCallback, useEffect, useRef, useState } from 'react'
import { spielsatzSrc, SPIELSATZ } from '../data/story'
import { resumeMic } from '../lib/mic'
import { capturePoster } from '../lib/poster'
import { playTone, resumeAudio, playSample } from '../lib/audio'
import { showFeedback } from '../lib/feedback'
import { Meter } from './Meter'

// Spiel „Reihenfolge / Merken" — VERSION 2, spannender:
// Eine kurze Reihenfolge leuchtet auf, dann tippt das Kind sie nach. JEDE
// richtige Kachel lässt den „Hau den Lukas"-Balken steigen und Konfetti springen
// (je weiter, desto mehr). Ein Fehler lässt den Balken NICHT steigen — es gibt
// einen Zurück-Knopf. Nach 3 Fehlversuchen geht die Geschichte ruhig weiter.

interface Props {
  seed: number
  nextBeatSrc?: string
  /** Festes Bild für die Kacheln (z. B. der Ball). Hat Vorrang vor dem Poster. */
  imageSrc?: string
  onDone: () => void
}

const COLS = 3
const ROWS = 2
const TILE_COUNT = COLS * ROWS
const MAX_ATTEMPTS = 3

const FALLBACK = ['#a9c6d8', '#e0a878', '#8aa06a', '#c8794a', '#b98a5e', '#7f9bad']

function makeSequence(seed: number, len: number): number[] {
  const seq: number[] = []
  let s = seed * 2654435761
  for (let i = 0; i < len; i++) {
    s = (s ^ (s << 13)) >>> 0
    s = (s ^ (s >> 17)) >>> 0
    seq.push(s % TILE_COUNT)
  }
  return seq
}

function tilePos(i: number) {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  return `${col * 50}% ${row * 100}%`
}

export function Merken({ seed, nextBeatSrc, imageSrc, onDone }: Props) {
  const sequence = useRef(makeSequence(seed, 3)).current
  const [img, setImg] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [lit, setLit] = useState<number | null>(null)
  const [showing, setShowing] = useState(true)
  const [inputIdx, setInputIdx] = useState(0) // wie viele richtig nachgetippt
  const attemptRef = useRef(0)
  const doneRef = useRef(false)
  const mountedRef = useRef(true)
  useEffect(() => () => void (mountedRef.current = false), [])
  const timers = useRef<number[]>([])

  useEffect(() => {
    let alive = true
    // Festes Bild (z. B. Ball) hat Vorrang — kein Poster nötig.
    if (imageSrc) {
      setImg(imageSrc)
      setReady(true)
      return
    }
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
  }, [nextBeatSrc, imageSrc])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  const showSequence = useCallback(() => {
    setShowing(true)
    setInputIdx(0)
    clearTimers()
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

  // Ganze Aufgabe neu stellen: Ansage zu Ende, dann Abfolge zeigen.
  const presentTask = useCallback(() => {
    resumeAudio()
    setShowing(true)
    setInputIdx(0)
    playSample(spielsatzSrc(SPIELSATZ.merken)).then(() => {
      if (!mountedRef.current || doneRef.current) return
      showSequence()
    })
  }, [showSequence])

  useEffect(() => {
    if (!ready) return
    resumeMic()
    presentTask()
    return () => clearTimers()
  }, [ready, presentTask])

  function tap(tile: number) {
    if (showing || doneRef.current) return
    setLit(tile)
    window.setTimeout(() => setLit(null), 220)

    if (tile === sequence[inputIdx]) {
      // Richtig -> Balken steigt (Konfetti), aufsteigender Ton.
      const next = inputIdx + 1
      playTone(Math.min(5, next + 1))
      setInputIdx(next)
      if (next >= sequence.length) {
        doneRef.current = true
        showFeedback('richtig').then(onDone)
      }
    } else {
      // Falsch -> Balken steigt NICHT. Versuch zählt.
      attemptRef.current += 1
      if (attemptRef.current >= MAX_ATTEMPTS) {
        doneRef.current = true
        showFeedback('falsch').then(onDone)
      } else {
        showFeedback('falsch').then(presentTask)
      }
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
    <div className="stage stage--meter">
      <Meter progress={inputIdx / sequence.length} />
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
      {!showing && inputIdx > 0 && !doneRef.current && (
        <button className="back-btn" onClick={presentTask}>
          ↩ Zurück
        </button>
      )}
    </div>
  )
}
