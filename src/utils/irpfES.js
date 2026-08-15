// src/utils/irpfES.js
// Simulador IRPF — España. Escala general de referencia (combinada
// estatal+autonómica genérica — varía por Comunidad Autónoma, esto es
// orientativo tipo Madrid; consultar la escala de tu región para precisión).
// Fuente: TaxDown/guiafiscal.es, tramos 2026. NO constituye asesoría fiscal.

export const TRAMOS_IRPF_2026 = [
  { hasta: 12450, tasa: 0.19 },
  { hasta: 20200, tasa: 0.24 },
  { hasta: 35200, tasa: 0.30 },
  { hasta: 60000, tasa: 0.37 },
  { hasta: 300000, tasa: 0.45 },
  { hasta: Infinity, tasa: 0.47 },
]

export const MINIMO_CONTRIBUYENTE = 5550 // <65 años
export const REDUCCION_TRABAJO = 2000 // general, todo perceptor de rendimientos del trabajo
export const MINIMOS_HIJOS = { 1: 2400, 2: 2700, 3: 4000, 4: 4500 } // 4º y siguientes = 4.500 c/u

function cuotaProgresiva(baseLiquidable) {
  const base = Math.max(0, Number(baseLiquidable) || 0)
  let cuota = 0
  let anterior = 0
  for (const t of TRAMOS_IRPF_2026) {
    if (base <= anterior) break
    const tramoBase = Math.min(base, t.hasta) - anterior
    cuota += tramoBase * t.tasa
    anterior = t.hasta
  }
  return cuota
}

function minimoPorHijos(numHijos) {
  const n = Math.max(0, Number(numHijos) || 0)
  let total = 0
  for (let i = 1; i <= n; i++) {
    total += MINIMOS_HIJOS[Math.min(i, 4)]
  }
  return total
}

// Empleado: retención mensual estimada = tipo efectivo × bruto mensual.
// Simplificación deliberada — Hacienda regulariza con el Reglamento IRPF
// (art. 80-89), pero para una estimación educativa esto es razonable.
export function calcIRPFEmpleado({ brutoAnual, numHijos = 0 }) {
  const bruto = Number(brutoAnual) || 0
  if (bruto <= 0) return null

  const minimoHijos = minimoPorHijos(numHijos)
  const baseLiquidable = Math.max(0, bruto - REDUCCION_TRABAJO - MINIMO_CONTRIBUYENTE - minimoHijos)
  const cuota = cuotaProgresiva(baseLiquidable)
  const tipoEfectivo = bruto > 0 ? cuota / bruto : 0
  const retencionMensual = (bruto / 12) * tipoEfectivo
  const netoMensual = (bruto / 12) - retencionMensual

  return {
    cuotaAnual: Math.round(cuota),
    tipoEfectivo,
    retencionMensual: Math.round(retencionMensual),
    netoMensual: Math.round(netoMensual),
    baseLiquidable: Math.round(baseLiquidable),
  }
}

// Autónomo: Modelo 130, pago fraccionado trimestral = 20% del rendimiento
// neto acumulado (ingresos − gastos − 5% gastos de difícil justificación,
// tope €2.000/año en estimación directa simplificada). 15% reducido los
// primeros 2 años de actividad.
export function calcIRPFAutonomo({ ingresosTrimestre, gastosTrimestre, primerosDosAnios = false }) {
  const ingresos = Number(ingresosTrimestre) || 0
  const gastos = Number(gastosTrimestre) || 0
  const rendimientoNeto = Math.max(0, ingresos - gastos)
  const gastosDificilJust = Math.min(rendimientoNeto * 0.05, 2000 / 4) // tope anual /4 trimestres
  const baseAjustada = Math.max(0, rendimientoNeto - gastosDificilJust)
  const tasa = primerosDosAnios ? 0.15 : 0.20
  const pagoFraccionado = baseAjustada * tasa

  return {
    rendimientoNeto: Math.round(rendimientoNeto),
    gastosDificilJust: Math.round(gastosDificilJust),
    pagoFraccionado: Math.round(pagoFraccionado),
    tasa,
  }
}
