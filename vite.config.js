import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/app/',
  build: {
    outDir: 'dist/app',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:  ['react', 'react-dom'],
          charts:  ['recharts'],
          pdf:     ['@react-pdf/renderer'],
          idb:     ['idb'],
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'FinanceOS Pro',
        short_name: 'FinanceOS',
        description: 'App de finanzas personales privada para LATAM',
        theme_color: '#1a6b4a',
        background_color: '#f4f3ef',
        display: 'standalone',
        start_url: '/app/',
        scope: '/app/',
        icons: [
          { src: '/app/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/app/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/app/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
        ]
      },
      workbox: {
        navigateFallback: '/app/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/(?!app)/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^\/app\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'app-cache', expiration: { maxEntries: 50 } }
          }
        ]
      }
    })
  ]
})
