import { useEffect, useRef, useState } from 'react'
import { lautkarteSrc, spielsatzSrc, SPIELSATZ } from '../data/story'
import { ensureMic, resumeMic, currentLevel, micState } from '../lib/mic'
import { showFeedback } from '../lib/feedback'

// Laut-Übung.
// Ablauf: Lautkarte spielt (die Mutter spricht den Laut) → „Jetzt bist du dran"
// → Mikrofon hört zu. Erkennt es den Laut → weiter (die Story ist die Belohnung).
// Hört es nichts, fragt es 2–3× sanft nach und geht dann trotzdem weiter,
// damit das Kind nie an einer Mauer steht. Kein „falsch", kein Ton, der bestraft.

interface Props {
  laut: string
  onDone: (mastered: boolean) => void
}

type Phase = 'card' | 'listen' | 'success' | 'fallback'

const LISTEN_MS = 5200 // wie lange pro Versuch zugehört wird
const MAX_ATTEMPTS = 3 // danach geht es ruhig weiter

export function LautUebung({ laut, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('card')
  const [attempt, setAttempt] = useState(1)
  const cardRef = useRef<HTMLVideoElement>(null)
  const orbRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const doneRef = useRef(false)
  // Damit „Jetzt bist du dran" nicht erst am Videoende kommt: sobald die Mutter
  // den Laut gesprochen hat, schneiden wir den langsamen Schluss ab.
  const cardAdvancedRef = useRef(false)
  const listenAtRef = useRef(3.6)

  // Beim ersten Betreten: Mikrofon-Kette sicherstellen (Erlaubnis kam am Start).
  useEffect(() => {
    void ensureMic()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      cueRef.current?.pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Karte abspielen (nur beim 1. Versuch die ganze Karte, danach nur noch die Ansage).
  useEffect(() => {
    if (phase !== 'card') return
    cardAdvancedRef.current = false
    const v = cardRef.current
    if (attempt === 1 && v) {
      v.currentTime = 0
      v.play().catch(() => advanceCard())
    } else {
      beginListen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attempt])

  // Früh weiter: sobald der Laut gesprochen ist, den Tail überspringen und
  // direkt zu „Jetzt bist du dran" + Zuhören gehen.
  function advanceCard() {
    if (cardAdvancedRef.current) return
    cardAdvancedRef.current = true
    const v = cardRef.current
    v?.pause()
    // Auf den letzten Frame springen — er zeigt die „Jetzt bist du dran"-Grafik
    // der Karte, über die der Mikrofon-Orb dann transparent liegt.
    if (v && v.duration) {
      try {
        v.currentTime = Math.max(0, v.duration - 0.05)
      } catch {
        /* egal */
      }
    }
    beginListen()
  }

  function playCue(after: () => void) {
    resumeMic()
    const a = new Audio(spielsatzSrc(SPIELSATZ.laut))
    cueRef.current = a
    a.onended = after
    a.onerror = after
    a.play().catch(after)
  }

  function beginListen() {
    // Erst die Ansage „Jetzt bist du dran", dann zuhören — nie überlagert.
    playCue(() => {
      if (doneRef.current) return
      setPhase('listen')
    })
  }

  // Zuhören: Pegel messen, Orb atmet mit, klarer Ausschlag = erkannt.
  useEffect(() => {
    if (phase !== 'listen') return
    if (micState() !== 'granted') {
      setPhase('fallback')
      return
    }

    const start = performance.now()
    let noiseFloor = 0.02
    let calibrating = true
    let loudFrames = 0

    const tick = () => {
      const level = currentLevel()

      // Orb reagiert weich auf die Stimme.
      if (orbRef.current) {
        const scale = 1 + Math.min(level * 6, 0.9)
        orbRef.current.style.transform = `scale(${scale.toFixed(3)})`
        orbRef.current.style.boxShadow = `0 0 ${Math.round(level * 320)}px rgba(224,168,120,0.65)`
      }

      const elapsed = performance.now() - start

      // Erste ~500ms: Grundrauschen lernen (Schwelle sitzt am lautesten Moment).
      if (calibrating) {
        noiseFloor = Math.max(noiseFloor, level)
        if (elapsed > 500) calibrating = false
      } else {
        const threshold = Math.max(0.05, noiseFloor * 2.6)
        if (level > threshold) {
          loudFrames++
          // ~7 Frames (~120ms) klar über der Schwelle = echte Lautäusserung,
          // nicht bloss ein Klick oder Rascheln.
          if (loudFrames >= 7) {
            succeed()
            return
          }
        } else {
          loudFrames = Math.max(0, loudFrames - 1)
        }
      }

      if (elapsed > LISTEN_MS) {
        noMore()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function succeed() {
    if (doneRef.current) return
    doneRef.current = true
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPhase('success')
    // Lob (Hermès, Daumen hoch + Stimme), dann ruhig in die Story zurück.
    showFeedback('richtig').then(() => onDone(true))
  }

  function noMore() {
    if (doneRef.current) return
    if (attempt < MAX_ATTEMPTS) {
      // Sanftes „nochmal" (Hermès zuckt freundlich), dann neuer Versuch —
      // ohne dem Kind zu zeigen, dass es sowieso weitergeht.
      showFeedback('falsch').then(() => {
        if (doneRef.current) return
        setAttempt((a) => a + 1)
        setPhase('card')
      })
    } else {
      // Nach 2–3 Versuchen still weiter. Gleicher ruhiger Übergang wie bei Erfolg.
      doneRef.current = true
      setPhase('success')
      window.setTimeout(() => onDone(false), 500)
    }
  }

  const title =
    phase === 'card'
      ? attempt === 1
        ? 'Hör gut zu …'
        : 'Nochmal — sag den Laut'
      : phase === 'listen'
        ? 'Jetzt du!'
        : phase === 'fallback'
          ? 'Sag den Laut'
          : ''

  return (
    <div className="stage">
      <div className="training fade-in">
        <div className="training-title">{title}</div>

        {/* Die Lautkarte bleibt sichtbar — beim Zuhören liegt der Mikrofon-Orb
            TRANSPARENT über dem letzten Frame, als visuelle Hilfe fürs Kind. */}
        <div className="media-frame laut-card">
          <video
            ref={cardRef}
            src={lautkarteSrc(laut)}
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration || 6
              // Kurz nachdem die Mutter den Laut gesprochen hat (nicht erst am Ende).
              listenAtRef.current = Math.min(6.2, Math.max(5.0, d - 0.6))
            }}
            onTimeUpdate={(e) => {
              if (e.currentTarget.currentTime >= listenAtRef.current) advanceCard()
            }}
            onEnded={() => advanceCard()}
          />

          {(phase === 'listen' || phase === 'fallback') && (
            <div className="laut-listen">
              <div ref={orbRef} className="mic-orb">
                <MicIcon />
              </div>
              {phase === 'fallback' && (
                // Kein Mikrofon erlaubt: die Bezugsperson gibt mit einem Tipp weiter.
                <div className="tap-hint" style={{ marginTop: 12 }}>
                  <button className="pulse-dot" aria-label="Weiter" onClick={() => onDone(false)} />
                  <span className="tap-label">Weiter</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
      <path d="M17 12a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2z" />
    </svg>
  )
}
