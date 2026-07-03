import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Louis & Hermès — ruhige Single-Page-App, laeuft rein im Browser.
// Kein Backend, kein API-Key. Assets liegen statisch unter /assets.
export default defineConfig({
  plugins: [react()],
  build: {
    // Grosse Video-Assets werden nicht inline gebundlet, sondern als Dateien serviert.
    assetsInlineLimit: 0,
  },
  css: {
    // Leere PostCSS-Config, damit Vite nicht im Eltern-Ordner (marketing-brain) sucht.
    postcss: {},
  },
})
