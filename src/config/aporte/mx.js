// src/config/aporte/mx.js
// México — Aportaciones voluntarias al retiro (Afore/SAR) con beneficio fiscal.
// Fuente: SAT (Art. 151 fr. V / 185 LISR, Art. 152 ISR) · INEGI (UMA). Vigencia 2026.

import { tasaMarginal, impuestoProgresivo } from '../../utils/marginal.js'

const UMA_ANUAL = 42794.64        // INEGI, vigente feb-2026
const TOPE_UMA  = 5 * UMA_ANUAL   // tope = menor entre 10% ingreso y 5 UMA

// Tarifa ISR anual personas físicas (Art. 152). Tabla 2026 — Anexo 8 RMF 2026,
// publicada en DOF 28-dic-2025 (ajuste inflacionario 13,21%; tasas sin cambios).
const BR = [
  { hasta: 10135.11,   rate: 0.0192 },
  { hasta: 86022.11,   rate: 0.0640 },
  { hasta: 151176.19,  rate: 0.1088 },
  { hasta: 175735.66,  rate: 0.1600 },
  { hasta: 210403.69,  rate: 0.1792 },
  { hasta: 424353.97,  rate: 0.2136 },
  { hasta: 668840.14,  rate: 0.2352 },
  { hasta: 1276925.98, rate: 0.3000 },
  { hasta: 1702567.97, rate: 0.3200 },
  { hasta: 5107703.92, rate: 0.3400 },
  { hasta: Infinity,   rate: 0.3500 },
]

export default {
  pais: 'MX',
  nombre: 'México',
  moneda: 'MXN',
  sym: '$',
  vigencia: 2026,
  fuente: 'SAT/INEGI',
  titulo: 'Ahorro fiscal por aportación voluntaria al retiro',
  subtitulo: 'Estima cuánto ISR ahorras aportando a tu Afore (ahorro voluntario)',
  disclaimer: 'Estimación educativa, no asesoría fiscal. El beneficio real depende de tu declaración anual y tus demás deducciones. Consulta a un contador o al SAT.',
  ingresoLabel: 'Ingreso anual gravable (MXN)',
  aporteLabel: 'Aportación voluntaria anual planeada (MXN)',
  resumenTope: 'Tope deducible: el menor entre 10% de tu ingreso y 5 UMA ($' + Math.round(TOPE_UMA).toLocaleString('es-MX') + ').',

  calcular({ ingresoAnual = 0, aporteAnual = 0 }) {
    const ingreso = Number(ingresoAnual) || 0
    const aporte = Number(aporteAnual) || 0
    const tope = Math.min(0.10 * ingreso, TOPE_UMA)
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
      resumen: 'Ahorro = ISR sin la aportación − ISR con ella (tarifa Art. 152 LISR).',
    }
  },
}
