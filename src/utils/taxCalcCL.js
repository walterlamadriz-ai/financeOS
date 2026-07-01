// src/utils/taxCalcCL.js
// Cálculo tributario orientativo APV Chile
// NO constituye asesoría financiera, tributaria ni legal
// Tabla IGC AT 2026 (tramos vigentes SII — verificar en sii.cl cada año)
// UTM: $69.542 (junio 2026) — actualizar anualmente
// UF:  $39.724 (diciembre 2025) — actualizar anualmente

let UTM = 69542
let UF  = 39724
let UTA = UTM * 12

function buildTramos(uta) {
  return [
    { desde: 0,    hasta: 13.5,     tasa: 0,     rebaja: 0              },
    { desde: 13.5, hasta: 30,       tasa: 0.04,  rebaja: 0.54  * uta   },
    { desde: 30,   hasta: 50,       tasa: 0.08,  rebaja: 1.74  * uta   },
    { desde: 50,   hasta: 70,       tasa: 0.135, rebaja: 4.49  * uta   },
    { desde: 70,   hasta: 90,       tasa: 0.23,  rebaja: 11.14 * uta   },
    { desde: 90,   hasta: 120,      tasa: 0.304, rebaja: 17.80 * uta   },
    { desde: 120,  hasta: 310,      tasa: 0.35,  rebaja: 23.32 * uta   },
    { desde: 310,  hasta: Infinity, tasa: 0.40,  rebaja: 38.82 * uta   },
  ]
}
let TRAMOS = buildTramos(UTA)

export function setIndicadores({ utm, uf }) {
  if (utm && utm > 0) { UTM = utm; UTA = UTM * 12; TRAMOS = buildTramos(UTA) }
  if (uf  && uf  > 0)   UF  = uf
}

// Topes imponibles (actualizar anualmente — valores ref. 2025/2026)
const TOPE_AFP_SALUD_UF = 87.8   // AFP + salud
const TOPE_CESANTIA_UF  = 131.9  // seguro de cesantía

export function calcDescuentos(sueldoBrutoMensual) {
  // AFP (10%) y salud (7%) se calculan sobre el sueldo topado a 87,8 UF;
  // cesantía (0,6%) sobre el tope de 131,9 UF. Sobre el tope no hay descuento obligatorio.
  const baseAfpSalud = Math.min(sueldoBrutoMensual, TOPE_AFP_SALUD_UF * UF)
  const baseCesantia = Math.min(sueldoBrutoMensual, TOPE_CESANTIA_UF * UF)
  const afp      = Math.round(baseAfpSalud * 0.10)
  const salud    = Math.round(baseAfpSalud * 0.07)
  const cesantia = Math.round(baseCesantia * 0.006)
  const total    = afp + salud + cesantia
  const liquido  = sueldoBrutoMensual - total
  return { afp, salud, cesantia, total, liquido }
}

export function calcImpuestoAnual(rentaAnual) {
  if (!rentaAnual || rentaAnual <= 0) return { impuesto: 0, tasaEfectiva: 0, tramo: 1, tasaMarginal: 0 }
  const rentaUTA = rentaAnual / UTA
  const tramo = TRAMOS.find(t => rentaUTA >= t.desde && rentaUTA < t.hasta) || TRAMOS[TRAMOS.length - 1]
  const impuesto = Math.max(0, rentaAnual * tramo.tasa - tramo.rebaja)
  return {
    impuesto:     Math.round(impuesto),
    tasaEfectiva: rentaAnual > 0 ? impuesto / rentaAnual : 0,
    tramo:        TRAMOS.indexOf(tramo) + 1,
    tasaMarginal: tramo.tasa,
  }
}

// Impuesto único de segunda categoría (mensual, orientativo).
// Usa la misma tabla que el anual pero en UTM: la rebaja anual (factor·UTA) / 12 = factor·UTM.
export function calcImpuestoMensual(baseMensual) {
  if (!baseMensual || baseMensual <= 0) return 0
  const baseUTM = baseMensual / UTM
  const tramo = TRAMOS.find(t => baseUTM >= t.desde && baseUTM < t.hasta) || TRAMOS[TRAMOS.length - 1]
  const rebajaMensual = tramo.rebaja / 12
  return Math.max(0, Math.round(baseMensual * tramo.tasa - rebajaMensual))
}

// Invierte líquido → bruto incluyendo previsional (AFP+Salud+Cesantía) e impuesto único de 2ª categoría.
// El líquido es monótono creciente en el bruto y lineal por tramos, así que se resuelve por bisección.
export function calcBrutoDesdeLiquido(liquidoMensual) {
  if (!liquidoMensual || liquidoMensual <= 0) return 0
  const netoDe = bruto => {
    const prev = calcDescuentos(bruto).total
    const base = Math.max(0, bruto - prev)
    return bruto - prev - calcImpuestoMensual(base)
  }
  let lo = liquidoMensual, hi = liquidoMensual * 2.5
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (netoDe(mid) < liquidoMensual) lo = mid
    else hi = mid
  }
  return Math.round((lo + hi) / 2)
}

export function calcBeneficioAPV({ sueldoBrutoMensual, bonoAnual = 0, apvMensual }) {
  if (!sueldoBrutoMensual || sueldoBrutoMensual <= 0) return null
  if (!apvMensual || apvMensual <= 0) return null

  const rentaAnualBruta = sueldoBrutoMensual * 12 + (bonoAnual || 0)
  const descMensual     = calcDescuentos(sueldoBrutoMensual)
  const descAnual       = descMensual.total * 12
  const baseImponible   = Math.max(0, rentaAnualBruta - descAnual)
  const sinAPV          = calcImpuestoAnual(baseImponible)

  const apvAnual   = apvMensual * 12
  const topeRegA   = 6 * UTM
  const bonifRegA  = Math.min(apvAnual * 0.15, topeRegA)
  const ahorroRegA = Math.round(bonifRegA)

  const topeRegB     = Math.round(600 * UF)
  const apvDeducible = Math.min(apvAnual, topeRegB)
  const baseConRegB  = Math.max(0, baseImponible - apvDeducible)
  const conRegB      = calcImpuestoAnual(baseConRegB)
  const ahorroRegB   = Math.round(Math.max(0, sinAPV.impuesto - conRegB.impuesto))

  return {
    rentaAnualBruta:   Math.round(rentaAnualBruta),
    descuentosAnuales: Math.round(descAnual),
    baseImponible:     Math.round(baseImponible),
    liquidoMensual:    descMensual.liquido,
    impuestoSinAPV:    sinAPV.impuesto,
    tasaEfectiva:      sinAPV.tasaEfectiva,
    tramoActual:       sinAPV.tramo,
    tasaMarginal:      sinAPV.tasaMarginal,
    bonifRegA,
    ahorroRegA,
    impuestoConRegB:   conRegB.impuesto,
    baseConRegB:       Math.round(baseConRegB),
    ahorroRegB,
    mayorBeneficio:    ahorroRegB > ahorroRegA ? 'B' : 'A',
    UTMref:            UTM,
    UTAref:            UTA,
    UFref:             UF,
    topeRegB,
  }
}

export function calcGapTramo(baseImponible) {
  if (!baseImponible || baseImponible <= 0) return null
  const baseUTA  = baseImponible / UTA
  const tramoIdx = TRAMOS.findIndex(t => baseUTA >= t.desde && baseUTA < t.hasta)
  if (tramoIdx <= 0) return null

  const umbralInferiorPesos = Math.round(TRAMOS[tramoIdx].desde * UTA)
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
