// src/utils/taxCalcCL.js
// Cálculo tributario orientativo APV Chile
// NO constituye asesoría financiera, tributaria ni legal
// Tabla IGC / impuesto único (tramos vigentes SII — verificar en sii.cl cada año)

import {
  FALLBACK,
  TOPE_AFP_SALUD_UF,
  TOPE_CESANTIA_UF,
  COMISION_AFP_PROMEDIO_PCT,
} from './indicadores.js'

// ── UTM mensual vs UTA anual ───────────────────────────────────────────────
// Son DOS cosas distintas y antes se usaba una sola para ambas tablas:
//
//  · UTM_MES  → tabla del impuesto único de 2ª categoría (mensual). Debe ser la
//               UTM del MES que se está calculando. Es la que llega por
//               setIndicadores() desde mindicador.cl (siempre la del mes actual).
//
//  · UTA_ANUAL → tabla del Impuesto Global Complementario (anual). La UTA legal
//               es la UTM de DICIEMBRE del año comercial × 12, no la UTM del mes
//               en curso. mindicador.cl solo entrega la UTM del día, así que no
//               hay forma de deducir la de diciembre desde acá: por defecto se
//               aproxima con UTM_MES × 12 y se marca como aproximada.
//               Para un cálculo exacto hay que pasar la UTA explícitamente
//               (setUTAAnual o el parámetro utaAnual de las funciones anuales).
let UTM_MES   = FALLBACK.utm
let UF        = FALLBACK.uf
let UTA_ANUAL = UTM_MES * 12
let utaEsAproximada = true

// Tramos en factores, no en pesos: los cortes desde/hasta se expresan en UTA
// para el cálculo anual y en UTM para el mensual (son los mismos números), y la
// rebaja es factorRebaja × la unidad que corresponda. Así la tabla mensual deja
// de depender de que UTA sea exactamente UTM×12.
const TRAMOS = [
  { desde: 0,    hasta: 13.5,     tasa: 0,     factorRebaja: 0     },
  { desde: 13.5, hasta: 30,       tasa: 0.04,  factorRebaja: 0.54  },
  { desde: 30,   hasta: 50,       tasa: 0.08,  factorRebaja: 1.74  },
  { desde: 50,   hasta: 70,       tasa: 0.135, factorRebaja: 4.49  },
  { desde: 70,   hasta: 90,       tasa: 0.23,  factorRebaja: 11.14 },
  { desde: 90,   hasta: 120,      tasa: 0.304, factorRebaja: 17.80 },
  { desde: 120,  hasta: 310,      tasa: 0.35,  factorRebaja: 23.32 },
  { desde: 310,  hasta: Infinity, tasa: 0.40,  factorRebaja: 38.82 },
]

const buscarTramo = unidades =>
  TRAMOS.find(t => unidades >= t.desde && unidades < t.hasta) || TRAMOS[TRAMOS.length - 1]

// UTM del mes corriente + UF del día (lo que entrega mindicador.cl).
// Ojo: esto NO fija la UTA del IGC — para eso está setUTAAnual().
export function setIndicadores({ utm, uf }) {
  if (utm && utm > 0) {
    UTM_MES = utm
    if (utaEsAproximada) UTA_ANUAL = UTM_MES * 12
  }
  if (uf && uf > 0) UF = uf
}

// UTA exacta del año tributario: UTM de DICIEMBRE del año comercial × 12.
// Llamar solo si se conoce la UTM de diciembre; si no, queda la aproximación.
export function setUTAAnual({ utmDiciembre, uta }) {
  if (uta && uta > 0)                   { UTA_ANUAL = uta;                 utaEsAproximada = false }
  else if (utmDiciembre && utmDiciembre > 0) { UTA_ANUAL = utmDiciembre * 12; utaEsAproximada = false }
}

// Año comercial (en el que se generó la renta) y año tributario (en el que se
// declara) del cálculo anual. AT = año comercial + 1.
export function getParametrosCL(anioComercial = new Date().getFullYear()) {
  return {
    utmMes: UTM_MES,
    uf: UF,
    utaAnual: UTA_ANUAL,
    utaEsAproximada,
    anioComercial,
    anioTributario: anioComercial + 1,
    comisionAfpPct: COMISION_AFP_PROMEDIO_PCT,
    topeAfpSaludUF: TOPE_AFP_SALUD_UF,
    topeCesantiaUF: TOPE_CESANTIA_UF,
  }
}

export function calcDescuentos(sueldoBrutoMensual) {
  // AFP (10%), comisión de la AFP y salud (7%) se calculan sobre el sueldo topado
  // a TOPE_AFP_SALUD_UF; cesantía (0,6%) sobre TOPE_CESANTIA_UF. Sobre el tope no
  // hay descuento obligatorio.
  const baseAfpSalud = Math.min(sueldoBrutoMensual, TOPE_AFP_SALUD_UF * UF)
  const baseCesantia = Math.min(sueldoBrutoMensual, TOPE_CESANTIA_UF * UF)
  const afp      = Math.round(baseAfpSalud * 0.10)
  const salud    = Math.round(baseAfpSalud * 0.07)
  const cesantia = Math.round(baseCesantia * 0.006)
  // Comisión de administración de la AFP: sale del líquido igual que el resto,
  // pero NO es cotización previsional — no rebaja la base del impuesto único.
  const comision = Math.round(baseAfpSalud * (COMISION_AFP_PROMEDIO_PCT / 100))

  const totalDeducible = afp + salud + cesantia  // rebaja base imponible
  const total          = totalDeducible + comision // lo que efectivamente se descuenta
  return {
    afp, salud, cesantia, comision,
    total,
    totalDeducible,
    liquido: sueldoBrutoMensual - total,
  }
}

// Impuesto Global Complementario (ANUAL, orientativo).
// ⚠ utaAnual NO es la misma unidad que la UTM mensual: la UTA legal es la UTM de
// DICIEMBRE del año comercial × 12. Si no se pasa, se usa UTA_ANUAL, que por
// defecto es una aproximación (UTM del mes en curso × 12) — ver getParametrosCL().
export function calcImpuestoAnual(rentaAnual, utaAnual = UTA_ANUAL) {
  if (!rentaAnual || rentaAnual <= 0) return { impuesto: 0, tasaEfectiva: 0, tramo: 1, tasaMarginal: 0 }
  const uta   = utaAnual > 0 ? utaAnual : UTA_ANUAL
  const tramo = buscarTramo(rentaAnual / uta)
  const impuesto = Math.max(0, rentaAnual * tramo.tasa - tramo.factorRebaja * uta)
  return {
    impuesto:     Math.round(impuesto),
    tasaEfectiva: rentaAnual > 0 ? impuesto / rentaAnual : 0,
    tramo:        TRAMOS.indexOf(tramo) + 1,
    tasaMarginal: tramo.tasa,
  }
}

// Impuesto único de segunda categoría (MENSUAL, orientativo).
// Usa la UTM del mes corriente — nunca la UTA del cálculo anual.
export function calcImpuestoMensual(baseMensual) {
  if (!baseMensual || baseMensual <= 0) return 0
  const tramo = buscarTramo(baseMensual / UTM_MES)
  return Math.max(0, Math.round(baseMensual * tramo.tasa - tramo.factorRebaja * UTM_MES))
}

// Invierte líquido → bruto incluyendo previsional (AFP + comisión AFP + salud +
// cesantía) e impuesto único de 2ª categoría.
// El líquido es monótono creciente en el bruto y lineal por tramos, así que se
// resuelve por bisección.
export function calcBrutoDesdeLiquido(liquidoMensual) {
  if (!liquidoMensual || liquidoMensual <= 0) return 0
  const netoDe = bruto => {
    const desc = calcDescuentos(bruto)
    // La comisión de la AFP se descuenta del bolsillo pero no rebaja la base
    // imponible, por eso el impuesto va sobre totalDeducible y el líquido sobre total.
    const base = Math.max(0, bruto - desc.totalDeducible)
    return bruto - desc.total - calcImpuestoMensual(base)
  }
  let lo = liquidoMensual, hi = liquidoMensual * 2.5
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (netoDe(mid) < liquidoMensual) lo = mid
    else hi = mid
  }
  return Math.round((lo + hi) / 2)
}

export function calcBeneficioAPV({ sueldoBrutoMensual, bonoAnual = 0, apvMensual, utaAnual }) {
  if (!sueldoBrutoMensual || sueldoBrutoMensual <= 0) return null
  if (!apvMensual || apvMensual <= 0) return null

  const uta             = utaAnual && utaAnual > 0 ? utaAnual : UTA_ANUAL
  const rentaAnualBruta = sueldoBrutoMensual * 12 + (bonoAnual || 0)
  const descMensual     = calcDescuentos(sueldoBrutoMensual)
  const descAnual       = descMensual.total * 12
  // Solo las cotizaciones previsionales rebajan la base; la comisión de la AFP no.
  const descDeducibleAnual = descMensual.totalDeducible * 12
  const baseImponible      = Math.max(0, rentaAnualBruta - descDeducibleAnual)
  const sinAPV             = calcImpuestoAnual(baseImponible, uta)

  const apvAnual = apvMensual * 12

  // ── Régimen A ────────────────────────────────────────────────────────────
  // Bonificación fiscal del 15% del aporte: es un DEPÓSITO DEL ESTADO en la
  // cuenta APV del trabajador, NO una rebaja del impuesto. Nunca se resta de
  // impuestoSinAPV — el impuesto del Régimen A es idéntico al de no aportar.
  // Topes: (1) 6 UTM al año, (2) DL 3.500 — el ahorro con derecho a bonificación
  // no puede exceder 10× las cotizaciones obligatorias del año calendario.
  const cotizacionesObligatoriasAnuales = descMensual.afp * 12
  const apvConDerechoABono = Math.min(apvAnual, 10 * cotizacionesObligatoriasAnuales)
  const topeBonoUTM        = 6 * UTM_MES
  const bonoEstatalRegA    = Math.round(Math.min(apvConDerechoABono * 0.15, topeBonoUTM))
  const bonoLimitadoPor10x = apvConDerechoABono < apvAnual

  // ── Régimen B ────────────────────────────────────────────────────────────
  const topeRegB     = Math.round(600 * UF)
  const apvDeducible = Math.min(apvAnual, topeRegB)
  const baseConRegB  = Math.max(0, baseImponible - apvDeducible)
  const conRegB      = calcImpuestoAnual(baseConRegB, uta)
  const ahorroRegB   = Math.round(Math.max(0, sinAPV.impuesto - conRegB.impuesto))

  return {
    rentaAnualBruta:      Math.round(rentaAnualBruta),
    descuentosAnuales:    Math.round(descAnual),
    descuentosDeducibles: Math.round(descDeducibleAnual),
    comisionAfpAnual:     descMensual.comision * 12,
    baseImponible:        Math.round(baseImponible),
    liquidoMensual:       descMensual.liquido,
    impuestoSinAPV:       sinAPV.impuesto,
    tasaEfectiva:         sinAPV.tasaEfectiva,
    tramoActual:          sinAPV.tramo,
    tasaMarginal:         sinAPV.tasaMarginal,

    // Régimen A: el impuesto NO cambia; el beneficio llega como depósito estatal.
    impuestoConRegA:      sinAPV.impuesto,
    ahorroTributarioRegA: 0,
    bonoEstatalRegA,
    bonoLimitadoPor10x,
    cotizacionesObligatoriasAnuales,

    impuestoConRegB:   conRegB.impuesto,
    baseConRegB:       Math.round(baseConRegB),
    ahorroRegB,
    // Compara beneficio económico total del año. Ojo: no son la misma clase de
    // peso — el bono del A queda inmovilizado en la cuenta APV hasta el retiro,
    // el ahorro del B es caja que no se paga al SII este año.
    mayorBeneficio:    ahorroRegB > bonoEstatalRegA ? 'B' : 'A',
    UTMref:            UTM_MES,
    UTAref:            uta,
    utaEsAproximada,
    UFref:             UF,
    topeRegB,
  }
}

export function calcGapTramo(baseImponible, utaAnual) {
  if (!baseImponible || baseImponible <= 0) return null
  const uta      = utaAnual && utaAnual > 0 ? utaAnual : UTA_ANUAL
  const baseUTA  = baseImponible / uta
  const tramoIdx = TRAMOS.findIndex(t => baseUTA >= t.desde && baseUTA < t.hasta)
  if (tramoIdx <= 0) return null

  const umbralInferiorPesos = Math.round(TRAMOS[tramoIdx].desde * uta)
  const gap                 = Math.round(baseImponible - umbralInferiorPesos)
  const topeRegBActual      = Math.round(600 * UF)

  return {
    gap,
    gapMensual:        Math.round(gap / 12),
    tramoActual:       tramoIdx + 1,
    tramoObjetivo:     tramoIdx,
    tasaActual:        TRAMOS[tramoIdx].tasa,
    tasaObjetivo:      TRAMOS[tramoIdx - 1].tasa,
    umbralInferiorPesos,
    dentroDelTope:     gap <= topeRegBActual,
    porcentajeDelTope: Math.round(gap / topeRegBActual * 100),
    topeRegB:          topeRegBActual,
  }
}

export function calcArbitraje(tasaMarginal) {
  let tasaRetiroEst
  if      (tasaMarginal >= 0.304) tasaRetiroEst = 0.04
  else if (tasaMarginal >= 0.23)  tasaRetiroEst = 0.04
  else if (tasaMarginal >= 0.135) tasaRetiroEst = 0.02
  else if (tasaMarginal >= 0.08)  tasaRetiroEst = 0.01
  else                             tasaRetiroEst = 0

  const arbitrajePorPeso = Math.max(0, tasaMarginal - tasaRetiroEst)
  return {
    tasaMarginalHoy:  tasaMarginal,
    tasaRetiroEst,
    arbitrajePorPeso,
    centavosPorPeso:  Math.round(arbitrajePorPeso * 100),
  }
}
