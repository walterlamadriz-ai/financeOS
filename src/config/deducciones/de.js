// src/config/deducciones/de.js
// Alemania — Werbungskosten (gastos relacionados al trabajo deducibles del Lohnsteuer).
// Fuente: Einkommensteuergesetz (EStG) §9 · vigencia 2026. Cifras volátiles → actualizar SOLO este archivo.

import { ESTG_2026, calcZvE, ARBEITNEHMER_PAUSCHBETRAG } from '../../utils/taxCalcDE.js'

// Arbeitnehmer-Pauschbetrag: deducción automática que TODO empleado recibe
// sin comprobantes. Solo vale la pena declarar gastos reales si superan esto.
// Vive en taxCalcDE.js porque también reduce la base del Lohnsteuer (zvE).
const PAUSCHBETRAG_ANUAL = ARBEITNEHMER_PAUSCHBETRAG // € 2026

// Home-Office-Pauschale: €6/día, tope anual.
const HOMEOFFICE_TOPE_ANUAL = 1260 // € 2026 (210 días × €6)

const CATEGORIAS = [
  { key: 'pendler',     label: 'Entfernungspauschale (trayecto casa-trabajo)', appCats: ['Transporte'] },
  { key: 'homeoffice',  label: 'Home-Office-Pauschale',                        appCats: ['Vivienda', 'Servicios'] },
  { key: 'fortbildung', label: 'Fortbildungskosten (formación profesional)',   appCats: ['Educación'] },
  { key: 'arbeitsmittel', label: 'Arbeitsmittel (herramientas de trabajo)',    appCats: ['Compras', 'Tecnología'] },
  { key: 'bewerbung',   label: 'Bewerbungskosten (búsqueda de empleo)',        appCats: ['Otros'] },
]

/**
 * ÚNICA fuente de verdad de la tasa marginal alemana (Grenzsteuersatz).
 * Es la derivada analítica de la tarifa del §32a EStG, así que es continua y
 * los umbrales coinciden exactamente con los de la fórmula del impuesto
 * (el 42% arranca en zvE 69.878 €, no en 100.000 €).
 *
 * ⚠ El argumento es el zvE (renta imponible), NO el bruto: hay que restar antes
 *   Werbungskosten, Sonderausgaben-Pauschbetrag y Vorsorgepauschale (calcZvE).
 *
 * @param {number} zvE — renta imponible anual en €
 * @returns {number} tasa marginal de Einkommensteuer (0 a 0.45)
 */
export function tasaMarginalDE(zvE) {
  const x = Math.max(0, Number(zvE) || 0)
  const P = ESTG_2026

  if (x <= P.grundfreibetrag) return 0
  if (x <= P.zona2Fin) {
    const y = (x - P.grundfreibetrag) / 10000
    return (2 * P.z2a * y + P.z2b) / 10000
  }
  if (x <= P.zona3Fin) {
    const z = (x - P.zona2Fin) / 10000
    return (2 * P.z3a * z + P.z3b) / 10000
  }
  if (x <= P.zona4Fin) return P.z4m
  return P.z5m
}

export default {
  pais: 'DE',
  nombre: 'Alemania',
  moneda: 'EUR',
  sym: '€',
  vigencia: 2026,
  fuente: 'EStG §9 / BMF',
  titulo: 'Werbungskosten — deducciones laborales',
  subtitulo: 'Compara tus gastos reales contra el Pauschbetrag automático',
  disclaimer: 'Estimación educativa, no asesoría tributaria. El ahorro real depende de tu Steuerklasse y tasa marginal exacta — usa la Steuererklärung oficial (Elster) para tu declaración.',
  categorias: CATEGORIAS,
  needsIngreso: true,
  ingresoLabel: 'Ingreso bruto anual (Bruttojahresgehalt)',
  extraInput: null,

  calcular({ gastosPorCat = {}, ingresoAnual = 0 }) {
    const homeofficeCap = Math.min(Number(gastosPorCat.homeoffice) || 0, HOMEOFFICE_TOPE_ANUAL)
    const totalGastos =
      (Number(gastosPorCat.pendler) || 0) +
      homeofficeCap +
      (Number(gastosPorCat.fortbildung) || 0) +
      (Number(gastosPorCat.arbeitsmittel) || 0) +
      (Number(gastosPorCat.bewerbung) || 0)

    const deduccionEfectiva = Math.max(totalGastos, PAUSCHBETRAG_ANUAL)
    const superaPauschale = totalGastos > PAUSCHBETRAG_ANUAL
    const excedente = Math.max(0, totalGastos - PAUSCHBETRAG_ANUAL)

    // La tasa marginal se evalúa sobre el zvE, no sobre el bruto.
    const zvE = calcZvE(Number(ingresoAnual) || 0, { werbungskostenAnual: deduccionEfectiva })
    const tasaMarginal = tasaMarginalDE(zvE)

    const ahorro = Math.round(excedente * tasaMarginal)
    // % de los gastos reales respecto del mínimo automático. NO es un tope:
    // superar el 100% es exactamente lo que conviene.
    const topePct = totalGastos > 0 ? (totalGastos / PAUSCHBETRAG_ANUAL) * 100 : 0
    const faltaParaTope = Math.max(0, PAUSCHBETRAG_ANUAL - totalGastos)

    const desglose = [
      { label: 'Entfernungspauschale', monto: Math.round(Number(gastosPorCat.pendler) || 0) },
      { label: 'Home-Office-Pauschale', monto: Math.round(homeofficeCap) },
      { label: 'Fortbildungskosten', monto: Math.round(Number(gastosPorCat.fortbildung) || 0) },
      { label: 'Arbeitsmittel', monto: Math.round(Number(gastosPorCat.arbeitsmittel) || 0) },
      { label: 'Bewerbungskosten', monto: Math.round(Number(gastosPorCat.bewerbung) || 0) },
    ]

    return {
      ahorro,
      tope: PAUSCHBETRAG_ANUAL,
      base: deduccionEfectiva,
      topePct,
      faltaParaTope,
      totalGastos: Math.round(totalGastos),
      zvE: Math.round(zvE),
      desglose,
      superaPauschale,
      tasaMarginal,
      tituloResultado: superaPauschale
        ? 'Ahorro estimado por declarar gastos reales'
        : 'Sigues bajo el Pauschbetrag automático',
      resumen: superaPauschale
        ? `Tus gastos (€${Math.round(totalGastos).toLocaleString('de-DE')}) superan el Pauschbetrag de €${PAUSCHBETRAG_ANUAL.toLocaleString('de-DE')} — ahorro = excedente × ${Math.round(tasaMarginal * 100)}% (tasa marginal estimada)`
        : `El Pauschbetrag automático (€${PAUSCHBETRAG_ANUAL.toLocaleString('de-DE')}) ya cubre tus gastos declarados — no necesitas comprobantes`,
    }
  },
}
