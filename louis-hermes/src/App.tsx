import { useEffect, useState } from 'react'
import { BEATS, beatSrc } from './data/story'
import { loadProgress, saveProgress, resetProgress } from './lib/progress'
import { BeatPlayer } from './components/BeatPlayer'
import { LautUebung } from './components/LautUebung'
import { SpurenFolgen } from './components/SpurenFolgen'
import { Merken } from './components/Merken'
import { BildPuzzle } from './components/BildPuzzle'
import { StartScreen } from './components/StartScreen'

type Screen = 'start' | 'beat' | 'training'

export default function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [index, setIndex] = useState(0) // Index in BEATS
  const [mastered, setMastered] = useState<string[]>(() => loadProgress().mastered)

  const beat = BEATS[index]
  const isLast = index === BEATS.length - 1

  // Fortschritt merken (wie weit + welche Laute erkannt).
  useEffect(() => {
    if (screen === 'start') return
    const prev = loadProgress()
    saveProgress({ furthest: Math.max(prev.furthest, index), mastered })
  }, [index, screen, mastered])

  function start(resume: boolean) {
    if (resume) {
      const p = loadProgress()
      setIndex(Math.min(p.furthest, BEATS.length - 1))
    } else {
      resetProgress()
      setMastered([])
      setIndex(0)
    }
    setScreen('beat')
  }

  function afterBeat() {
    if (beat.training) setScreen('training')
    else goNextBeat()
  }

  function goNextBeat() {
    if (index < BEATS.length - 1) {
      setIndex(index + 1)
      setScreen('beat')
    }
  }

  function restart() {
    resetProgress()
    setMastered([])
    setIndex(0)
    setScreen('start')
  }

  function afterLaut(didMaster: boolean) {
    if (didMaster && beat.training?.laut) {
      const l = beat.training.laut
      setMastered((m) => (m.includes(l) ? m : [...m, l]))
    }
    goNextBeat()
  }

  if (screen === 'start') {
    return <StartScreen hasProgress={loadProgress().furthest > 0} onStart={start} />
  }

  return (
    <>
      <ProgressThread index={index} total={BEATS.length} />

      {screen === 'beat' && (
        <BeatPlayer
          key={beat.id}
          src={beatSrc(beat.file)}
          onDone={afterBeat}
          isLast={isLast}
          onRestart={restart}
        />
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
