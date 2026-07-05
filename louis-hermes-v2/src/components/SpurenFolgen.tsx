import { useEffect, useMemo, useRef, useState } from 'react'
import { spielsatzSrc, SPIELSATZ, graphicSrc } from '../data/story'
import { resumeMic } from '../lib/mic'
import { showFeedback } from '../lib/feedback'
import { playSample, resumeAudio } from '../lib/audio'

// Spiel „Spürnase / Spuren folgen" — VERSION 2:
// Hermès schnüffelt die Fährte nach. Am ENDE der Spur wartet das Ziel —
// die Mütze (Beat 8) oder der Dieb (Beat 15). Der Finger zieht die Fährte nach,
// bis er beim Ziel ankommt. Kein Timer — die Linie wartet.

interface Props {
  seed: number
  target: 'muetze' | 'dieb'
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
    if (next !== reached) setReached(next)
    if (next >= N - 1) {
      doneRef.current = true
      showFeedback('richtig').then(onDone)
    }
  }

  const head = pts[Math.min(reached, N - 1)]
  const start = pts[0]
  const goal = pts[N - 1]
  const targetImg = graphicSrc(target === 'muetze' ? 'muetze.png' : 'dieb.png')

  return (
    <div className="stage">
      <div className="training fade-in">
        <div className="training-title">
          {target === 'muetze' ? 'Schnüffle zur Mütze' : 'Folge der Spur zum Dieb'}
        </div>
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
          {/* Ziel am Ende der Spur (Mütze bzw. Dieb) */}
          <image href={targetImg} x={goal.x - 60} y={goal.y - 60} width={120} height={120} preserveAspectRatio="xMidYMid meet" />
          {/* blasse Fährte */}
          <path d={pathD} fill="none" stroke="rgba(244,236,224,0.18)" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 22" />
          {/* eingefärbter Teil */}
          <path d={trailD} fill="none" stroke="var(--accent-soft)" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
          {/* Startpunkt (Pfote) */}
          {reached === 0 && <circle cx={start.x} cy={start.y} r={22} fill="var(--accent)" />}
          {/* aktueller Kopf (die schnüffelnde Nase) */}
          <circle cx={head.x} cy={head.y} r={20} fill="var(--accent)" />
        </svg>
      </div>
    </div>
  )
}
