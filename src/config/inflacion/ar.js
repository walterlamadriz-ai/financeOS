// src/config/inflacion/ar.js
// Argentina — Ajuste por inflación (poder adquisitivo). Fuente: INDEC (IPC nacional).
// Serie de variación mensual %. Datos hasta may-2026 (verificados INDEC 2026-07-11).
// MANTENIMIENTO: agregar 1 dato por mes a SERIE a medida que INDEC publica (los
// datos pasados no cambian → solo se hace append).

// Variación mensual del IPC nacional, en % (INDEC). 2024 total 117,8% · 2025 total 31,5%.
const SERIE = [
  ['2024-01', 20.6], ['2024-02', 13.2], ['2024-03', 11.0], ['2024-04', 8.8],
  ['2024-05', 4.2],  ['2024-06', 4.6],  ['2024-07', 4.0],  ['2024-08', 4.2],
  ['2024-09', 3.5],  ['2024-10', 2.7],  ['2024-11', 2.4],  ['2024-12', 2.7],
  ['2025-01', 2.2],  ['2025-02', 2.4],  ['2025-03', 3.7],  ['2025-04', 2.8],
  ['2025-05', 1.5],  ['2025-06', 1.6],  ['2025-07', 1.9],  ['2025-08', 1.9],
  ['2025-09', 2.1],  ['2025-10', 2.3],  ['2025-11', 2.4],  ['2025-12', 2.8],
  ['2026-01', 2.9],  ['2026-02', 2.9],  ['2026-03', 3.4],  ['2026-04', 2.6],
  ['2026-05', 2.1],  // jun-2026 se publica ~13-jul (INDEC)
]

// Índices acumulados con base 100 antes del primer mes de la serie.
// END[ym]   = nivel de precios AL CIERRE del mes ym
// START[ym] = nivel de precios AL INICIO del mes ym (= cierre del mes anterior)
const MESES = SERIE.map(([ym]) => ym)
const ULTIMO = MESES[MESES.length - 1]
const PRIMERO = MESES[0]
const END = {}
const START = {}
;(() => {
  let idx = 100
  for (const [ym, rate] of SERIE) {
    START[ym] = idx
    idx = idx * (1 + rate / 100)
    END[ym] = idx
  }
})()

function indiceFin(ym) {
  if (END[ym]) return END[ym]
  if (ym < PRIMERO) return 100
  return END[ULTIMO]
}
function indiceInicio(ym) {
  if (START[ym]) return START[ym]
  if (ym < PRIMERO) return 100
  return END[ULTIMO]
}

export default {
  pais: 'AR',
  nombre: 'Argentina',
  moneda: 'ARS',
  sym: '$',
  vigencia: 'may-2026',
  fuente: 'INDEC',
  titulo: 'Ajuste por inflación',
  subtitulo: 'Cuánto vale hoy el dinero de antes — y si tu sueldo le ganó a la inflación',
  disclaimer: 'Estimación educativa con datos del IPC nacional (INDEC). No es asesoría financiera. Serie hasta dic-2025; los meses nuevos se agregan cuando INDEC publica.',
  meses: MESES,
  primero: PRIMERO,
  ultimo: ULTIMO,

  calcular({ monto = 0, desde = PRIMERO, hasta = ULTIMO }) {
    const m = Number(monto) || 0
    const iDesde = indiceInicio(desde)  // inicio del mes "desde"
    const iHasta = indiceFin(hasta)     // cierre del mes "hasta"
    if (!iDesde || iDesde <= 0) return null
    const ratio = iHasta / iDesde
    const valorAjustado = m * ratio
    const inflacionAcumPct = (ratio - 1) * 100
    // Si guardaste ese dinero en efectivo, hoy compra lo que (m/ratio) compraba antes
    const poderHoy = m / ratio
    const poderPerdidoPct = (1 - 1 / ratio) * 100
    return {
      valorAjustado: Math.round(valorAjustado),
      inflacionAcumPct,
      poderHoy: Math.round(poderHoy),
      poderPerdidoPct,
      desde, hasta,
    }
  },
}
