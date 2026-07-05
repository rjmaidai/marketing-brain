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
  const [mastered, setMastered] = useState<string[]>(() => loadProgress().mastered)
  // Lautkarten pro Durchlauf neu gemischt (DIEB bleibt fix, siehe story.ts).
  const [lautMap, setLautMap] = useState<Record<number, string>>(() => makeLautAssignment())

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

  // Hard Cut: Beat sofort laden und abspielen — KEINE Blende zwischen Beats.
  // Das Video-Element ist durchgehend und beim Start (Fingergeste) freigeschaltet.
  function playBeat(i: number) {
    const v = videoRef.current
    if (!v) return
    setEnded(false)
    if (v.getAttribute('src') !== beatSrc(BEATS[i].file)) {
      v.src = beatSrc(BEATS[i].file)
    }
    v.muted = false
    try {
      v.currentTime = 0
    } catch {
      /* egal */
    }
    const p = v.play()
    if (p && typeof p.catch === 'function') p.catch(() => setEnded(true))
  }

  function replayBeat() {
    const v = videoRef.current
    if (!v) return
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
    // Freischaltung + Start in der Fingergeste.
    playBeat(startIdx)
  }

  function goToBeat(i: number) {
    // Hard Cut: Training/alter Beat sofort weg, neuer Beat startet direkt.
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
        <div className="media-frame">
          <video
            ref={videoRef}
            playsInline
            preload="auto"
            onEnded={() => {
              // Beats sind aneinandergereiht: am Ende eines Beats geht es
              // AUTOMATISCH weiter (zum Spiel oder direkt zum nächsten Beat).
              // Nur ganz am Schluss wartet ein „von vorn".
              if (isLast) setEnded(true)
              else afterBeat()
            }}
          />
          {screen === 'beat' && ended && (
            // Erscheint nur am Ende der Geschichte — oder falls ein Beat mal nicht
            // von selbst startet (dann tippt man ihn an).
            <button
              className="advance-overlay"
              aria-label={isLast ? 'Von vorne beginnen' : 'Abspielen'}
              onClick={() => (isLast ? restart() : replayBeat())}
            >
              <span className="advance-dot" />
              <span className="advance-label">{isLast ? 'Nochmal von vorn' : 'Abspielen'}</span>
            </button>
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
      return <SpurenFolgen seed={beatId} target={training.target ?? 'muetze'} onDone={onGame} />
    case 'merken':
      return <Merken seed={beatId} nextBeatSrc={nextBeatSrc} onDone={onGame} />
    case 'puzzle':
      return <BildPuzzle seed={beatId} variant={training.variant ?? 'marke'} onDone={onGame} />
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
