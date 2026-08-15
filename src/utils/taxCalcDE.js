// src/utils/taxCalcDE.js
// Cálculo orientativo de descuentos salariales — Alemania (Lohnabzüge)
// NO constituye asesoría tributaria. Estimación simplificada: no reemplaza
// al cálculo real de Lohnsteuer (que depende de Steuerklasse, Freibeträge
// individuales y la tabla oficial del BMF).
// Cifras vigentes 2026 — actualizar anualmente contra bmf-steuerrechner.de

// Tarifas de contribuciones sociales (Sozialversicherung) — parte del empleado.
// Fuente: valores de referencia 2026, aportes compartidos empleado/empleador al 50%.
const RENTENVERSICHERUNG = 0.093   // 18.6% total → 9.3% empleado
const ARBEITSLOSENVERS   = 0.013   // 2.6% total → 1.3% empleado
const PFLEGEVERSICHERUNG = 0.018   // 3.6% total → 1.8% empleado (sin recargo por hijos)
const KRANKENVERS_BASE   = 0.073   // 14.6% total → 7.3% empleado
const KRANKENVERS_ZUSATZ = 0.0085  // Zusatzbeitrag promedio 2026 → mitad empleado ≈ 0.85%

// Beitragsbemessungsgrenze (tope de cotización) 2026 — Renten-/Arbeitslosenversicherung
const BBG_RV_MENSUAL = 8050   // € — tope RV/ALV (valor referencial, actualizar anual)
const BBG_KV_MENSUAL = 5512.5 // € — tope KV/PV (valor referencial, actualizar anual)

// Solidaritätszuschlag: 5.5% del impuesto, pero solo aplica sobre ingresos altos
// desde la reforma 2021. Umbral aproximado de exención (Freigrenze) anual.
const SOLI_FREIGRENZE_ANUAL = 18130 // € de impuesto anual, por debajo no se paga Soli
const SOLI_TASA = 0.055

// Kirchensteuer por Bundesland — 8% en Baviera y Baden-Württemberg, 9% el resto
const KIRCHENSTEUER_8PCT_STATES = ['BY', 'BW']

export function calcSozialversicherung(bruttoMensual) {
  const baseRV = Math.min(bruttoMensual, BBG_RV_MENSUAL)
  const baseKV = Math.min(bruttoMensual, BBG_KV_MENSUAL)

  const rentenversicherung = Math.round(baseRV * RENTENVERSICHERUNG)
  const arbeitslosenversicherung = Math.round(baseRV * ARBEITSLOSENVERS)
  const pflegeversicherung = Math.round(baseKV * PFLEGEVERSICHERUNG)
  const krankenversicherung = Math.round(baseKV * (KRANKENVERS_BASE + KRANKENVERS_ZUSATZ))

  const total = rentenversicherung + arbeitslosenversicherung + pflegeversicherung + krankenversicherung

  return { rentenversicherung, arbeitslosenversicherung, pflegeversicherung, krankenversicherung, total }
}

// Estimación muy simplificada del impuesto sobre la renta (Einkommensteuer),
// usada solo para proyectar si aplica Solidaritätszuschlag y Kirchensteuer.
// La tabla real es una fórmula continua (§32a EStG); aquí se usa una
// aproximación por tramos para no fingir precisión que esta calculadora no tiene.
const GRUNDFREIBETRAG_ANUAL = 11784 // € 2026 — mínimo no imponible

function estimarImpuestoAnual(rentaImponibleAnual) {
  if (rentaImponibleAnual <= GRUNDFREIBETRAG_ANUAL) return 0
  const excedente = rentaImponibleAnual - GRUNDFREIBETRAG_ANUAL
  // Aproximación de tasa efectiva progresiva 14%→42%, calibrada para
  // acercarse a la curva real en el rango medio (no exacta en los extremos).
  let tasaEfectivaAprox
  if (rentaImponibleAnual <= 20000) tasaEfectivaAprox = 0.12
  else if (rentaImponibleAnual <= 40000) tasaEfectivaAprox = 0.18
  else if (rentaImponibleAnual <= 62800) tasaEfectivaAprox = 0.24
  else if (rentaImponibleAnual <= 100000) tasaEfectivaAprox = 0.29
  else if (rentaImponibleAnual <= 277825) tasaEfectivaAprox = 0.34
  else tasaEfectivaAprox = 0.42
  return Math.round(excedente * tasaEfectivaAprox)
}

/**
 * Calcula el desglose completo de descuentos salariales alemanes.
 * @param {number} bruttoMensual — sueldo bruto mensual en EUR
 * @param {object} opts
 * @param {boolean} opts.kirchensteuerpflichtig — si paga impuesto eclesiástico
 * @param {string}  opts.bundesland — código de 2 letras (BY, BW, NW, ...) para tasa Kirchensteuer
 * @param {number}  opts.werbungskostenAnual — deducciones que reducen la base imponible
 */
export function calcDescuentosDE(bruttoMensual, opts = {}) {
  const { kirchensteuerpflichtig = false, bundesland = 'NW', werbungskostenAnual = 0 } = opts

  if (!bruttoMensual || bruttoMensual <= 0) {
    return {
      sozialversicherung: { rentenversicherung: 0, arbeitslosenversicherung: 0, pflegeversicherung: 0, krankenversicherung: 0, total: 0 },
      lohnsteuer: 0, soli: 0, kirchensteuer: 0, totalAbzuege: 0, netto: 0, tasaEfectiva: 0,
    }
  }

  const sozialversicherung = calcSozialversicherung(bruttoMensual)

  const bruttoAnual = bruttoMensual * 12
  const rentaImponibleAnual = Math.max(0, bruttoAnual - werbungskostenAnual)
  const impuestoAnual = estimarImpuestoAnual(rentaImponibleAnual)
  const lohnsteuerMensual = Math.round(impuestoAnual / 12)

  const soliAnual = impuestoAnual > SOLI_FREIGRENZE_ANUAL ? Math.round(impuestoAnual * SOLI_TASA) : 0
  const soliMensual = Math.round(soliAnual / 12)

  const tasaKirche = KIRCHENSTEUER_8PCT_STATES.includes(bundesland) ? 0.08 : 0.09
  const kirchensteuerMensual = kirchensteuerpflichtig ? Math.round(lohnsteuerMensual * tasaKirche) : 0

  const totalAbzuege = sozialversicherung.total + lohnsteuerMensual + soliMensual + kirchensteuerMensual
  const netto = Math.round(bruttoMensual - totalAbzuege)
  const tasaEfectiva = bruttoMensual > 0 ? totalAbzuege / bruttoMensual : 0

  return {
    sozialversicherung,
    lohnsteuer: lohnsteuerMensual,
    soli: soliMensual,
    kirchensteuer: kirchensteuerMensual,
    totalAbzuege,
    netto,
    tasaEfectiva,
  }
}

export const BUNDESLAENDER = [
  { code: 'BW', label: 'Baden-Württemberg' },
  { code: 'BY', label: 'Bayern' },
  { code: 'BE', label: 'Berlin' },
  { code: 'BB', label: 'Brandenburg' },
  { code: 'HB', label: 'Bremen' },
  { code: 'HH', label: 'Hamburg' },
  { code: 'HE', label: 'Hessen' },
  { code: 'MV', label: 'Mecklenburg-Vorpommern' },
  { code: 'NI', label: 'Niedersachsen' },
  { code: 'NW', label: 'Nordrhein-Westfalen' },
  { code: 'RP', label: 'Rheinland-Pfalz' },
  { code: 'SL', label: 'Saarland' },
  { code: 'SN', label: 'Sachsen' },
  { code: 'ST', label: 'Sachsen-Anhalt' },
  { code: 'SH', label: 'Schleswig-Holstein' },
  { code: 'TH', label: 'Thüringen' },
]
