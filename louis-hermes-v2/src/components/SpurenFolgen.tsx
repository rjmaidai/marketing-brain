import { useEffect, useMemo, useRef, useState } from 'react'
import { spielsatzSrc, SPIELSATZ, graphicSrc } from '../data/story'
import { resumeMic } from '../lib/mic'
import { showFeedback } from '../lib/feedback'
import { playSample, resumeAudio, playTone } from '../lib/audio'
import { Meter } from './Meter'

// Spiel „Spürnase / Spuren folgen" — VERSION 2, mit echten Hintergründen:
// Jedes Spiel hat ein Landschaftsbild mit einem sichtbaren Weg. Der Finger MUSS
// dem Weg im Bild folgen (die helle Spur liegt genau auf dem Pfad) — IMMER von
// links nach rechts. Am rechten Bildrand wartet das gesuchte Sujet (Mütze bzw.
// Dieb); nur dieses eine Sujet wird gezeigt, sonst keine Extra-Bildchen.

interface Props {
  seed: number
  target: 'muetze' | 'dieb'
  onDone: () => void
}

type Cfg = {
  bg: string
  w: number
  h: number
  title: string
  wp: [number, number][]
  // Ziel-Sujet am rechten Rand (Bild-Pixel-Box).
  sujet: { img: string; x: number; y: number; w: number; h: number }
}

// Stützpunkte direkt in Bild-Pixeln (Bilder sind 1280 breit) auf dem sichtbaren
// Sandweg abgegriffen. Reihenfolge = Laufrichtung: immer von links nach rechts.
const TRACE: Record<Props['target'], Cfg> = {
  muetze: {
    bg: 'spur_muetze.jpg',
    w: 1280,
    h: 853,
    title: 'Schnüffle zur Mütze',
    // Vom Nutzer im Browser exakt eingezeichnet.
    wp: [
      [21, 513], [79, 509], [150, 493], [227, 465], [287, 417], [344, 373],
      [416, 328], [482, 290], [560, 265], [633, 258], [709, 263], [778, 294],
      [848, 338], [915, 388], [992, 437], [1058, 492], [1129, 520], [1205, 538],
      [1262, 550],
    ],
    sujet: { img: 'muetze.png', x: 955, y: 430, w: 320, h: 213 },
  },
  dieb: {
    bg: 'spur_dieb.jpg',
    w: 1280,
    h: 960,
    title: 'Der Spur zum Dieb folgen',
    // Vom Nutzer im Browser exakt eingezeichnet.
    wp: [
      [5, 318], [59, 364], [89, 428], [125, 490], [167, 512], [225, 521],
      [273, 499], [318, 475], [371, 465], [419, 487], [465, 522], [519, 575],
      [572, 612], [638, 647], [713, 668], [793, 637], [858, 612], [894, 583],
      [927, 568], [980, 536], [1042, 540], [1101, 556], [1135, 590], [1182, 624],
      [1233, 655], [1275, 646],
    ],
    sujet: { img: 'dieb_frei.png', x: 975, y: 360, w: 300, h: 288 },
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
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  void seed // der Weg ist fest ans Bild gebunden
  const pts = useMemo(() => resample(cfg.wp, N), [cfg])
  const REACH = cfg.w * 0.085 // enger Fangradius: der Finger MUSS auf dem Weg bleiben

  useEffect(() => {
    resumeMic()
    resumeAudio()
    // Nach der Ansage freigeben — ABER nie dauerhaft sperren: falls der Ton
    // mal nicht startet/auflöst, gibt ein Fail-safe nach kurzer Zeit trotzdem frei.
    let fired = false
    const arm = () => {
      if (!fired && mountedRef.current) {
        fired = true
        setAsked(true)
      }
    }
    playSample(spielsatzSrc(SPIELSATZ.spuren)).then(arm)
    const t = window.setTimeout(arm, 4000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Voller Weg (blasse Führung) und zurückgelegter Weg (leuchtet).
  const guideD = useMemo(
    () => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
    [pts],
  )
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

  // Nur vorwärts, nur wenn der Finger nahe am Weg ist. Ein kleines Fenster nach
  // vorn verhindert, dass man an Kurven „abkürzt" oder springt.
  function follow(e: React.PointerEvent<SVGSVGElement>) {
    if (doneRef.current || !asked) return
    const p = toLocal(e)
    let best = reached
    let bestD = Infinity
    const look = Math.min(N - 1, reached + 10)
    for (let i = reached; i <= look; i++) {
      const d = Math.hypot(pts[i].x - p.x, pts[i].y - p.y)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    if (bestD > REACH || best <= reached) return
    if (Math.floor(best / 12) > Math.floor(reached / 12)) playTone(Math.min(5, Math.floor(best / 12)))
    setReached(best)
    if (best >= N - 1) {
      doneRef.current = true
      showFeedback('richtig').then(onDone)
    }
  }

  const head = pts[Math.min(reached, N - 1)]
  const su = cfg.sujet

  return (
    <div className="stage stage--meter">
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
          {/* fester Weg als sichtbare Führung — HIER entlang, nicht frei ziehen */}
          <path d={guideD} fill="none" stroke="rgba(255,248,230,0.5)" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 26" />
          {/* zurückgelegter Weg leuchtet warm */}
          <path d={trailD} fill="none" stroke="rgba(255,214,150,0.75)" strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
          {/* gesuchtes Sujet — nur dieses, am rechten Rand */}
          <image href={graphicSrc(su.img)} x={su.x} y={su.y} width={su.w} height={su.h} preserveAspectRatio="xMidYMid meet" />
          {/* leuchtender Punkt an der Fingerspitze (kein Tier, kein Extra-Bild) */}
          <circle cx={head.x} cy={head.y} r={64} fill="url(#nose)" />
          <circle cx={head.x} cy={head.y} r={18} fill="rgba(255,224,170,0.95)" />
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
