// src/utils/tasaAR.js
// Cotizaciones del dólar en vivo — Argentina. Fuente: dolarapi.com (oficial,
// blue, MEP/bolsa, CCL, mayorista, cripto, tarjeta). CORS abierto, sin auth.
// Cache localStorage 3h — el blue se mueve rápido durante el día.
// Mismo patrón que indicadores.js (Chile) y tasaVE.js (Venezuela).

const LS_KEY = 'fnos_tasa_ar_v1'
const TTL_MS = 3 * 60 * 60 * 1000
const URL = 'https://dolarapi.com/v1/dolares'

export const FALLBACK = {
  oficial: 1510,
  blue: 1545,
  mep: 1521.6,
  ccl: 1573.8,
  mayorista: 1487.5,
  cripto: 1575.22,
  tarjeta: 1963,
}

const CASA_MAP = { oficial: 'oficial', blue: 'blue', mep: 'bolsa', ccl: 'contadoconliqui', mayorista: 'mayorista', cripto: 'cripto', tarjeta: 'tarjeta' }

function getCached() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.ts > TTL_MS) return null
    return data
  } catch { return null }
}

export async function loadTasaAR() {
  const cached = getCached()
  if (cached) return cached

  try {
    const res = await fetch(URL)
    const data = await res.json()
    const byCasa = {}
    for (const [key, casa] of Object.entries(CASA_MAP)) {
      const found = data.find(d => d.casa === casa)
      byCasa[key] = found?.venta ?? null
    }
    if (!byCasa.oficial) throw new Error('sin datos')
    const result = { ...byCasa, ts: Date.now(), source: 'api' }
    localStorage.setItem(LS_KEY, JSON.stringify(result))
    return result
  } catch {
    return { ...FALLBACK, ts: Date.now(), source: 'fallback' }
  }
}
