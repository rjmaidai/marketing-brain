import { useState } from 'react'
import { ensureMic } from '../lib/mic'
import { resumeAudio, preloadSamples } from '../lib/audio'
import { preloadFeedback } from '../lib/feedback'
import { SPIELSATZ, spielsatzSrc, VOICE, voiceSrc } from '../data/story'

// Ruhiger Start. Hier wird (einmal) die Mikrofon-Erlaubnis geholt — mit einem
// Wort für die Bezugsperson, warum. Danach beginnt die Geschichte.

interface Props {
  hasProgress: boolean
  onStart: (resume: boolean) => void
}

export function StartScreen({ hasProgress, onStart }: Props) {
  const [preparing, setPreparing] = useState(false)

  function begin(resume: boolean) {
    setPreparing(true)
    // Mikrofon-Erlaubnis anfragen (Fingergeste vorhanden) — aber NICHT warten:
    // die Geschichte muss noch in derselben Geste starten, sonst blockiert iPad
    // den Auto-Start mit Ton. Wird das Mikrofon abgelehnt, tippt die
    // Bezugsperson beim Laut einfach weiter.
    void ensureMic()
    resumeAudio() // Audio-Kanal in der Geste freischalten (Stimmen, Töne)
    preloadSamples([
      ...Object.values(SPIELSATZ).map(spielsatzSrc),
      ...Object.values(VOICE).map(voiceSrc),
    ]) // Ansagen + Stimmen vorladen
    preloadFeedback() // Richtig/Falsch-Bilder + Stimmen vorladen
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

        {/* Sichtbarer Build-Stempel: zeigt sofort, ob die neueste Version geladen ist. */}
        <p className="subtle" style={{ fontSize: 11, opacity: 0.4, marginTop: 18 }}>
          Build 22 · Hau-den-Lukas kompakt (58vh) · Kachelspiel mit weichem Hintergrund (Musik-Fix folgt nach Abnahme)
        </p>
      </div>
    </div>
  )
}
