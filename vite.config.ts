import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Wehentimer',
        short_name: 'Wehentimer',
        description: 'Wehen erfassen und nach der 5-1-1-Regel auswerten.',
        theme_color: '#728a6b',
        background_color: '#fbf8f1',
        display: 'standalone',
        lang: 'de',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // Bewusst abweichend vom Standard-Port 5173: otherApp nutzt lokal 5173/8090,
  // damit läuft dieses Projekt parallel auf demselben Dev-Rechner ohne Konflikt.
  server: {
    port: 5174,
  },
  preview: {
    port: 5174,
  },
})
