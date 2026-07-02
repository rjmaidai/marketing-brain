import { useEffect, useRef, useState } from 'react'
import { BEATS, beatSrc } from './data/story'
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
  const [mastered, setMastered] = useState<string[]>(() => loadProgress().mastered)

  // EIN durchgehendes Video-Element für ALLE Beats. Es wird beim Start (echte
  // Fingergeste) einmal „freigeschaltet" — danach lässt iPad/Safari jeden
  // weiteren Beat automatisch mit Ton starten, ohne dass man tippen muss.
  const videoRef = useRef<HTMLVideoElement>(null)

  const beat = BEATS[index]
  const isLast = index === BEATS.length - 1

  // Fortschritt merken (wie weit + welche Laute erkannt).
  useEffect(() => {
    if (screen === 'start') return
    const prev = loadProgress()
    saveProgress({ furthest: Math.max(prev.furthest, index), mastered })
  }, [index, screen, mastered])

  function playBeat(i: number) {
    const v = videoRef.current
    if (!v) return
    setEnded(false)
    if (v.getAttribute('src') !== beatSrc(BEATS[i].file)) {
      v.src = beatSrc(BEATS[i].file)
    }
    try {
      v.currentTime = 0
    } catch {
      /* egal */
    }
    const p = v.play()
    if (p && typeof p.catch === 'function') {
      // Sollte es doch einmal blockiert werden: Bild steht, Tipp spielt ab.
      p.catch(() => setEnded(true))
    }
  }

  function replayBeat() {
    const v = videoRef.current
    if (!v) return
    setEnded(false)
    try {
      v.currentTime = 0
    } catch {
      /* egal */
    }
    v.play().catch(() => setEnded(true))
  }

  function start(resume: boolean) {
    const startIdx = resume ? Math.min(loadProgress().furthest, BEATS.length - 1) : 0
    if (!resume) {
      resetProgress()
      setMastered([])
    }
    setIndex(startIdx)
    setScreen('beat')
    // WICHTIG: direkt in der Fingergeste abspielen — das schaltet das Element frei.
    playBeat(startIdx)
  }

  function goToBeat(i: number) {
    setIndex(i)
    setScreen('beat')
    playBeat(i)
  }

  function afterBeat() {
    if (beat.training) setScreen('training')
    else goNextBeat()
  }

  function goNextBeat() {
    if (index < BEATS.length - 1) goToBeat(index + 1)
  }

  function restart() {
    resetProgress()
    setMastered([])
    setIndex(0)
    setEnded(false)
    setScreen('start')
    const v = videoRef.current
    if (v) v.pause()
  }

  function afterLaut(didMaster: boolean) {
    if (didMaster && beat.training?.laut) {
      const l = beat.training.laut
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
        <div className="media-frame">
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
  nextBeatSrc,
  onLaut,
  onGame,
}: {
  beatId: number
  training: NonNullable<(typeof BEATS)[number]['training']>
  nextBeatSrc?: string
  onLaut: (mastered: boolean) => void
  onGame: () => void
}) {
  switch (training.type) {
    case 'laut':
      return <LautUebung laut={training.laut!} onDone={onLaut} />
    case 'spuren':
      return <SpurenFolgen seed={beatId} onDone={onGame} />
    case 'merken':
      return <Merken seed={beatId} onDone={onGame} />
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
