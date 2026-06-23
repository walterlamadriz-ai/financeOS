// src/config/aporte/es.js
// España — Aportación a plan de pensiones con reducción de la base imponible (IRPF).
// Fuente: AEAT. Vigencia 2025. Tramos = escala general aproximada (estatal + autonómica).

import { tasaMarginal, impuestoProgresivo } from '../../utils/marginal.js'

const TOPE_FIJO = 1500            // tope reducción: menor entre 1.500€ y 30% rendimientos netos

// Escala IRPF general aproximada (estatal + autonómica media). El tipo real varía
// por comunidad autónoma → se informa como estimación en el disclaimer.
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
  vigencia: 2025,
  fuente: 'AEAT',
  titulo: 'Ahorro fiscal por aportación a plan de pensiones',
  subtitulo: 'Estima cuánto IRPF ahorras reduciendo tu base imponible con tu plan de pensiones',
  disclaimer: 'Estimación educativa, no asesoramiento fiscal. El tipo marginal real depende de tu comunidad autónoma. Tope reducido a 1.500€/año desde 2022. Consulta un asesor o la AEAT.',
  ingresoLabel: 'Base imponible anual (EUR)',
  aporteLabel: 'Aportación anual planeada al plan de pensiones (EUR)',
  resumenTope: 'Tope reducción: el menor entre 1.500€ y el 30% de tus rendimientos netos del trabajo.',

  calcular({ ingresoAnual = 0, aporteAnual = 0 }) {
    const ingreso = Number(ingresoAnual) || 0
    const aporte = Number(aporteAnual) || 0
    const tope = Math.min(TOPE_FIJO, 0.30 * ingreso)
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
