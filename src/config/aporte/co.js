// src/config/aporte/co.js
// Colombia — Aportes a AFC / Pensiones Voluntarias con beneficio fiscal (renta exenta).
// Fuente: DIAN (Art. 126-1 / 126-4 / 336 ET). Vigencia 2026. UVT 2026 = $52.374.

import { tasaMarginal, impuestoProgresivo } from '../../utils/marginal.js'

const UVT = 52374                 // DIAN Res. 000238 de 2025
const TOPE_UVT_PENSION = 3800     // tope aporte exento: menor entre 30% ingreso y 3.800 UVT
// (existe además el límite global del 40% / 1.340 UVT del Art. 336 — se informa en nota)

// Tarifa cédula general (renta líquida gravable, en UVT). Art. 241 ET.
const BR_UVT = [
  { hasta: 1090,     rate: 0.00 },
  { hasta: 1700,     rate: 0.19 },
  { hasta: 4100,     rate: 0.28 },
  { hasta: 8670,     rate: 0.33 },
  { hasta: 18970,    rate: 0.35 },
  { hasta: 31000,    rate: 0.37 },
  { hasta: Infinity, rate: 0.39 },
]
// Brackets en COP (UVT × valor)
const BR = BR_UVT.map(b => ({ hasta: b.hasta === Infinity ? Infinity : b.hasta * UVT, rate: b.rate }))

export default {
  pais: 'CO',
  nombre: 'Colombia',
  moneda: 'COP',
  sym: '$',
  vigencia: 2026,
  fuente: 'DIAN',
  titulo: 'Ahorro fiscal por aportes a AFC / Pensión Voluntaria',
  subtitulo: 'Estima cuánto reduces tu renta gravable aportando a cuentas con beneficio fiscal',
  disclaimer: 'Estimación educativa, no asesoría tributaria. Sujeto al límite global del 40% / 1.340 UVT (Art. 336 ET) y a permanencia mínima. Consulta un contador o la DIAN.',
  ingresoLabel: 'Ingreso laboral anual (COP)',
  aporteLabel: 'Aporte anual planeado a AFC/Pensión Voluntaria (COP)',
  resumenTope: 'Tope exento: el menor entre 30% de tu ingreso y 3.800 UVT ($' + Math.round(TOPE_UVT_PENSION * UVT).toLocaleString('es-CO') + ').',

  calcular({ ingresoAnual = 0, aporteAnual = 0 }) {
    const ingreso = Number(ingresoAnual) || 0
    const aporte = Number(aporteAnual) || 0
    const tope = Math.min(0.30 * ingreso, TOPE_UVT_PENSION * UVT)
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
      resumen: 'Ahorro = renta sin el aporte − renta con él (tarifa Art. 241 ET).',
    }
  },
}
