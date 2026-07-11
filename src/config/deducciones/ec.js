// src/config/deducciones/ec.js
// Ecuador — Rebaja por gastos personales del Impuesto a la Renta.
// Fuente: SRI · vigencia 2026. Cifras volátiles → actualizar SOLO este archivo.

const CANASTA_BASICA = 821.80     // USD · canasta básica familiar enero 2026 (SRI)
const TASA_REBAJA    = 0.18       // rebaja = 18% × min(gastos, N canastas)

// N canastas según cargas familiares — TABLA OFICIAL SRI 2026 (verificada 2026-07-11):
// 0→7 · 1→9 · 2→11 · 3→14 · 4→17 · 5+→20. Enfermedades catastróficas/raras: 100
// canastas (rebaja máx $14.792,40) — caso especial no modelado aún en el selector.
const CANASTAS_POR_CARGAS = { 0: 7, 1: 9, 2: 11, 3: 14, 4: 17, 5: 20 }

const CATEGORIAS = [
  { key: 'salud',        label: 'Salud',                     appCats: ['Salud'] },
  { key: 'educacion',    label: 'Educación, arte y cultura', appCats: ['Educación'] },
  { key: 'alimentacion', label: 'Alimentación',              appCats: ['Alimentación'] },
  { key: 'vivienda',     label: 'Vivienda',                  appCats: ['Vivienda', 'Servicios'] },
  { key: 'vestimenta',   label: 'Vestimenta',                appCats: ['Ropa'] },
  { key: 'turismo',      label: 'Turismo',                   appCats: ['Viajes'] },
]

export default {
  pais: 'EC',
  nombre: 'Ecuador',
  moneda: 'USD',
  sym: '$',
  vigencia: 2026,
  fuente: 'SRI',
  titulo: 'Rebaja por gastos personales',
  subtitulo: 'Estima cuánto reduces tu Impuesto a la Renta con tus gastos deducibles',
  disclaimer: 'Estimación educativa, no asesoría tributaria. La rebaja real depende de tu situación y del Anexo de Gastos Personales del SRI.',
  categorias: CATEGORIAS,
  needsIngreso: false,
  extraInput: { key: 'cargas', label: 'Cargas familiares', type: 'select', options: [0, 1, 2, 3, 4, 5], default: 0 },

  calcular({ gastosPorCat = {}, cargas = 0 }) {
    const totalGastos = Object.values(gastosPorCat).reduce((s, v) => s + (Number(v) || 0), 0)
    const N = CANASTAS_POR_CARGAS[cargas] ?? 7
    const tope = N * CANASTA_BASICA
    const base = Math.min(totalGastos, tope)
    const ahorro = base * TASA_REBAJA
    const topePct = tope > 0 ? Math.min(100, (totalGastos / tope) * 100) : 0
    const faltaParaTope = Math.max(0, tope - totalGastos)
    const desglose = CATEGORIAS.map(c => ({
      label: c.label,
      monto: Math.round(Number(gastosPorCat[c.key]) || 0),
    }))
    return {
      ahorro: Math.round(ahorro),
      tope: Math.round(tope),
      base: Math.round(base),
      topePct,
      faltaParaTope: Math.round(faltaParaTope),
      totalGastos: Math.round(totalGastos),
      desglose,
      tituloResultado: 'Rebaja estimada de tu Impuesto a la Renta',
      resumen: `Rebaja = 18% × mínimo entre tus gastos y ${N} canastas básicas ($${CANASTA_BASICA.toLocaleString('es-EC')} c/u)`,
    }
  },
}
