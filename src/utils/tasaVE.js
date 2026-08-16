// src/utils/tasaVE.js
// Tasa Bs/USD en vivo — Venezuela. Fuente: ve.dolarapi.com (BCV oficial + paralelo)
// Cache localStorage 6h · Fallback a constante si offline o API falla.
// Mismo patrón que src/utils/indicadores.js (Chile).
//
// ⚠ Esta constante es la ÚNICA fuente de verdad de la tasa por defecto en toda
// la app. src/config/multimoneda/ve.js la importa de acá — no declarar otra
// constante de tasa en ningún otro archivo (ya pasó: el config quedó en 709.69
// mientras esto decía 771.07, un 8.6% de diferencia dentro del mismo repo).
//
// Última verificación: 16-ago-2026 (BCV oficial 771.07 · paralelo ~865.62).
export const FALLBACK = {
  oficial: 771.07,   // BCV referencial 16-ago-2026
  paralelo: 865.62,  // referencial 16-ago-2026
}

const LS_KEY = 'fnos_tasa_ve_v1'
const TTL_MS = 6 * 60 * 60 * 1000 // 6h — el paralelo se mueve rápido
const URL = 'https://ve.dolarapi.com/v1/dolares'

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
      // Sin fallback silencioso a `oficial`: colapsar el paralelo sobre el
      // oficial haría ver una brecha de 0% que no existe. Si la API no lo trae,
      // se marca como no disponible y la UI lo dice en vez de inventarlo.
      paralelo: paralelo || null,
      paraleloDisponible: Boolean(paralelo),
      ts: Date.now(),
      source: 'api',
    }
    localStorage.setItem(LS_KEY, JSON.stringify(result))
    return result
  } catch {
    return { ...FALLBACK, paraleloDisponible: true, ts: Date.now(), source: 'fallback' }
  }
}
