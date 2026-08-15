// src/config/deducciones/de.js
// Alemania — Werbungskosten (gastos relacionados al trabajo deducibles del Lohnsteuer).
// Fuente: Einkommensteuergesetz (EStG) §9 · vigencia 2026. Cifras volátiles → actualizar SOLO este archivo.

// Arbeitnehmer-Pauschbetrag: deducción automática que TODO empleado recibe
// sin comprobantes. Solo vale la pena declarar gastos reales si superan esto.
const PAUSCHBETRAG_ANUAL = 1230 // € 2026 (Arbeitnehmer-Pauschbetrag)

// Home-Office-Pauschale: €6/día, tope anual.
const HOMEOFFICE_TOPE_ANUAL = 1260 // € 2026 (210 días × €6)

const CATEGORIAS = [
  { key: 'pendler',     label: 'Entfernungspauschale (trayecto casa-trabajo)', appCats: ['Transporte'] },
  { key: 'homeoffice',  label: 'Home-Office-Pauschale',                        appCats: ['Vivienda', 'Servicios'] },
  { key: 'fortbildung', label: 'Fortbildungskosten (formación profesional)',   appCats: ['Educación'] },
  { key: 'arbeitsmittel', label: 'Arbeitsmittel (herramientas de trabajo)',    appCats: ['Compras', 'Tecnología'] },
  { key: 'bewerbung',   label: 'Bewerbungskosten (búsqueda de empleo)',        appCats: ['Otros'] },
]

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

    // Tasa marginal aproximada según ingreso (misma escala que taxCalcDE.js)
    let tasaMarginal
    if (ingresoAnual <= 20000) tasaMarginal = 0.14
    else if (ingresoAnual <= 40000) tasaMarginal = 0.24
    else if (ingresoAnual <= 62800) tasaMarginal = 0.30
    else if (ingresoAnual <= 100000) tasaMarginal = 0.35
    else if (ingresoAnual <= 277825) tasaMarginal = 0.42
    else tasaMarginal = 0.45

    const ahorro = Math.round(excedente * tasaMarginal)
    const topePct = totalGastos > 0 ? Math.min(100, (totalGastos / PAUSCHBETRAG_ANUAL) * 100) : 0
    const faltaParaTope = Math.max(0, PAUSCHBETRAG_ANUAL - totalGastos)

    const desglose = [
      { label: 'Entfernungspauschale', monto: Math.round(Number(gastosPorCat.pendler) || 0) },
      { label: 'Home-Office-Pauschale', monto: Math.round(homeofficeCap), rate: HOMEOFFICE_TOPE_ANUAL > 0 ? undefined : undefined },
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
