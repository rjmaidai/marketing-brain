import { useEffect, useRef, useState } from 'react'
import { BEATS, beatSrc, makeLautAssignment } from './data/story'
import { loadProgress, saveProgress, resetProgress } from './lib/progress'
import { LautUebung } from './components/LautUebung'
import { SpurenFolgen } from './components/SpurenFolgen'
import { Merken } from './components/Merken'
import { BildPuzzle } from './components/BildPuzzle'
import { StartScreen } from './components/StartScreen'

type Screen = 'start' | 'beat' | 'training'

export default function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [index, setIndex] = useState(0) // Index in BEATS
  const [ended, setEnded] = useState(false)
  const [beatFaded, setBeatFaded] = useState(false) // Bild sichtbar (eingeblendet)?
  const [mastered, setMastered] = useState<string[]>(() => loadProgress().mastered)
  // Lautkarten pro Durchlauf neu gemischt (DIEB bleibt fix, siehe story.ts).
  const [lautMap, setLautMap] = useState<Record<number, string>>(() => makeLautAssignment())

  // EIN durchgehendes Video-Element für ALLE Beats. Es wird beim Start (echte
  // Fingergeste) einmal „freigeschaltet" — danach lässt iPad/Safari jeden
  // weiteren Beat automatisch mit Ton starten, ohne dass man tippen muss.
  const videoRef = useRef<HTMLVideoElement>(null)
  const fadeTimer = useRef<number | null>(null)

  // Ruhiges Tempo: langsam ins Bild blenden, dann erst läuft der Beat.
  const FADE_IN_MS = 900
  const FADE_OUT_MS = 500
  const PLAY_DELAY_MS = 1000 // Beat startet erst, wenn das Bild ganz da ist

  const beat = BEATS[index]
  const isLast = index === BEATS.length - 1

  // Fortschritt merken (wie weit + welche Laute erkannt).
  useEffect(() => {
    if (screen === 'start') return
    const prev = loadProgress()
    saveProgress({ furthest: Math.max(prev.furthest, index), mastered })
  }, [index, screen, mastered])

  const clearFade = () => {
    if (fadeTimer.current) {
      window.clearTimeout(fadeTimer.current)
      fadeTimer.current = null
    }
  }

  // Beat laden, langsam ins Bild blenden — und ERST wenn das Bild ganz da ist,
  // startet der Beat mit dem Voiceover. Ruhe zwischen den Teilen der Geschichte.
  function loadAndFadeInBeat(i: number, unlock: boolean) {
    const v = videoRef.current
    if (!v) return
    clearFade()
    setEnded(false)
    setBeatFaded(false) // unsichtbar starten -> dann einblenden
    if (v.getAttribute('src') !== beatSrc(BEATS[i].file)) {
      v.src = beatSrc(BEATS[i].file)
    }
    try {
      v.currentTime = 0
    } catch {
      /* egal */
    }
    v.pause() // Bild steht still (Frame 0), noch KEIN Voiceover

    if (unlock) {
      // In der Fingergeste einmal freischalten: kurz stumm anspielen und stoppen.
      v.muted = true
      const p = v.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          v.pause()
          try {
            v.currentTime = 0
          } catch {
            /* egal */
          }
          v.muted = false
        }).catch(() => {
          v.muted = false
        })
      }
    }

    // langsam einblenden ...
    requestAnimationFrame(() => setBeatFaded(true))
    // ... und erst nach dem Fade den Beat laufen lassen.
    fadeTimer.current = window.setTimeout(() => {
      v.muted = false
      const pl = v.play()
      if (pl && typeof pl.catch === 'function') pl.catch(() => setEnded(true))
    }, PLAY_DELAY_MS)
  }

  function replayBeat() {
    const v = videoRef.current
    if (!v) return
    clearFade()
    setEnded(false)
    v.muted = false
    try {
      v.currentTime = 0
    } catch {
      /* egal */
    }
    v.play().catch(() => setEnded(true))
  }

  function start(resume: boolean) {
    const startIdx = resume ? Math.min(loadProgress().furthest, BEATS.length - 1) : 0
    setLautMap(makeLautAssignment()) // Lautkarten für diesen Durchlauf neu mischen
    if (!resume) {
      resetProgress()
      setMastered([])
    }
    setIndex(startIdx)
    setScreen('beat')
    // Freischaltung passiert hier in der Fingergeste; dann blendet der Beat ein.
    loadAndFadeInBeat(startIdx, true)
  }

  function goToBeat(i: number) {
    clearFade()
    if (screen === 'beat') {
      // Sichtbarer Beat -> erst ruhig ausblenden, dann den neuen einblenden.
      setBeatFaded(false)
      fadeTimer.current = window.setTimeout(() => {
        setIndex(i)
        loadAndFadeInBeat(i, false)
      }, FADE_OUT_MS)
    } else {
      // Aus einem Training/Feedback heraus: Training sofort weg, Beat blendet ein
      // (die Feedback-Ebene deckt den Wechsel, kein Aufblitzen des Trainings).
      setIndex(i)
      setScreen('beat')
      loadAndFadeInBeat(i, false)
    }
  }

  function afterBeat() {
    if (beat.training) setScreen('training')
    else goNextBeat()
  }

  function goNextBeat() {
    if (index < BEATS.length - 1) goToBeat(index + 1)
  }

  function restart() {
    clearFade()
    resetProgress()
    setMastered([])
    setIndex(0)
    setEnded(false)
    setBeatFaded(false)
    setScreen('start')
    const v = videoRef.current
    if (v) v.pause()
  }

  function afterLaut(didMaster: boolean) {
    const l = beat.training?.laut ?? lautMap[beat.id]
    if (didMaster && l) {
      setMastered((m) => (m.includes(l) ? m : [...m, l]))
    }
    goNextBeat()
  }

  return (
    <>
      {screen !== 'start' && <ProgressThread index={index} total={BEATS.length} />}

      {/* Basis-Ebene: das durchgehende Beat-Video. Immer im DOM, damit es
          freigeschaltet bleibt. Trainings und Startbild liegen als Ebene darüber. */}
      <div className="stage">
        <div
          className="media-frame"
          style={{
            opacity: beatFaded ? 1 : 0,
            transition: `opacity ${beatFaded ? FADE_IN_MS : FADE_OUT_MS}ms ease`,
          }}
        >
          <video
            ref={videoRef}
            playsInline
            preload="auto"
            onEnded={() => setEnded(true)}
          />
          {screen === 'beat' && ended && (
            <>
              {/* Riesiges Weiter-Ziel ÜBER dem ganzen Beat — kaum zu verfehlen. */}
              <button
                className="advance-overlay"
                aria-label={isLast ? 'Von vorne beginnen' : 'Weiter'}
                onClick={() => (isLast ? restart() : afterBeat())}
              >
                <span className="advance-dot" />
                <span className="advance-label">{isLast ? 'Nochmal von vorn' : 'Weiter'}</span>
              </button>
              {/* Kleiner Knopf für die Bezugsperson: Stimme nochmal hören. */}
              <button
                className="replay-corner"
                aria-label="Nochmal hören"
                onClick={(e) => {
                  e.stopPropagation()
                  replayBeat()
                }}
              >
                ↻
              </button>
            </>
          )}
        </div>
      </div>

      {screen === 'start' && (
        <StartScreen hasProgress={loadProgress().furthest > 0} onStart={start} />
      )}

      {screen === 'training' && beat.training && (
        <Training
          key={`t-${beat.id}`}
          beatId={beat.id}
          training={beat.training}
          laut={beat.training.laut ?? lautMap[beat.id]}
          nextBeatSrc={index < BEATS.length - 1 ? beatSrc(BEATS[index + 1].file) : undefined}
          onLaut={afterLaut}
          onGame={goNextBeat}
        />
      )}
    </>
  )
}

function Training({
  beatId,
  training,
  laut,
  nextBeatSrc,
  onLaut,
  onGame,
}: {
  beatId: number
  training: NonNullable<(typeof BEATS)[number]['training']>
  laut: string
  nextBeatSrc?: string
  onLaut: (mastered: boolean) => void
  onGame: () => void
}) {
  switch (training.type) {
    case 'laut':
      return <LautUebung laut={laut} onDone={onLaut} />
    case 'spuren':
      return <SpurenFolgen seed={beatId} onDone={onGame} />
    case 'merken':
      return <Merken seed={beatId} nextBeatSrc={nextBeatSrc} onDone={onGame} />
    case 'puzzle':
      return <BildPuzzle seed={beatId} nextBeatSrc={nextBeatSrc} onDone={onGame} />
  }
}

function ProgressThread({ index, total }: { index: number; total: number }) {
  return (
    <div className="thread" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`dot${i <= index ? ' done' : ''}`} />
      ))}
    </div>
  )
}
