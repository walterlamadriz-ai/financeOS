// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

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
