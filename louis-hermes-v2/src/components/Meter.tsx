import { useEffect, useRef, useState } from 'react'
import { graphicSrc } from '../data/story'

// „Hau den Lukas"-Fortschrittsbalken für die Minispiele.
// Je näher am Ziel, desto höher steigt der Puck am Turm — und desto mehr
// Konfetti (Marke, Keks, Ball) springt ins Bild. Zeigt dem Kind: du bist auf
// dem guten Weg. Bei einem Fehler steigt der Balken NICHT (progress bleibt).

const CONFETTI = ['marke.png', 'keks.png', 'ball.png'].map(graphicSrc)

interface Particle {
  id: number
  x: number
  img: string
  drift: number
  rot: number
  size: number
}

export function Meter({ progress }: { progress: number }) {
  const p = Math.max(0, Math.min(1, progress))

  const [parts, setParts] = useState<Particle[]>([])
  const idRef = useRef(0)
  const prevRef = useRef(0)

  // Konfetti spawnen, wenn der Fortschritt steigt (mehr, je höher man ist).
  useEffect(() => {
    if (progress > prevRef.current + 0.001) {
      const rise = progress - prevRef.current
      const count = Math.min(10, 1 + Math.round(rise * 12) + Math.round(p * 3))
      const fresh: Particle[] = []
      for (let i = 0; i < count; i++) {
        const r = Math.random()
        fresh.push({
          id: idRef.current++,
          x: 6 + r * 88,
          img: CONFETTI[idRef.current % CONFETTI.length],
          drift: (r - 0.5) * 80,
          rot: (Math.random() - 0.5) * 200,
          size: 34 + Math.random() * 34,
        })
      }
      setParts((prev) => [...prev, ...fresh].slice(-40))
    }
    prevRef.current = progress
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  return (
    <>
      <div className="meter" aria-hidden="true">
        <img className="meter-tower" src={graphicSrc('hau_gauge.png')} alt="" draggable={false} />
      </div>
      <div className="confetti-layer" aria-hidden="true">
        {parts.map((part) => (
          <img
            key={part.id}
            className="confetti"
            src={part.img}
            alt=""
            style={
              {
                left: `${part.x}%`,
                width: part.size,
                '--drift': `${part.drift}px`,
                '--rot': `${part.rot}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  )
}
