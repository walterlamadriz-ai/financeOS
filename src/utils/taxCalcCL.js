// src/utils/taxCalcCL.js
// Cálculo tributario orientativo APV Chile v1.4
// NO constituye asesoría financiera, tributaria ni legal
// Tabla Global Complementario 2024 — orientativa
// UTM referencial: $65.916 CLP (verificar en sii.cl)

const UTM = 65916
const UTA = UTM * 12

const TRAMOS = [
  { desde: 0,    hasta: 13.5,     tasa: 0,     rebaja: 0              },
  { desde: 13.5, hasta: 30,       tasa: 0.04,  rebaja: 0.54  * UTA   },
  { desde: 30,   hasta: 50,       tasa: 0.08,  rebaja: 1.74  * UTA   },
  { desde: 50,   hasta: 70,       tasa: 0.135, rebaja: 4.49  * UTA   },
  { desde: 70,   hasta: 90,       tasa: 0.23,  rebaja: 11.14 * UTA   },
  { desde: 90,   hasta: 120,      tasa: 0.304, rebaja: 17.80 * UTA   },
  { desde: 120,  hasta: 310,      tasa: 0.35,  rebaja: 23.32 * UTA   },
  { desde: 310,  hasta: Infinity, tasa: 0.40,  rebaja: 38.82 * UTA   },
]

export function calcDescuentos(sueldoBrutoMensual) {
  const afp      = Math.round(sueldoBrutoMensual * 0.10)
  const salud    = Math.round(sueldoBrutoMensual * 0.07)
  const cesantia = Math.round(sueldoBrutoMensual * 0.006)
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

  const topeRegB     = 19200000
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
  }
}
