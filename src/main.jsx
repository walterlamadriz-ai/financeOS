// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Mitigación de prototype pollution (GHSA-4r6h-8v6p-xvw6, CVSS 7.8) en xlsx@0.18.5,
// alcanzable desde "Importar extracto bancario" (fileParser.js). SheetJS no publicó
// el fix (>=0.20.3) al registro público de npm, así que no hay upgrade posible sin
// salir del registro — mientras eso no se resuelva, congelar Object.prototype corta
// la mayoría de las cadenas de explotación de esta clase de vulnerabilidad. Ninguna
// dependencia de este proyecto (React, idb, pdfjs-dist, recharts) escribe
// propiedades nuevas en Object.prototype, así que esto no debería romper nada.
Object.freeze(Object.prototype)

// ── Recuperación automática de pantalla en blanco tras un deploy ────────────
// Si un chunk lazy falla al cargar (la versión desplegada cambió y el archivo
// con hash viejo ya no existe), recargamos la página UNA vez para tomar la
// versión nueva — sin esto el usuario ve una pantalla vacía hasta refrescar.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  try {
    const KEY = 'fnos_chunk_reload_at'
    const last = Number(sessionStorage.getItem(KEY) || 0)
    if (Date.now() - last < 15000) return // evita bucles de recarga
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {}
  window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)

// Register service worker for PWA (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/app/sw.js')
      .then(reg => {
        // Buscar versión nueva al volver a la app (pestaña visible de nuevo)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {})
        })
      })
      .catch(console.error)
  })
}
