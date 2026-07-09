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
        // Inyecta los listeners de push/notificationclick al SW autogenerado,
        // sin tocar la lógica de caché/offline (ver public/push-sw.js).
        importScripts: ['push-sw.js'],
        navigateFallback: '/app/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/(?!app)/],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Fuentes de Google Fonts — cache-first, 1 año
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fos-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Chunks JS/CSS lazy de la propia app — stale-while-revalidate
            urlPattern: /\/app\/assets\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'fos-assets',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      }
    })
  ]
})
