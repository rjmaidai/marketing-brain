// Richtig/Falsch-Rückmeldung: ein warmes Bild von Hermès + eine kurze Stimme.
// „richtig" = Daumen hoch (Lob), „falsch" = freundliches Schulterzucken (nochmal).
// Bewusst ermutigend, nie bestrafend.
//
// WICHTIG (aus dem Test): immer GLEICH — die Ebene bleibt genau so lange wie die
// Stimme, spielt die Stimme zuverlässig über den freigeschalteten Audio-Kanal,
// und ist NICHT wegklickbar (deckt alles, hat keinen Schliessen-Tipp).

import { playSample, preloadSamples } from './audio'

type Kind = 'richtig' | 'falsch'

const imgSrc = (k: Kind) => `${import.meta.env.BASE_URL}assets/feedback/${k}.png`
const audioSrc = (k: Kind) => `${import.meta.env.BASE_URL}assets/feedback/${k}.mp3`

// Mindest-Anzeigedauer, damit eine kurze Stimme nicht nur „aufblitzt".
const MIN_MS = 1600

const delay = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

// Bilder + Stimmen vorladen, damit die Rückmeldung ohne Ruckeln/Lücke erscheint.
let preloaded = false
export function preloadFeedback() {
  if (preloaded) return
  preloaded = true
  ;(['richtig', 'falsch'] as Kind[]).forEach((k) => {
    const im = new Image()
    im.src = imgSrc(k)
  })
  preloadSamples((['richtig', 'falsch'] as Kind[]).map(audioSrc))
}

export async function showFeedback(kind: Kind): Promise<void> {
  const overlay = document.createElement('div')
  overlay.className = 'feedback-overlay'
  const img = document.createElement('img')
  img.className = 'feedback-img'
  img.src = imgSrc(kind)
  img.alt = ''
  overlay.appendChild(img)
  document.body.appendChild(overlay)
  // eine Bildaufbau-Runde warten, dann sanft einblenden
  await new Promise<void>((r) => requestAnimationFrame(() => r()))
  overlay.classList.add('show')

  // Ebene bleibt exakt so lange wie die Stimme (fester Asset -> immer gleich),
  // mindestens aber MIN_MS. Zuverlässig über den Web-Audio-Kanal.
  await Promise.all([playSample(audioSrc(kind)), delay(MIN_MS)])
  await delay(250)

  overlay.classList.remove('show')
  await delay(450)
  overlay.remove()
}
