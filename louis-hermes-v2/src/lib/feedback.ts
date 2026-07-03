// Richtig/Falsch-Rückmeldung: ein warmes Bild von Hermès + eine kurze Stimme.
// „richtig" = Daumen hoch (Lob), „falsch" = freundliches Schulterzucken (nochmal).
// Bewusst ermutigend, nie bestrafend.
//
// Ruhe zwischen den Phasen (aus dem Test):
// - kommt NICHT abrupt: kurze Pause + langsames Einblenden.
// - bleibt genau so lange wie die Stimme (fester Wert -> immer gleich).
// - ist NICHT wegklickbar.
// - „überbrückt" den Wechsel: die Ebene deckt noch, WÄHREND der nächste Beat
//   dahinter schon einblendet — so blitzt nie kurz das alte Training auf.

import { playSample, preloadSamples } from './audio'

type Kind = 'richtig' | 'falsch'

const imgSrc = (k: Kind) => `${import.meta.env.BASE_URL}assets/feedback/${k}.png`
const audioSrc = (k: Kind) => `${import.meta.env.BASE_URL}assets/feedback/${k}.mp3`

const PRE_MS = 320 // kurze Ruhe, bevor das Lob/‌„nochmal" erscheint
const MIN_MS = 1700 // Mindestdauer, damit nichts nur „aufblitzt"
const HOLD_MS = 450 // ruhig stehen lassen
const BRIDGE_MS = 550 // Ebene deckt noch, während der nächste Beat einblendet

const delay = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))
const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

// Bilder + Stimmen vorladen, damit die Rückmeldung ohne Ruckeln erscheint.
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

  // kurze Ruhe, dann langsam einblenden
  await delay(PRE_MS)
  await raf()
  overlay.classList.add('show')

  // so lange wie die Stimme (mind. MIN_MS), dann ruhig halten
  await Promise.all([playSample(audioSrc(kind)), delay(MIN_MS)])
  await delay(HOLD_MS)

  // Ebene bleibt zunächst DECKEND und wird erst nach einer Brücke ausgeblendet.
  // Wir lösen jetzt auf -> der Aufrufer wechselt zum nächsten Beat, der HINTER
  // dem noch deckenden Overlay langsam einblendet. Danach fadet das Overlay weg.
  window.setTimeout(() => {
    overlay.classList.remove('show')
    window.setTimeout(() => overlay.remove(), 750)
  }, BRIDGE_MS)
}
