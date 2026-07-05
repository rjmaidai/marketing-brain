import { useEffect, useMemo, useRef, useState } from 'react'
import { spielsatzSrc, SPIELSATZ, graphicSrc } from '../data/story'
import { resumeMic } from '../lib/mic'
import { showFeedback } from '../lib/feedback'
import { playSample, resumeAudio, playTone } from '../lib/audio'
import { Meter } from './Meter'

// Spiel „Spürnase / Spuren folgen" — VERSION 2, mit echten Hintergründen:
// Jedes Spiel hat ein Landschaftsbild mit einem sichtbaren Weg. Der Finger MUSS
// dem Weg im Bild folgen (die Linie liegt genau auf dem Pfad). Hermès (die Nase)
// schnüffelt entlang. Kein Timer — der Weg wartet.

interface Props {
  seed: number
  target: 'muetze' | 'dieb' | 'ball'
  onDone: () => void
}

// Hintergrund + Weg-Stützpunkte (in Bild-Pixeln) je Ziel.
// Stützpunkte sind direkt in Bild-Pixeln (die Bilder sind 1280 breit) auf dem
// sichtbaren Sandweg abgegriffen. Reihenfolge = Laufrichtung der Nase; der letzte
// Punkt liegt am Ziel (Ball / Dieb / Mütze).
const TRACE: Record<Props['target'], { bg: string; w: number; h: number; title: string; wp: [number, number][] }> = {
  ball: {
    bg: 'spur_ball.jpg',
    w: 1280,
    h: 960,
    title: 'Schnüffle zum Ball',
    // Vom Baum (rechts) den S-Bogen entlang zurück zum Ball am Zaun (links).
    wp: [
      [1160, 485], [1090, 510], [1010, 555], [930, 610], [850, 650],
      [770, 665], [690, 615], [620, 545], [560, 470], [500, 415],
      [430, 370], [340, 340], [250, 345], [185, 360],
    ],
  },
  dieb: {
    bg: 'spur_dieb.jpg',
    w: 1280,
    h: 960,
    title: 'Der Spur zum Dieb folgen',
    // Vom linken Rand die Uferschlange entlang nach rechts zum Dieb.
    wp: [
      [0, 300], [90, 400], [170, 490], [250, 518], [330, 500],
      [400, 540], [470, 608], [540, 628], [620, 608], [700, 570],
      [780, 600], [880, 648], [980, 658], [1080, 640], [1180, 640], [1280, 660],
    ],
  },
  muetze: {
    bg: 'spur_muetze.jpg',
    w: 1280,
    h: 853,
    title: 'Schnüffle zur Mütze',
    // Vom linken Rand über den Hügel-Bogen nach rechts zur Mütze.
    wp: [
      [0, 520], [120, 490], [250, 440], [400, 370], [560, 290],
      [680, 250], [800, 270], [920, 350], [1040, 460], [1150, 550], [1280, 590],
    ],
  },
}

const N = 64

// Stützpunkte gleichmässig entlang der Polylinie abtasten (nach Bogenlänge).
function resample(wp: [number, number][], n: number) {
  const seg: number[] = []
  let total = 0
  for (let i = 1; i < wp.length; i++) {
    const d = Math.hypot(wp[i][0] - wp[i - 1][0], wp[i][1] - wp[i - 1][1])
    seg.push(d)
    total += d
  }
  const out: { x: number; y: number }[] = []
  for (let k = 0; k < n; k++) {
    const t = (k / (n - 1)) * total
    let acc = 0
    let i = 0
    while (i < seg.length && acc + seg[i] < t) {
      acc += seg[i]
      i++
    }
    const a = wp[Math.min(i, wp.length - 1)]
    const b = wp[Math.min(i + 1, wp.length - 1)]
    const f = seg[i] ? (t - acc) / seg[i] : 0
    out.push({ x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f })
  }
  return out
}

export function SpurenFolgen({ seed, target, onDone }: Props) {
  const cfg = TRACE[target]
  const [reached, setReached] = useState(0)
  const [asked, setAsked] = useState(false)
  const doneRef = useRef(false)
  const mountedRef = useRef(true)
  useEffect(() => () => void (mountedRef.current = false), [])

  // seed fliesst nur symbolisch ein — der Weg ist fest ans Bild gebunden.
  void seed
  const pts = useMemo(() => resample(cfg.wp, N), [cfg])
  const REACH = cfg.w * 0.12

  useEffect(() => {
    resumeMic()
    resumeAudio()
    playSample(spielsatzSrc(SPIELSATZ.spuren)).then(() => {
      if (mountedRef.current) setAsked(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const trailD = useMemo(
    () => pts.slice(0, reached + 1).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
    [pts, reached],
  )

  function toLocal(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * cfg.w,
      y: ((e.clientY - rect.top) / rect.height) * cfg.h,
    }
  }

  function follow(e: React.PointerEvent<SVGSVGElement>) {
    if (doneRef.current || !asked) return
    const p = toLocal(e)
    let next = reached
    for (let i = reached; i < N; i++) {
      if (Math.hypot(pts[i].x - p.x, pts[i].y - p.y) < REACH) next = i
      else break
    }
    if (next !== reached) {
      if (Math.floor(next / 10) > Math.floor(reached / 10)) playTone(Math.min(5, Math.floor(next / 10)))
      setReached(next)
    }
    if (next >= N - 1) {
      doneRef.current = true
      showFeedback('richtig').then(onDone)
    }
  }

  const head = pts[Math.min(reached, N - 1)]
  const pawIdx = pts.map((_, i) => i).filter((i) => i % 6 === 3)

  return (
    <div className="stage">
      <Meter progress={reached / (N - 1)} />
      <div className="training fade-in">
        <div className="training-title">{cfg.title}</div>
        <svg
          className="trace-wrap"
          viewBox={`0 0 ${cfg.w} ${cfg.h}`}
          style={{ aspectRatio: `${cfg.w} / ${cfg.h}`, opacity: asked ? 1 : 0.5, transition: 'opacity 300ms ease' }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            follow(e)
          }}
          onPointerMove={follow}
        >
          <defs>
            <radialGradient id="nose" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,246,224,0.95)" />
              <stop offset="100%" stopColor="rgba(255,246,224,0)" />
            </radialGradient>
          </defs>
          {/* Landschaft mit dem Weg */}
          <image href={graphicSrc(cfg.bg)} x={0} y={0} width={cfg.w} height={cfg.h} preserveAspectRatio="xMidYMid slice" />
          {/* Pfotenabdrücke entlang des Weges: erledigte leuchten, kommende blass */}
          {pawIdx.map((i) => (
            <text
              key={i}
              x={pts[i].x}
              y={pts[i].y}
              fontSize={62}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ opacity: i <= reached ? 1 : 0.4, transition: 'opacity 250ms ease' }}
            >
              🐾
            </text>
          ))}
          {/* zurückgelegter Weg leuchtet warm */}
          <path d={trailD} fill="none" stroke="rgba(255,214,150,0.55)" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
          {/* die schnüffelnde Nase (Hermès) */}
          <circle cx={head.x} cy={head.y} r={70} fill="url(#nose)" />
          <text x={head.x} y={head.y} fontSize={90} textAnchor="middle" dominantBaseline="central">
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
