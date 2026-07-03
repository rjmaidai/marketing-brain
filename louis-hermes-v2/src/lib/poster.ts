// Holt ein Standbild aus einem Beat-Video — zur Laufzeit im Browser.
// Die Beats sind praktisch stehende Bilder, also genügt EIN Frame.
// Wird fürs Bild-Puzzle gebraucht: das Kind setzt das NÄCHSTE Bild der
// Geschichte zusammen und will dann sehen, wie es lebendig wird.
//
// Läuft auf iPad-Safari und Desktop-Browsern (H.264 wird dort unterstützt).
// Scheitert die Aufnahme, gibt die Funktion null zurück und das Puzzle fällt
// ruhig auf eine einfache Variante zurück.

export async function capturePoster(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    v.crossOrigin = 'anonymous'
    // Manche Browser dekodieren nur, wenn das Element im DOM hängt.
    v.style.cssText = 'position:fixed;width:2px;height:2px;opacity:0;pointer-events:none;left:-10px;top:-10px'
    v.src = src

    let done = false
    const finish = (result: string | null) => {
      if (done) return
      done = true
      v.removeAttribute('src')
      v.load()
      v.remove()
      resolve(result)
    }

    const grab = () => {
      try {
        if (!v.videoWidth) return finish(null)
        const w = 720
        const h = Math.round((v.videoHeight / v.videoWidth) * w)
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        if (!ctx) return finish(null)
        ctx.drawImage(v, 0, 0, w, h)
        finish(c.toDataURL('image/jpeg', 0.85))
      } catch {
        finish(null)
      }
    }

    v.onseeked = grab
    v.onloadeddata = async () => {
      // iOS: kurz anspielen erzwingt einen dekodierten Frame, dann still stehen.
      try {
        await v.play()
        v.pause()
      } catch {
        /* egal — wir versuchen trotzdem zu greifen */
      }
      try {
        v.currentTime = Math.min(0.4, (v.duration || 1) / 2)
      } catch {
        grab()
      }
    }
    v.onerror = () => finish(null)

    document.body.appendChild(v)
    // Sicherheitsnetz: nach 6 s aufgeben.
    window.setTimeout(() => finish(null), 6000)
  })
}
