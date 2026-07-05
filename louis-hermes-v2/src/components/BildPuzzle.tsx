import { useEffect, useMemo, useRef, useState } from 'react'
import { graphicSrc, spielsatzSrc, SPIELSATZ } from '../data/story'
import { resumeMic } from '../lib/mic'
import { showFeedback } from '../lib/feedback'
import { playSample, resumeAudio } from '../lib/audio'
import { Meter } from './Meter'

// Spiel „Bild-Puzzle" — VERSION 2, viel einfacher:
// Ein Bild (Polizeimarke ODER Hermès-Gesicht) hat ein rundes Loch. Unten liegen
// GENAU ZWEI Teile: das passende (füllt das Loch) und ein offensichtlich
// falsches (der Ball). Das Kind ZIEHT das richtige Teil in die Form.
// Kein Klicken — schieben. Bedienbar erst, wenn die Frage gestellt wurde.

interface Props {
  seed: number
  variant: 'marke' | 'face' | 'ball'
  onDone: () => void
}

const MAX_ATTEMPTS = 3

const PICTURE: Record<Props['variant'], string> = {
  marke: 'marke_puzzle.png',
  face: 'face_puzzle.png',
  ball: 'ball_puzzle.png',
}

export function BildPuzzle({ seed, variant, onDone }: Props) {
  const picture = graphicSrc(PICTURE[variant])
  // Das offensichtlich FALSCHE Teil: beim Ball-Puzzle der Hund, sonst der Ball.
  const wrongPiece = graphicSrc(variant === 'ball' ? 'face_puzzle.png' : 'ball.png')

  const [asked, setAsked] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [progress, setProgress] = useState(0)
  const [drag, setDrag] = useState<{ side: number; x: number; y: number } | null>(null)
  const doneRef = useRef(false)
  const wrongRef = useRef(0)
  const mountedRef = useRef(true)
  const holeRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Das richtige Teil liegt zufällig links (0) oder rechts (1).
  const correctSide = useMemo(() => seed % 2, [seed])

  useEffect(() => () => void (mountedRef.current = false), [])

  function askTask() {
    setAsked(false)
    resumeMic()
    resumeAudio()
    playSample(spielsatzSrc(SPIELSATZ.puzzle)).then(() => {
      if (mountedRef.current && !doneRef.current) setAsked(true)
    })
  }
  useEffect(() => {
    askTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onPointerDown(side: number, e: React.PointerEvent) {
    if (!asked || placed || doneRef.current) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    startRef.current = { x: e.clientX, y: e.clientY }
    setDrag({ side, x: 0, y: 0 })
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return
    setDrag({ ...drag, x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y })
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!drag) return
    const side = drag.side
    const hole = holeRef.current?.getBoundingClientRect()
    const overHole =
      !!hole &&
      e.clientX >= hole.left - 50 &&
      e.clientX <= hole.right + 50 &&
      e.clientY >= hole.top - 50 &&
      e.clientY <= hole.bottom + 50
    setDrag(null)
    if (!overHole) return // daneben losgelassen -> Teil springt zurück, kein Fehler

    if (side === correctSide) {
      setPlaced(true)
      doneRef.current = true
      setProgress(1) // Balken voll -> Konfetti-Ausbruch
      showFeedback('richtig').then(onDone)
    } else {
      // Falsches Teil auf die Form gezogen -> passt nicht.
      wrongRef.current += 1
      if (wrongRef.current >= MAX_ATTEMPTS) {
        doneRef.current = true
        showFeedback('falsch').then(onDone)
      } else {
        showFeedback('falsch').then(askTask)
      }
    }
  }

  const pieceStyle = (side: number): React.CSSProperties => {
    const isCorrect = side === correctSide
    const dragging = drag?.side === side
    return {
      transform: dragging ? `translate(${drag!.x}px, ${drag!.y}px) scale(1.06)` : 'none',
      transition: dragging ? 'none' : 'transform 300ms cubic-bezier(0.22,1,0.36,1)',
      backgroundImage: `url(${isCorrect ? picture : wrongPiece})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      touchAction: 'none',
      zIndex: dragging ? 5 : 1,
    }
  }

  return (
    <div className="stage stage--meter" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <Meter progress={progress} />
      <div className="training fade-in">
        <div className="training-title">{placed ? 'Geschafft!' : 'Zieh das richtige Teil hin'}</div>

        {/* Das Bild mit dem runden Loch */}
        <div className="puzzle-pic">
          <img src={picture} alt="" draggable={false} />
          {!placed && <div ref={holeRef} className="puzzle-hole" />}
        </div>

        {/* Zwei Teile — das richtige und ein offensichtlich falsches (Ball) */}
        {!placed && (
          <div
            className="piece-row"
            style={{ pointerEvents: asked ? 'auto' : 'none', opacity: asked ? 1 : 0.5 }}
          >
            {[0, 1].map((side) => (
              <button
                key={side}
                className="drag-piece"
                aria-label={side === correctSide ? 'passendes Teil' : 'anderes Teil'}
                style={pieceStyle(side)}
                onPointerDown={(e) => onPointerDown(side, e)}
              />
            ))}
          </div>
        )}
      </div>
      {asked && !placed && (
        <button className="back-btn" onClick={askTask}>
          ↩ Nochmal
        </button>
      )}
    </div>
  )
}
