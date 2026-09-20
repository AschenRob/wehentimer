import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// Generiert Favicon/App-Icons aus Icon.png (siehe README zum Neu-Generieren:
// `npm run generate-pwa-assets`).
export default defineConfig({
  preset,
  images: ['public/Icon.png'],
})
