import { useEffect, useMemo, useRef, useState } from 'react'
import { spielsatzSrc, SPIELSATZ } from '../data/story'
import { resumeMic } from '../lib/mic'

// Spiel „Bild-Puzzle": das richtige Teil wird ausgewählt und eingesetzt.
// Etwas zusammenfügen, vervollständigen. Kein falsch/richtig-Ton, der bestraft —
// nur das ruhige Einrasten des passenden Teils.
//
// Ein warmes, ruhiges Landschaftsbild fehlt ein Stück. Das Kind wählt das
// passende Teil (gleiche Farbe wie die Umgebung) und das Bild wird ganz.

interface Props {
  seed: number
  onDone: () => void
}

// Warme Bilderbuch-Farben (Himmel, Hügel, Wiese, Weg).
const BANDS = ['#a9c6d8', '#e0a878', '#8aa06a', '#c8794a']

export function BildPuzzle({ seed, onDone }: Props) {
  const [placed, setPlaced] = useState(false)
  const [wrong, setWrong] = useState<number | null>(null)
  const doneRef = useRef(false)

  // Welches Band fehlt + Reihenfolge der angebotenen Teile (aus dem Seed).
  const { gapBand, options, correctIdx } = useMemo(() => {
    const gap = seed % BANDS.length
    // Drei Teile: das richtige + zwei andere Farben.
    const others = BANDS.map((_, i) => i).filter((i) => i !== gap)
    const pick = [gap, others[0], others[1]]
    // Reihenfolge stabil aus dem Seed rotieren.
    const rot = seed % 3
    const rotated = pick.slice(rot).concat(pick.slice(0, rot))
    return { gapBand: gap, options: rotated, correctIdx: rotated.indexOf(gap) }
  }, [seed])

  useEffect(() => {
    resumeMic()
    const a = new Audio(spielsatzSrc(SPIELSATZ.puzzle))
    a.play().catch(() => {})
    return () => a.pause()
  }, [])

  function choose(i: number) {
    if (placed || doneRef.current) return
    if (i === correctIdx) {
      setPlaced(true)
      doneRef.current = true
      window.setTimeout(onDone, 900)
    } else {
      // Passt nicht — ruhig zurück, kein Ton, keine Strafe.
      setWrong(i)
      window.setTimeout(() => setWrong(null), 450)
    }
  }

  const bandH = 100
  const gapY = gapBand * bandH
  const gapX = 150
  const gapW = 120

  return (
    <div className="stage">
      <div className="training fade-in">
        <div className="training-title">Welches Teil passt?</div>

        {/* Das Bild mit der Lücke */}
        <svg
          viewBox={`0 0 400 ${bandH * BANDS.length}`}
          style={{
            width: 'min(88vw, 420px)',
            borderRadius: 20,
            boxShadow: '0 12px 40px var(--shadow)',
            background: 'var(--bg-soft)',
          }}
        >
          {BANDS.map((c, i) => (
            <rect key={i} x={0} y={i * bandH} width={400} height={bandH} fill={c} />
          ))}
          {/* Lücke ausstanzen */}
          {!placed && (
            <rect
              x={gapX}
              y={gapY}
              width={gapW}
              height={bandH}
              fill="var(--bg-soft)"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={3}
              strokeDasharray="8 8"
              rx={6}
            />
          )}
          {/* Eingerastetes Teil */}
          {placed && (
            <rect x={gapX} y={gapY} width={gapW} height={bandH} fill={BANDS[gapBand]} rx={6} />
          )}
        </svg>

        {/* Die drei Teile zur Auswahl */}
        {!placed && (
          <div className="card-row">
            {options.map((bandIdx, i) => (
              <button
                key={i}
                className="piece"
                aria-label={`Teil ${i + 1}`}
                onClick={() => choose(i)}
                style={{
                  width: 96,
                  height: 96,
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
