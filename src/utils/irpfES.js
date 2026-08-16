// src/utils/irpfES.js
// Simulador IRPF — España. La escala de abajo es la AGREGADA DE REFERENCIA
// (estatal + autonómica de referencia): es la que aplica en las comunidades que
// no han aprobado tarifa propia. Varias sí la han modificado — Madrid, por
// ejemplo, la tiene deflactada y su marginal máximo real es del 45%, no del 47%.
// Consultá la escala de tu comunidad para precisión.
// Fuentes: LIRPF arts. 19, 20 y 63; Orden de cotización 2026 (PJC/297/2026).
// NO constituye asesoría fiscal.

export const TRAMOS_IRPF_2026 = [
  { hasta: 12450, tasa: 0.19 },
  { hasta: 20200, tasa: 0.24 },
  { hasta: 35200, tasa: 0.30 },
  { hasta: 60000, tasa: 0.37 },
  { hasta: 300000, tasa: 0.45 },
  { hasta: Infinity, tasa: 0.47 },
]

export const MINIMO_CONTRIBUYENTE = 5550 // <65 años
export const REDUCCION_TRABAJO = 2000 // art. 19.2.f) "otros gastos"
export const MINIMOS_HIJOS = { 1: 2400, 2: 2700, 3: 4000, 4: 4500 } // 4º y siguientes = 4.500 c/u

// ---------------------------------------------------------------------------
// Cotización obrera a la Seguridad Social (Régimen General, contrato indefinido).
// Es GASTO DEDUCIBLE del rendimiento del trabajo — art. 19.2.a) LIRPF.
// Tipos a cargo del trabajador según la Orden PJC/297/2026 (BOE 31-mar-2026):
//   contingencias comunes 4,70% · desempleo 1,55% (indefinido; temporal 1,60%)
//   formación profesional 0,10% · MEI 0,15% (MEI total 2026 = 0,90%)
// Total 6,50% — confirmado, NO el 6,35% de auditorías previas a la entrada del
// MEI (mecanismo nuevo desde 2023, sube cada año hasta 2029).
// ---------------------------------------------------------------------------
export const COTIZACION_TRABAJADOR = {
  contingenciasComunes: 0.0470,
  desempleo: 0.0155,
  formacionProfesional: 0.0010,
  mei: 0.0015,
}

export const TIPO_SS_TRABAJADOR = Object.values(COTIZACION_TRABAJADOR)
  .reduce((a, b) => a + b, 0) // 6,50%

// Tope: base máxima de cotización 2026 = 5.101,20 €/mes. Por encima de este
// salario la cuota obrera deja de crecer (se ignora la cuota de solidaridad,
// que grava el exceso a tipos muy bajos).
export const BASE_MAXIMA_COTIZACION_MENSUAL = 5101.20
export const BASE_MAXIMA_COTIZACION_ANUAL = BASE_MAXIMA_COTIZACION_MENSUAL * 12 // 61.214,40 €

export function cotizacionSSTrabajador(brutoAnual) {
  const bruto = Math.max(0, Number(brutoAnual) || 0)
  const baseCotizacion = Math.min(bruto, BASE_MAXIMA_COTIZACION_ANUAL)
  return baseCotizacion * TIPO_SS_TRABAJADOR
}

// ---------------------------------------------------------------------------
// Reducción por obtención de rendimientos del trabajo — art. 20 LIRPF.
// OJO con la definición de "rendimiento neto" a estos efectos: es el íntegro
// menos los gastos de las letras a)-e) del art. 19.2 (básicamente la cuota de
// Seguridad Social), SIN restar los 2.000€ de "otros gastos" de la letra f).
// Dos tramos decrecientes, no uno:
//   RNT ≤ 14.852                 → 7.302
//   14.852 < RNT ≤ 17.673,52     → 7.302 − 1,75 × (RNT − 14.852)
//   17.673,52 < RNT < 19.747,50  → 2.364,34 − 1,14 × (RNT − 17.673,52)
//   RNT ≥ 19.747,50              → 0
// Se asume que el contribuyente no tiene otras rentas > 6.500€ (el simulador
// solo modela rendimientos del trabajo).
// ---------------------------------------------------------------------------
export const ART20 = {
  limite1: 14852,
  limite2: 17673.52,
  limite3: 19747.50,
  importeMaximo: 7302,
  importeTramo2: 2364.34,
  pendiente1: 1.75,
  pendiente2: 1.14,
}

export function reduccionArt20(rendimientoNetoPrevio) {
  const rnt = Math.max(0, Number(rendimientoNetoPrevio) || 0)
  if (rnt <= ART20.limite1) return ART20.importeMaximo
  if (rnt <= ART20.limite2) return ART20.importeMaximo - ART20.pendiente1 * (rnt - ART20.limite1)
  if (rnt < ART20.limite3) return ART20.importeTramo2 - ART20.pendiente2 * (rnt - ART20.limite2)
  return 0
}

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
//
// El mínimo personal y familiar NO reduce la base: se calcula la cuota íntegra
// sobre la base completa y se le resta la cuota que correspondería al mínimo
// aplicando la MISMA escala desde cero (art. 63.1.2º LIRPF). El efecto práctico
// es que el mínimo se valora al tipo del primer tramo (19%), no al marginal.
export function calcIRPFEmpleado({ brutoAnual, numHijos = 0 }) {
  const bruto = Number(brutoAnual) || 0
  if (bruto <= 0) return null

  const seguridadSocial = cotizacionSSTrabajador(bruto)

  // Rendimiento neto previo (art. 19.2 letras a-e) — base del cálculo del art. 20
  const rendimientoNetoPrevio = Math.max(0, bruto - seguridadSocial)
  const reduccionTrabajo = reduccionArt20(rendimientoNetoPrevio)

  // Rendimiento neto reducido = íntegro − SS − 2.000 (letra f) − reducción art. 20
  const baseLiquidable = Math.max(
    0,
    rendimientoNetoPrevio - REDUCCION_TRABAJO - reduccionTrabajo,
  )

  const minimoHijos = minimoPorHijos(numHijos)
  const minimoPersonalFamiliar = MINIMO_CONTRIBUYENTE + minimoHijos

  const cuotaIntegra = cuotaProgresiva(baseLiquidable)
  const cuotaDelMinimo = cuotaProgresiva(minimoPersonalFamiliar)
  const cuota = Math.max(0, cuotaIntegra - cuotaDelMinimo)

  const tipoEfectivo = bruto > 0 ? cuota / bruto : 0
  const retencionMensual = (bruto / 12) * tipoEfectivo
  const ssMensual = seguridadSocial / 12
  const netoMensual = (bruto / 12) - retencionMensual - ssMensual

  return {
    cuotaAnual: Math.round(cuota),
    tipoEfectivo,
    retencionMensual: Math.round(retencionMensual),
    netoMensual: Math.round(netoMensual),
    baseLiquidable: Math.round(baseLiquidable),
    seguridadSocial: Math.round(seguridadSocial),
    seguridadSocialMensual: Math.round(ssMensual),
    reduccionTrabajo: Math.round(reduccionTrabajo),
    minimoPersonalFamiliar: Math.round(minimoPersonalFamiliar),
    cuotaIntegra: Math.round(cuotaIntegra),
    cuotaDelMinimo: Math.round(cuotaDelMinimo),
  }
}

// Autónomo: Modelo 130, pago fraccionado = 20% del rendimiento neto (ingresos
// − gastos − 5% de gastos de difícil justificación, tope €2.000/año en
// estimación directa simplificada). Art. 110.1.a) RIRPF: el tipo es SIEMPRE
// del 20% — no existe ningún tipo reducido por antigüedad de la actividad.
// Simplificación: el Modelo 130 real es acumulado del ejercicio y descuenta
// los pagos de trimestres anteriores y las retenciones soportadas; acá se
// estima trimestre a trimestre de forma aislada.
export const TASA_MODELO_130 = 0.20

export function calcIRPFAutonomo({ ingresosTrimestre, gastosTrimestre }) {
  const ingresos = Number(ingresosTrimestre) || 0
  const gastos = Number(gastosTrimestre) || 0
  const rendimientoNeto = Math.max(0, ingresos - gastos)
  const gastosDificilJust = Math.min(rendimientoNeto * 0.05, 2000 / 4) // tope anual /4 trimestres
  const baseAjustada = Math.max(0, rendimientoNeto - gastosDificilJust)
  const pagoFraccionado = baseAjustada * TASA_MODELO_130

  return {
    rendimientoNeto: Math.round(rendimientoNeto),
    gastosDificilJust: Math.round(gastosDificilJust),
    pagoFraccionado: Math.round(pagoFraccionado),
    tasa: TASA_MODELO_130,
  }
}
