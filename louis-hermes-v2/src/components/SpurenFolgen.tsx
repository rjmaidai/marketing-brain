import { useEffect, useMemo, useRef, useState } from 'react'
import { spielsatzSrc, SPIELSATZ, graphicSrc } from '../data/story'
import { resumeMic } from '../lib/mic'
import { showFeedback } from '../lib/feedback'
import { playSample, resumeAudio, playTone } from '../lib/audio'
import { Meter } from './Meter'

// Spiel „Spürnase / Spuren folgen" — VERSION 2:
// Hermès schnüffelt die Fährte nach. Am ENDE der Spur wartet das Ziel —
// die Mütze (Beat 8) oder der Dieb (Beat 15). Der Finger zieht die Fährte nach,
// bis er beim Ziel ankommt. Kein Timer — die Linie wartet.

interface Props {
  seed: number
  target: 'muetze' | 'dieb' | 'ball'
  onDone: () => void
}

const W = 600
const H = 450
const N = 60 // Stützpunkte entlang der Fährte
const REACH = 60 // wie nah der Finger sein muss (grosszügig)

export function SpurenFolgen({ seed, target, onDone }: Props) {
  const [reached, setReached] = useState(0)
  const [asked, setAsked] = useState(false) // erst nachziehbar, wenn die Frage gestellt wurde
  const doneRef = useRef(false)
  const mountedRef = useRef(true)
  useEffect(() => () => void (mountedRef.current = false), [])

  // Sanfte, seed-abhängige Wellenlinie von links nach rechts.
  const pts = useMemo(() => {
    const arr: { x: number; y: number }[] = []
    const a = 70 + (seed % 3) * 20
    const phase = (seed % 5) * 0.6
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      const x = 60 + t * (W - 120)
      const y = H / 2 + Math.sin(t * Math.PI * 2 + phase) * a
      arr.push({ x, y })
    }
    return arr
  }, [seed])

  useEffect(() => {
    resumeMic()
    resumeAudio()
    // Erst die Ansage „Folge der Spur", DANN ist die Spur nachziehbar.
    playSample(spielsatzSrc(SPIELSATZ.spuren)).then(() => {
      if (mountedRef.current) setAsked(true)
    })
  }, [])

  const pathD = useMemo(
    () => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
    [pts],
  )
  const trailD = useMemo(
    () => pts.slice(0, reached + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
    [pts, reached],
  )

  function toLocal(e: React.PointerEvent<SVGSVGElement>) {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    }
  }

  function follow(e: React.PointerEvent<SVGSVGElement>) {
    if (doneRef.current || !asked) return
    const p = toLocal(e)
    // Nur vorwärts: der am weitesten fortgeschrittene erreichbare Punkt zählt.
    let next = reached
    for (let i = reached; i < N; i++) {
      const dx = pts[i].x - p.x
      const dy = pts[i].y - p.y
      if (Math.hypot(dx, dy) < REACH) next = i
      else break
    }
    if (next !== reached) {
      // Sanfter Ton bei jedem Fortschritts-Schritt (klingt „aufsteigend").
      if (Math.floor(next / 10) > Math.floor(reached / 10)) {
        playTone(Math.min(5, Math.floor(next / 10)))
      }
      setReached(next)
    }
    if (next >= N - 1) {
      doneRef.current = true
      showFeedback('richtig').then(onDone)
    }
  }

  const head = pts[Math.min(reached, N - 1)]
  const goal = pts[N - 1]
  const targetFile = target === 'muetze' ? 'muetze.png' : target === 'dieb' ? 'dieb.png' : 'ball.png'
  const targetImg = graphicSrc(targetFile)
  const title = target === 'muetze' ? 'Schnüffle zur Mütze' : target === 'dieb' ? 'Der Spur zum Dieb folgen' : 'Schnüffle zum Ball'

  // Pfotenabdrücke entlang der Fährte (alle paar Stützpunkte einer).
  const pawIdx = pts.map((_, i) => i).filter((i) => i % 6 === 3)

  return (
    <div className="stage">
      <Meter progress={reached / (N - 1)} />
      <div className="training fade-in">
        <div className="training-title">{title}</div>
        <svg
          className="trace-wrap"
          viewBox={`0 0 ${W} ${H}`}
          style={{ opacity: asked ? 1 : 0.5, transition: 'opacity 300ms ease' }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            follow(e)
          }}
          onPointerMove={follow}
        >
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,246,224,0.9)" />
              <stop offset="100%" stopColor="rgba(224,168,120,0)" />
            </radialGradient>
          </defs>
          {/* blasse Fährte */}
          <path d={pathD} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
          {/* eingefärbter (geschnüffelter) Teil — leuchtet warm */}
          <path d={trailD} fill="none" stroke="var(--accent-soft)" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
          {/* Pfotenabdrücke: erledigte leuchten, kommende sind blass */}
          {pawIdx.map((i) => (
            <text
              key={i}
              x={pts[i].x}
              y={pts[i].y}
              fontSize={30}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ opacity: i <= reached ? 1 : 0.32, transition: 'opacity 250ms ease' }}
            >
              🐾
            </text>
          ))}
          {/* Ziel am Ende der Spur (Mütze / Dieb / Ball) */}
          <image href={targetImg} x={goal.x - 66} y={goal.y - 66} width={132} height={132} preserveAspectRatio="xMidYMid meet" />
          {/* die schnüffelnde Nase (Hermès folgt der Spur) */}
          <circle cx={head.x} cy={head.y} r={34} fill="url(#glow)" />
          <text x={head.x} y={head.y} fontSize={40} textAnchor="middle" dominantBaseline="central">
            🐕
          </text>
        </svg>
      </div>
      {reached > 0 && !doneRef.current && (
        <button className="back-btn" onClick={() => setReached(0)}>
          ↩ Zurück
        </button>
      )}
    </div>
  )
}
