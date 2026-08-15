// src/utils/resicoMX.js
// RESICO — Régimen Simplificado de Confianza (México), personas físicas.
// Fuente: Art. 113-E LISR, tasas 2026 (idénticas a 2025). NO constituye
// asesoría fiscal — el ISR real depende de tu situación completa ante el SAT.
//
// Trampa que la mayoría no entiende: la tasa NO es progresiva/marginal como el
// ISR normal. Se aplica sobre el 100% del ingreso mensual cobrado, según en
// qué tramo caiga el total. Cruzar un tramo por $1 sube la tasa de TODO el
// ingreso — un "efecto cliff" real que vale la pena advertir.

export const TRAMOS_RESICO = [
  { hasta: 25000,     tasa: 0.0100 },
  { hasta: 50000,     tasa: 0.0110 },
  { hasta: 83333.33,  tasa: 0.0150 },
  { hasta: 208333.33, tasa: 0.0200 },
  { hasta: 3500000,   tasa: 0.0250 }, // tope RESICO: ingresos anuales ≤ $3.5M
]

export const TOPE_ANUAL_RESICO = 3500000 // MXN — arriba de esto, sales del régimen

export function calcResico(ingresoMensual) {
  const ingreso = Number(ingresoMensual) || 0
  if (ingreso <= 0) return null

  const tramo = TRAMOS_RESICO.find(t => ingreso <= t.hasta) || TRAMOS_RESICO[TRAMOS_RESICO.length - 1]
  const tramoIdx = TRAMOS_RESICO.indexOf(tramo)
  const isr = ingreso * tramo.tasa
  const neto = ingreso - isr

  // Distancia al siguiente tramo (para advertir del efecto cliff)
  const siguienteTramo = TRAMOS_RESICO[tramoIdx + 1]
  const faltaParaSiguiente = siguienteTramo ? siguienteTramo.hasta > ingreso ? tramo.hasta - ingreso : 0 : 0
  // más útil: cuánto le falta para TOCAR el límite superior de su tramo actual
  const margenEnTramo = tramo.hasta - ingreso

  return {
    ingreso,
    tasa: tramo.tasa,
    isr: Math.round(isr),
    neto: Math.round(neto),
    tramoIdx,
    margenEnTramo: Math.max(0, Math.round(margenEnTramo)),
    siguienteTasa: siguienteTramo?.tasa ?? null,
    ingresoAnualProyectado: Math.round(ingreso * 12),
    superaTope: ingreso * 12 > TOPE_ANUAL_RESICO,
  }
}
