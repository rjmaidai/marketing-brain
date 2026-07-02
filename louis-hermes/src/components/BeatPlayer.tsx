import { useEffect, useRef, useState } from 'react'

// Spielt genau einen Beat (Bild + Voice-over). Danach passiert NICHTS von selbst:
// die App wartet auf den ruhigen Weiter-Punkt. Louis gibt den Takt.

interface Props {
  src: string
  /** Wird aufgerufen, wenn das Kind auf Weiter tippt. */
  onDone: () => void
  /** Letzter Beat der Geschichte? Dann heisst der Punkt „von vorn". */
  isLast?: boolean
  onRestart?: () => void
}

export function BeatPlayer({ src, onDone, isLast, onRestart }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ended, setEnded] = useState(false)

  // Bei jedem neuen Beat von vorn: Video laden und abspielen.
  useEffect(() => {
    setEnded(false)
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    const p = v.play()
    if (p && typeof p.catch === 'function') {
      // Falls Autoplay (mit Ton) blockiert wird: das Bild steht, Kind tippt zum Hören.
      p.catch(() => setEnded(true))
    }
  }, [src])

  const replay = () => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    setEnded(false)
    v.play().catch(() => setEnded(true))
  }

  return (
    <div className="stage">
      <div className="media-frame fade-in" onClick={() => ended && replay()}>
        <video
          ref={videoRef}
          src={src}
          playsInline
          preload="auto"
          onEnded={() => setEnded(true)}
        />
      </div>

      {ended && (
        <div className="tap-hint">
          <button
            className="pulse-dot"
            aria-label={isLast ? 'Von vorne beginnen' : 'Weiter'}
            onClick={(e) => {
              e.stopPropagation()
              if (isLast && onRestart) onRestart()
              else onDone()
            }}
          />
          <span className="tap-label">{isLast ? 'Nochmal von vorn' : 'Weiter'}</span>
        </div>
      )}
    </div>
  )
}
