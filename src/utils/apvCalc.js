// src/utils/apvCalc.js
// Simulador APV Chile — cálculo orientativo de acumulación
// NO constituye asesoría financiera, tributaria ni previsional
// v1.4 — sin APIs externas, funciona offline, todo en CLP nominal

import { FALLBACK } from './indicadores.js'

/**
 * Calcula proyección APV con interés compuesto mensual
 * @param {Object} params
 * @param {number} params.currentBalance    - Saldo APV actual (CLP, default 0)
 * @param {number} params.monthlyContribution - Aporte mensual (CLP)
 * @param {number} params.currentAge        - Edad actual (años)
 * @param {number} params.targetAge         - Edad objetivo jubilación (años)
 * @param {number} params.expectedReturn    - Rentabilidad anual esperada (%, default 5)
 * @param {number} params.utm               - UTM vigente para el tope del bono Régimen A
 * @returns {Object} Proyecciones orientativas
 */
export function calcAPV({
  currentBalance = 0,
  monthlyContribution,
  currentAge,
  targetAge,
  expectedReturn = 5,
  utm = FALLBACK.utm
}) {
  // Validaciones básicas
  if (!monthlyContribution || monthlyContribution <= 0) return null
  if (!currentAge || !targetAge || targetAge <= currentAge) return null

  const annualRate = expectedReturn / 100
  // Tasa mensual equivalente
  const r = Math.pow(1 + annualRate, 1 / 12) - 1
  const n = (targetAge - currentAge) * 12
  const S0 = currentBalance || 0
  const P = monthlyContribution

  // Valor futuro a `meses` con los aportes empezando recién en `mesesAporte`.
  // El saldo YA EXISTENTE (S0) capitaliza SIEMPRE los `meses` completos: postergar
  // los aportes no congela la plata que ya está en la cuenta. Solo la anualidad
  // de aportes se acorta.
  // La guarda es r !== 0 y no r > 0: con rentabilidad negativa la fórmula sigue
  // siendo válida (r > -1) y antes se trataba en silencio como 0%.
  const valorFuturo = (meses, mesesAporte = meses) => r !== 0
    ? S0 * Math.pow(1 + r, meses) + P * (Math.pow(1 + r, mesesAporte) - 1) / r
    : S0 + P * mesesAporte

  // Valor futuro empezando hoy
  const vfToday = valorFuturo(n)

  // Valor futuro empezando en 5 años (60 meses menos de aportes, mismo horizonte)
  const n2 = Math.max(0, n - 60)
  const vf5years = valorFuturo(n, n2)

  const totalContributed = P * n
  const difference = vfToday - vf5years

  // Bonificación Régimen A — orientativa. 15% del aporte anual, tope 6 UTM.
  // La UTM llega por parámetro (misma fuente que taxCalcCL.js) para que no quede
  // congelada acá; el default es solo el fallback offline.
  // ⚠ No modela el tope adicional del DL 3.500 (10× las cotizaciones obligatorias
  // del año), que sí aplica taxCalcCL.js/calcBeneficioAPV: el bono real puede ser menor.
  const annualContribution = P * 12
  const bonusRegimeA = Math.min(annualContribution * 0.15, 6 * utm)

  // Puntos de datos para gráfico (cada 5 años + la edad objetivo exacta, que con
  // paso de 5 se saltaba cuando el horizonte no era múltiplo de 5)
  const edades = []
  for (let age = currentAge; age <= targetAge; age += 5) edades.push(age)
  if (edades[edades.length - 1] !== targetAge) edades.push(targetAge)

  const chartPoints = edades.map(age => {
    const months = (age - currentAge) * 12
    return {
      age,
      today:    Math.round(valorFuturo(months)),
      in5years: Math.round(valorFuturo(months, Math.max(0, months - 60))),
    }
  })

  return {
    projectionToday: Math.round(vfToday),
    projection5years: Math.round(vf5years),
    difference: Math.round(difference),
    monthsLeft: n,
    totalContributed: Math.round(totalContributed),
    bonusRegimeA: Math.round(bonusRegimeA),
    chartPoints
  }
}
