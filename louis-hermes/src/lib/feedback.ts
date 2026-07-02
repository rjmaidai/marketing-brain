// Richtig/Falsch-Rückmeldung: ein warmes Bild von Hermès + eine kurze Stimme.
// „richtig" = Daumen hoch (Lob), „falsch" = freundliches Schulterzucken (nochmal).
// Bewusst ermutigend, nie bestrafend.
//
// Imperativ als kurze Ebene über allem — so kann jedes Spiel es mit einer Zeile
// auslösen, ohne eigenen State. Löst sich auf, wenn die Stimme fertig ist.

type Kind = 'richtig' | 'falsch'

const imgSrc = (k: Kind) => `${import.meta.env.BASE_URL}assets/feedback/${k}.png`
const audioSrc = (k: Kind) => `${import.meta.env.BASE_URL}assets/feedback/${k}.mp3`

// Bilder vorladen, damit die Rückmeldung ohne Ruckeln erscheint.
let preloaded = false
export function preloadFeedback() {
  if (preloaded) return
  preloaded = true
  ;(['richtig', 'falsch'] as Kind[]).forEach((k) => {
    const im = new Image()
    im.src = imgSrc(k)
  })
}

export function showFeedback(kind: Kind): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'feedback-overlay'
    const img = document.createElement('img')
    img.className = 'feedback-img'
    img.src = imgSrc(kind)
    img.alt = ''
    overlay.appendChild(img)
    document.body.appendChild(overlay)
    // eine Bildaufbau-Runde warten, dann sanft einblenden
    requestAnimationFrame(() => overlay.classList.add('show'))

    const audio = new Audio(audioSrc(kind))
    let done = false
    const finish = () => {
      if (done) return
      done = true
      overlay.classList.remove('show')
      window.setTimeout(() => overlay.remove(), 450)
      resolve()
    }
    audio.onended = finish
    audio.onerror = finish
    audio.play().catch(finish)
    // Sicherheitsnetz, falls die Stimme mal nicht lädt.
    window.setTimeout(finish, 4500)
  })
}
