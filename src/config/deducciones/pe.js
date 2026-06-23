// src/config/deducciones/pe.js
// Perú — Renta de 5ta categoría + optimización de la deducción adicional de 3 UIT.
// Fuente: SUNAT/MEF · vigencia 2026 (UIT D.S. 301-2025-EF). Actualizar SOLO este archivo.

const UIT = 5500                 // S/ · valor UIT 2026
const DED_BASE = 7 * UIT         // S/ 38 500 · deducción automática de 7 UIT
const TOPE_ADICIONAL = 3 * UIT   // S/ 16 500 · deducción adicional máxima

// % deducible por tipo de gasto sustentado
const CATEGORIAS = [
  { key: 'restaurantes',  label: 'Restaurantes, bares y hoteles',     rate: 0.15, appCats: ['Alimentación'] },
  { key: 'medicos',       label: 'Servicios médicos y odontológicos', rate: 0.30, appCats: ['Salud'] },
  { key: 'profesionales', label: 'Servicios profesionales (renta 4ta)', rate: 0.30, appCats: [] },
  { key: 'alquileres',    label: 'Alquileres de vivienda',            rate: 0.30, appCats: ['Vivienda'] },
]

// Escala progresiva de 5ta categoría sobre el exceso de 7 UIT (límites en UIT)
const BANDAS = [
  [0, 5, 0.08],
  [5, 20, 0.14],
  [20, 35, 0.17],
  [35, 45, 0.20],
  [45, Infinity, 0.27],
]

function impuesto(rentaImponible) {
  const rUIT = (Number(rentaImponible) || 0) / UIT
  let imp = 0
  for (const [lo, hi, rate] of BANDAS) {
    if (rUIT > lo) imp += (Math.min(rUIT, hi) - lo) * UIT * rate
  }
  return Math.max(0, imp)
}

export default {
  pais: 'PE',
  nombre: 'Perú',
  moneda: 'PEN',
  sym: 'S/',
  vigencia: 2026,
  fuente: 'SUNAT/MEF',
  titulo: 'Devolución por gastos deducibles',
  subtitulo: 'Estima cuánto recuperas de Impuesto a la Renta con tus gastos sustentados (hasta 3 UIT)',
  disclaimer: 'Estimación educativa, no asesoría tributaria. Requiere comprobante electrónico con tu DNI y bancarización en pagos > S/2.000. No sustituye tu declaración en SUNAT.',
  categorias: CATEGORIAS,
  needsIngreso: true,
  ingresoLabel: 'Ingreso anual bruto (S/)',
  extraInput: null,

  calcular({ gastosPorCat = {}, ingresoAnual = 0 }) {
    const desglose = CATEGORIAS.map(c => {
      const monto = Number(gastosPorCat[c.key]) || 0
      return { label: c.label, monto: Math.round(monto), aporta: Math.round(monto * c.rate), rate: c.rate }
    })
    const sumaAporta = desglose.reduce((s, d) => s + d.aporta, 0)
    const deduccionAdicional = Math.min(sumaAporta, TOPE_ADICIONAL)
    const ingreso = Number(ingresoAnual) || 0
    const rentaSin = Math.max(0, ingreso - DED_BASE)
    const rentaCon = Math.max(0, ingreso - DED_BASE - deduccionAdicional)
    const ahorro = Math.round(impuesto(rentaSin) - impuesto(rentaCon))
    const topePct = TOPE_ADICIONAL > 0 ? Math.min(100, (sumaAporta / TOPE_ADICIONAL) * 100) : 0
    const faltaParaTope = Math.max(0, TOPE_ADICIONAL - sumaAporta)
    return {
      ahorro,
      deduccionAdicional: Math.round(deduccionAdicional),
      tope: TOPE_ADICIONAL,
      topePct,
      faltaParaTope: Math.round(faltaParaTope),
      totalGastos: Math.round(desglose.reduce((s, d) => s + d.monto, 0)),
      desglose,
      tituloResultado: 'Devolución estimada de Impuesto a la Renta',
      resumen: `Deducción adicional de hasta 3 UIT (S/${TOPE_ADICIONAL.toLocaleString('es-PE')}). El ahorro es el impuesto con la deducción vs. sin ella.`,
    }
  },
}
