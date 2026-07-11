// src/config/aporte/us.js
// USA — 401(k) Traditional contribution + tax saving projector.
// Fuente: IRS (brackets 2026, 401k limit 2026). Vigencia 2026.

import { tasaMarginal, impuestoProgresivo } from '../../utils/marginal.js'

const LIMIT_401K = 24500          // IRS elective deferral 2026 (IRA aparte: +$7.500)

// Federal income tax brackets 2026 — single filer (taxable income). IRS.
const BR = [
  { hasta: 12400,    rate: 0.10 },
  { hasta: 50400,    rate: 0.12 },
  { hasta: 105700,   rate: 0.22 },
  { hasta: 201775,   rate: 0.24 },
  { hasta: 256225,   rate: 0.32 },
  { hasta: 640600,   rate: 0.35 },
  { hasta: Infinity, rate: 0.37 },
]

export default {
  pais: 'US',
  nombre: 'USA',
  moneda: 'USD',
  sym: '$',
  vigencia: 2026,
  fuente: 'IRS',
  titulo: '401(k) contribution tax-savings projector',
  subtitulo: 'Estimate how much federal income tax you save with Traditional 401(k) contributions',
  disclaimer: 'Educational estimate, not tax advice. Single-filer federal brackets only (ignores state tax, credits, IRA). Consult a tax professional or the IRS.',
  ingresoLabel: 'Annual taxable income (USD)',
  aporteLabel: 'Planned annual 401(k) contribution (USD)',
  resumenTope: 'Tope deducible: límite 401(k) ' + LIMIT_401K.toLocaleString('en-US') + ' (la IRA suma otros $7.500 aparte).',

  calcular({ ingresoAnual = 0, aporteAnual = 0 }) {
    const ingreso = Number(ingresoAnual) || 0
    const aporte = Number(aporteAnual) || 0
    const tope = Math.min(LIMIT_401K, ingreso) // no se puede deducir más que el ingreso
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
      resumen: 'Saving = tax without the contribution − tax with it (federal brackets, single).',
    }
  },
}
