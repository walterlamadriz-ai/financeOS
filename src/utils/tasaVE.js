// src/utils/tasaVE.js
// Tasa Bs/USD en vivo — Venezuela. Fuente: ve.dolarapi.com (BCV oficial + paralelo)
// Cache localStorage 6h · Fallback a constante si offline o API falla.
// Mismo patrón que src/utils/indicadores.js (Chile).

const LS_KEY = 'fnos_tasa_ve_v1'
const TTL_MS = 6 * 60 * 60 * 1000 // 6h — el paralelo se mueve rápido
const URL = 'https://ve.dolarapi.com/v1/dolares'

export const FALLBACK = {
  oficial: 771.07,   // BCV referencial jul-2026
  paralelo: 869.35,  // referencial jul-2026
}

function getCached() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.ts > TTL_MS) return null
    return data
  } catch { return null }
}

export async function loadTasaVE() {
  const cached = getCached()
  if (cached) return cached

  try {
    const res = await fetch(URL)
    const data = await res.json()
    const oficial = data.find(d => d.fuente === 'oficial')?.promedio
    const paralelo = data.find(d => d.fuente === 'paralelo')?.promedio
    if (!oficial) throw new Error('sin datos')
    const result = {
      oficial,
      paralelo: paralelo || oficial,
      ts: Date.now(),
      source: 'api',
    }
    localStorage.setItem(LS_KEY, JSON.stringify(result))
    return result
  } catch {
    return { ...FALLBACK, ts: Date.now(), source: 'fallback' }
  }
}
