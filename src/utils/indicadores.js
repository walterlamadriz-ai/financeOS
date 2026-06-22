// src/utils/indicadores.js
// Indicadores economicos Chile — fuente: mindicador.cl (datos SII/BCCh)
// Cache localStorage 24h · Fallback a constantes si offline o API falla
// NO constituye asesoría financiera ni tributaria

const LS_KEY = 'fnos_indicadores_v1'
const TTL_MS = 24 * 60 * 60 * 1000
const BASE    = 'https://mindicador.cl/api'

export const FALLBACK = {
  utm:   69542,  // UTM diciembre 2025
  uf:    39724,  // UF diciembre 2025
  dolar: 975,    // USD/CLP referencial
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

async function fetchVal(code) {
  const res  = await fetch(`${BASE}/${code}`)
  const data = await res.json()
  return data.serie?.[0]?.valor ?? null
}

export async function loadIndicadores() {
  const cached = getCached()
  if (cached) return cached

  try {
    const [utm, uf, dolar] = await Promise.all([
      fetchVal('utm'),
      fetchVal('uf'),
      fetchVal('dolar'),
    ])
    if (!utm || !uf) throw new Error('sin datos')
    const result = {
      utm, uf,
      dolar: dolar || FALLBACK.dolar,
      ts:     Date.now(),
      source: 'api',
    }
    localStorage.setItem(LS_KEY, JSON.stringify(result))
    return result
  } catch {
    return { ...FALLBACK, ts: Date.now(), source: 'fallback' }
  }
}
