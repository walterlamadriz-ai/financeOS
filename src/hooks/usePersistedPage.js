// Persiste la página activa en localStorage para restaurar al reabrir la app.
// Ignora páginas legales y settings (no tiene sentido restaurarlas).
import { useState } from 'react'

const STORAGE_KEY = 'fos_active_page'
const SKIP_PERSIST = new Set(['privacy', 'terms', 'license', 'disclaimer'])

export function usePersistedPage(initial = 'dashboard') {
  const [page, setPageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved && !SKIP_PERSIST.has(saved) ? saved : initial
    } catch {
      return initial
    }
  })

  function setPage(next) {
    setPageState(next)
    if (!SKIP_PERSIST.has(next)) {
      try { localStorage.setItem(STORAGE_KEY, next) } catch {}
    }
  }

  return [page, setPage]
}
