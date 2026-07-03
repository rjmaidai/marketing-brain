import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { spielsatzSrc, SPIELSATZ } from '../data/story'
import { resumeMic } from '../lib/mic'
import { capturePoster } from '../lib/poster'
import { showFeedback } from '../lib/feedback'
import { playSample, resumeAudio } from '../lib/audio'

// Spiel „Bild-Puzzle": das richtige Teil wird ausgewählt und eingesetzt.
// Es zeigt das NÄCHSTE Bild der Geschichte mit einer Lücke — das Kind
// vervollständigt es und sieht dann, wie es lebendig wird. Die Vorfreude ist
// die Belohnung. Kein falsch/richtig-Ton, der bestraft — nur ruhiges Einrasten.

interface Props {
  seed: number
  /** Video des nächsten Beats — daraus wird das Standbild fürs Puzzle geholt. */
  nextBeatSrc?: string
  onDone: () => void
}

const MAX_ATTEMPTS = 3 // spätestens danach geht die Geschichte weiter

// 2×2-Raster: ein Feld fehlt, das Kind wählt aus drei Teilen das passende.
const CELLS = [
  { r: 0, c: 0 },
  { r: 0, c: 1 },
  { r: 1, c: 0 },
  { r: 1, c: 1 },
]

function bgPos(cell: { r: number; c: number }) {
  // Für background-size 200% 200%: 0% / 100% je nach Zeile/Spalte.
  return `${cell.c * 100}% ${cell.r * 100}%`
}

export function BildPuzzle({ seed, nextBeatSrc, onDone }: Props) {
  const [img, setImg] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [wrong, setWrong] = useState<number | null>(null)
  const [asked, setAsked] = useState(false) // erst klickbar, wenn die Frage gestellt wurde
  const doneRef = useRef(false)
  const wrongRef = useRef(0)
  const mountedRef = useRef(true)
  useEffect(() => () => void (mountedRef.current = false), [])

  // Die Aufgabe stellen: „Wähle das richtige Teil" sprechen; erst DANACH ist das
  // Spiel klickbar. Wird am Anfang und nach jedem Fehlversuch neu benutzt.
  const askTask = useCallback(() => {
    setAsked(false)
    resumeAudio()
    playSample(spielsatzSrc(SPIELSATZ.puzzle)).then(() => {
      if (!mountedRef.current || doneRef.current) return
      setAsked(true)
    })
  }, [])

  // Standbild aus dem nächsten Beat holen (oder ruhig ohne Bild weitermachen).
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

  useEffect(() => {
    if (!ready) return
    resumeMic()
    askTask()
  }, [ready, askTask])

  // Welches Feld fehlt + welche drei Teile angeboten werden (stabil aus Seed).
  const { holeIdx, options, correctPos } = useMemo(() => {
    const hole = seed % 4
    const others = CELLS.map((_, i) => i).filter((i) => i !== hole)
    const pick = [hole, others[0], others[1]]
    const rot = seed % 3
    const rotated = pick.slice(rot).concat(pick.slice(0, rot))
    return { holeIdx: hole, options: rotated, correctPos: rotated.indexOf(hole) }
  }, [seed])

  function choose(i: number) {
    if (!asked || placed || doneRef.current) return
    if (i === correctPos) {
      setPlaced(true)
      doneRef.current = true
      showFeedback('richtig').then(onDone)
    } else {
      setWrong(i)
      wrongRef.current += 1
      if (wrongRef.current >= MAX_ATTEMPTS) {
        // Nach 3 Fehlversuchen geht die Geschichte ruhig weiter — nie feststecken.
        doneRef.current = true
        showFeedback('falsch').then(onDone)
      } else {
        // Aufgabe komplett neu stellen (Ansage nochmal), erst danach wieder klickbar.
        showFeedback('falsch').then(() => {
          setWrong(null)
          askTask()
        })
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

  // --- Rückfall ohne Bild: warmes Farb-Puzzle (falls kein Standbild da ist) ---
  if (!img) {
    return <FarbPuzzle seed={seed} asked={asked} onReask={askTask} onDone={onDone} />
  }

  const hole = CELLS[holeIdx]

  return (
    <div className="stage">
      <div className="training fade-in">
        <div className="training-title">{placed ? 'Schau, was kommt!' : 'Welches Teil passt?'}</div>

        {/* Das nächste Story-Bild mit einer Lücke */}
        <div
          style={{
            position: 'relative',
            width: 'min(72vw, 360px)',
            aspectRatio: '4 / 3',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 12px 40px var(--shadow)',
            backgroundColor: 'var(--bg-soft)',
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
          }}
        >
          {!placed && (
            <div
              style={{
                position: 'absolute',
                left: `${hole.c * 50}%`,
                top: `${hole.r * 50}%`,
                width: '50%',
                height: '50%',
                background: 'var(--bg-soft)',
                boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.22)',
                transition: 'opacity 700ms ease',
              }}
            />
          )}
        </div>

        {/* Die drei Teile zur Auswahl */}
        {!placed && (
          <div
            className="card-row"
            style={{ pointerEvents: asked ? 'auto' : 'none', opacity: asked ? 1 : 0.5, transition: 'opacity 300ms ease' }}
          >
            {options.map((cellIdx, i) => (
              <button
                key={i}
                className="piece"
                aria-label={`Teil ${i + 1}`}
                onClick={() => choose(i)}
                style={{
                  width: 'min(46vw, 300px)',
                  aspectRatio: '4 / 3',
                  height: 'auto',
                  backgroundImage: `url(${img})`,
                  backgroundSize: '200% 200%',
                  backgroundPosition: bgPos(CELLS[cellIdx]),
                  opacity: wrong === i ? 0.4 : 1,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Warmes, ruhiges Farb-Puzzle als Rückfall, wenn kein Standbild geladen werden kann.
const BANDS = ['#a9c6d8', '#e0a878', '#8aa06a', '#c8794a']

function FarbPuzzle({
  seed,
  asked,
  onReask,
  onDone,
}: {
  seed: number
  asked: boolean
  onReask: () => void
  onDone: () => void
}) {
  const [placed, setPlaced] = useState(false)
  const [wrong, setWrong] = useState<number | null>(null)
  const doneRef = useRef(false)
  const wrongRef = useRef(0)

  const { gapBand, options, correctIdx } = useMemo(() => {
    const gap = seed % BANDS.length
    const others = BANDS.map((_, i) => i).filter((i) => i !== gap)
    const pick = [gap, others[0], others[1]]
    const rot = seed % 3
    const rotated = pick.slice(rot).concat(pick.slice(0, rot))
    return { gapBand: gap, options: rotated, correctIdx: rotated.indexOf(gap) }
  }, [seed])

  function choose(i: number) {
    if (!asked || placed || doneRef.current) return
    if (i === correctIdx) {
      setPlaced(true)
      doneRef.current = true
      showFeedback('richtig').then(onDone)
    } else {
      setWrong(i)
      wrongRef.current += 1
      if (wrongRef.current >= MAX_ATTEMPTS) {
        // Nach 3 Fehlversuchen geht die Geschichte ruhig weiter — nie feststecken.
        doneRef.current = true
        showFeedback('falsch').then(onDone)
      } else {
        // Aufgabe neu stellen (Ansage nochmal), erst danach wieder klickbar.
        showFeedback('falsch').then(() => {
          setWrong(null)
          onReask()
        })
      }
    }
  }

  const bandH = 100
  const gapY = gapBand * bandH

  return (
    <div className="stage">
      <div className="training fade-in">
        <div className="training-title">Welches Teil passt?</div>
        <svg
          viewBox={`0 0 400 ${bandH * BANDS.length}`}
          style={{ width: 'min(88vw, 420px)', borderRadius: 20, boxShadow: '0 12px 40px var(--shadow)', background: 'var(--bg-soft)' }}
        >
          {BANDS.map((c, i) => (
            <rect key={i} x={0} y={i * bandH} width={400} height={bandH} fill={c} />
          ))}
          {!placed && (
            <rect x={150} y={gapY} width={120} height={bandH} fill="var(--bg-soft)" stroke="rgba(255,255,255,0.25)" strokeWidth={3} strokeDasharray="8 8" rx={6} />
          )}
          {placed && <rect x={150} y={gapY} width={120} height={bandH} fill={BANDS[gapBand]} rx={6} />}
        </svg>
        {!placed && (
          <div
            className="card-row"
            style={{ pointerEvents: asked ? 'auto' : 'none', opacity: asked ? 1 : 0.5, transition: 'opacity 300ms ease' }}
          >
            {options.map((bandIdx, i) => (
              <button
                key={i}
                className="piece"
                aria-label={`Teil ${i + 1}`}
                onClick={() => choose(i)}
                style={{
                  width: 'min(42vw, 240px)',
                  aspectRatio: '1',
                  height: 'auto',
                  background: BANDS[bandIdx],
                  opacity: wrong === i ? 0.4 : 1,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
