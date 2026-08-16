// src/config/aporte/es.js
// España — Aportación a plan de pensiones con reducción de la base imponible (IRPF).
// Fuente: AEAT, art. 52 LIRPF. Vigencia 2026.

import { tasaMarginal, impuestoProgresivo } from '../../utils/marginal.js'

// Tope individual (planes personales). Reducido de 8.000€ a 1.500€ desde 2022.
const TOPE_INDIVIDUAL = 1500
// Límite conjunto cuando hay plan de empleo: 1.500 individual + 8.500 de
// contribución empresarial (o del trabajador al mismo instrumento, sujeto al
// multiplicador de la aportación de la empresa) = 10.000€.
const TOPE_CON_PLAN_EMPLEO = 10000

// Escala IRPF general aproximada (estatal + autonómica de referencia). El tipo real
// varía por comunidad autónoma → se informa como estimación en el disclaimer.
const BR = [
  { hasta: 12450,    rate: 0.19 },
  { hasta: 20200,    rate: 0.24 },
  { hasta: 35200,    rate: 0.30 },
  { hasta: 60000,    rate: 0.37 },
  { hasta: 300000,   rate: 0.45 },
  { hasta: Infinity, rate: 0.47 },
]

export default {
  pais: 'ES',
  nombre: 'España',
  moneda: 'EUR',
  sym: '€',
  vigencia: 2026,
  fuente: 'AEAT',
  titulo: 'Ahorro fiscal por aportación a plan de pensiones',
  subtitulo: 'Estima cuánto IRPF ahorras reduciendo tu base imponible con tu plan de pensiones',
  disclaimer: 'Estimación educativa, no asesoramiento fiscal. El tipo marginal real depende de tu comunidad autónoma. Tope general 1.500€/año en planes individuales; sube hasta 10.000€ conjuntos si tu empresa aporta a un plan de empleo. Consulta un asesor o la AEAT.',
  ingresoLabel: 'Base imponible anual (EUR)',
  aporteLabel: 'Aportación anual planeada al plan de pensiones (EUR)',
  resumenTope: 'Tope reducción: el menor entre 1.500€ (10.000€ si hay plan de empleo) y el 30% de tus rendimientos netos del trabajo y actividades económicas.',

  // Toggle opcional que la página de Ahorro Fiscal renderiza si existe.
  // Los demás países no lo definen y su UI queda igual.
  toggle: {
    key: 'planEmpleo',
    label: 'Mi empresa aporta a un plan de pensiones de empleo',
    hint: 'Sube el límite conjunto de 1.500€ a 10.000€ (1.500 individual + 8.500 de la empresa).',
  },

  calcular({ ingresoAnual = 0, aporteAnual = 0, planEmpleo = false }) {
    const ingreso = Number(ingresoAnual) || 0
    const aporte = Number(aporteAnual) || 0
    const topeAbsoluto = planEmpleo ? TOPE_CON_PLAN_EMPLEO : TOPE_INDIVIDUAL
    const tope = Math.min(topeAbsoluto, 0.30 * ingreso)
    const deducible = Math.min(aporte, tope)
    const ahorro = impuestoProgresivo(BR, ingreso) - impuestoProgresivo(BR, ingreso - deducible)
    const topePct = tope > 0 ? Math.min(100, (aporte / tope) * 100) : 0
    const faltaParaTope = Math.max(0, tope - aporte)
    return {
      ahorro: Math.round(ahorro),
      deducible: Math.round(deducible),
      tope: Math.round(tope),
      topePct,
      faltaParaTope: Math.round(faltaParaTope),
      marginal: tasaMarginal(BR, ingreso),
      resumen: 'Ahorro = IRPF sin la aportación − IRPF con ella (escala general estimada).',
    }
  },
}
