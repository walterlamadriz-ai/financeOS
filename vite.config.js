import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/app/',
  build: { outDir: 'dist/app' },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'FinanceOS', short_name: 'FinanceOS',
        theme_color: '#1a6b4a', background_color: '#f4f3ef',
        display: 'standalone', start_url: '/app/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        navigateFallback: '/app/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/(?!app)/]
      }
    })
  ]
})
