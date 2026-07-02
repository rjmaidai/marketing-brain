import { useState } from 'react'
import { ensureMic } from '../lib/mic'

// Ruhiger Start. Hier wird (einmal) die Mikrofon-Erlaubnis geholt — mit einem
// Wort für die Bezugsperson, warum. Danach beginnt die Geschichte.

interface Props {
  hasProgress: boolean
  onStart: (resume: boolean) => void
}

export function StartScreen({ hasProgress, onStart }: Props) {
  const [preparing, setPreparing] = useState(false)

  async function begin(resume: boolean) {
    setPreparing(true)
    // Mikrofon jetzt anfragen (Nutzer-Geste vorhanden). Wird es abgelehnt,
    // läuft die App trotzdem — dann tippt die Bezugsperson beim Laut weiter.
    await ensureMic()
    onStart(resume)
  }

  return (
    <div className="stage">
      <div className="center-col fade-in">
        <h1 className="title-xl">Louis &amp; Hermès</h1>
        <p className="subtle">
          Ein Bilderbuch, das mitspielt. Ihr habt alle Zeit der Welt — nichts läuft
          von selbst weiter. Louis gibt den Takt.
        </p>

        {hasProgress ? (
          <>
            <button className="btn" disabled={preparing} onClick={() => begin(true)}>
              Weitermachen
            </button>
            <button className="btn ghost" disabled={preparing} onClick={() => begin(false)}>
              Von vorn beginnen
            </button>
          </>
        ) : (
          <button className="btn" disabled={preparing} onClick={() => begin(false)}>
            {preparing ? 'Einen Moment …' : 'Los geht’s'}
          </button>
        )}

        <p className="subtle" style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>
          Für die Laut-Übung fragt der Browser nach dem Mikrofon. Es wird nichts
          aufgenommen oder gespeichert — die App hört nur kurz zu, ob dein Kind spricht.
        </p>
      </div>
    </div>
  )
}
