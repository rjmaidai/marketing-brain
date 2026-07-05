import { useEffect, useRef, useState } from 'react'
import { lautkarteSrc, spielsatzSrc, voiceSrc, SPIELSATZ, VOICE } from '../data/story'
import { ensureMic, resumeMic, currentLevel, micState, stopMic } from '../lib/mic'
import { showFeedback } from '../lib/feedback'
import { playSample, resumeAudio } from '../lib/audio'

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
const MIN_MASK_MS = 2000 // die Eingabemaske „Jetzt du!" steht mindestens so lange
const POST_INPUT_MS = 1000 // nach erkannter Toneingabe so lange warten, dann Ergebnis

export function LautUebung({ laut, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('card')
  const [attempt, setAttempt] = useState(1)
  const cardRef = useRef<HTMLVideoElement>(null)
  const orbRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const successTimer = useRef<number | null>(null)
  const doneRef = useRef(false)
  // Damit „Jetzt bist du dran" nicht erst am Videoende kommt: sobald die Mutter
  // den Laut gesprochen hat, schneiden wir den langsamen Schluss ab.
  const cardAdvancedRef = useRef(false)
  const listenAtRef = useRef(3.6)

  // Beim ersten Betreten: Mikrofon-Kette sicherstellen (Erlaubnis kam am Start).
  useEffect(() => {
    void ensureMic()
    resumeAudio()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      // Mikrofon freigeben, wenn die Laut-Übung verlassen wird — sonst bleibt
      // iOS in „Play-and-Record" und leitet spätere Töne auf den leisen Hörer.
      stopMic()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Karte abspielen — bei JEDEM Versuch die GANZE Lautkarte inkl. „Hör gut zu".
  // (Das Kind kann sich den Laut sonst nicht merken; nach „nochmal" braucht es
  // das komplette Vorbild wieder.)
  useEffect(() => {
    if (phase !== 'card') return
    void ensureMic() // pro Versuch sicherstellen (kann nach stopMic neu nötig sein)
    cardAdvancedRef.current = false
    const v = cardRef.current
    if (!v) {
      beginListen()
      return
    }
    // Video jetzt (im Aktivierungsfenster) stumm freischalten, dann ERST
    // „Hör gut zu" sprechen und danach die Lautkarte (die Mutter) laufen lassen.
    v.muted = true
    const pr = v.play()
    if (pr && typeof pr.then === 'function') {
      pr.then(() => {
        v.pause()
        try {
          v.currentTime = 0
        } catch {
          /* egal */
        }
      }).catch(() => {})
    }
    playSample(voiceSrc(VOICE.hoerGutZu)).then(() => {
      if (cardAdvancedRef.current) return
      const v2 = cardRef.current
      if (!v2) return
      v2.muted = false
      try {
        v2.currentTime = 0
      } catch {
        /* egal */
      }
      v2.play().catch(() => advanceCard())
    })
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
    // Zuverlässig über den freigeschalteten Audio-Kanal (nicht mehr <audio>).
    playSample(spielsatzSrc(SPIELSATZ.laut)).then(after)
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
        const threshold = Math.max(0.035, noiseFloor * 2.0)
        if (level > threshold) {
          // Kurze, leise Laute (p, t, k, f, s) sind nur ein kurzer Ausschlag —
          // ein klarer Spitzenwert zählt darum mehr, damit auch „ppp" erkannt wird.
          loudFrames += level > threshold * 2.2 ? 3 : 2
          if (loudFrames >= 8) {
            // Nicht sofort zum Ergebnis springen (das kam viel zu schnell):
            // Eingabemaske mindestens MIN_MASK_MS, und nach der Toneingabe noch
            // mindestens POST_INPUT_MS ruhig warten, dann erst das Ergebnis.
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            const now = performance.now()
            const showAt = Math.max(start + MIN_MASK_MS, now + POST_INPUT_MS)
            successTimer.current = window.setTimeout(succeed, Math.max(0, showAt - now))
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
      if (successTimer.current) window.clearTimeout(successTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function succeed() {
    if (doneRef.current) return
    doneRef.current = true
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPhase('success')
    stopMic() // Mikro freigeben -> Lautsprecher zurück, damit das Lob hörbar ist
    // Lob (Hermès, Daumen hoch + Stimme), dann ruhig in die Story zurück.
    showFeedback('richtig').then(() => onDone(true))
  }

  function noMore() {
    if (doneRef.current) return
    // Mikro vor der Rückmeldung freigeben, damit die Stimme über den Lautsprecher
    // kommt; bei einem neuen Versuch wird es in der 'card'-Phase wieder geholt.
    stopMic()
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
      ? 'Hör gut zu …'
      : phase === 'listen'
        ? 'Jetzt du!'
        : phase === 'fallback'
          ? 'Sag den Laut'
          : ''

  return (
    <div className="stage stage--laut">
      {/* Das Kartenbild bildfüllend, stark weichgezeichnet + abgedunkelt als
          Hintergrund — so füllt das Blau der Karte den Schirm und die scharfe
          Karte poppt davor hervor. */}
      <video
        className="laut-backdrop"
        src={lautkarteSrc(laut)}
        muted
        autoPlay
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="training laut-content fade-in">
        <div className="training-title">{title}</div>

        {/* Scharfe Karte in moderater Grösse, mittig vor dem weichen Hintergrund. */}
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
