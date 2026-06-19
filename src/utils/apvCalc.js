// src/utils/apvCalc.js
// Simulador APV Chile — cálculo orientativo de acumulación
// NO constituye asesoría financiera, tributaria ni previsional
// v1.3 — sin APIs externas, funciona offline, todo en CLP nominal

/**
 * Calcula proyección APV con interés compuesto mensual
 * @param {Object} params
 * @param {number} params.currentBalance    - Saldo APV actual (CLP, default 0)
 * @param {number} params.monthlyContribution - Aporte mensual (CLP)
 * @param {number} params.currentAge        - Edad actual (años)
 * @param {number} params.targetAge         - Edad objetivo jubilación (años)
 * @param {number} params.expectedReturn    - Rentabilidad anual esperada (%, default 5)
 * @returns {Object} Proyecciones orientativas
 */
export function calcAPV({
  currentBalance = 0,
  monthlyContribution,
  currentAge,
  targetAge,
  expectedReturn = 5
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

  // Valor futuro empezando hoy
  const vfToday = r > 0
    ? S0 * Math.pow(1 + r, n) + P * (Math.pow(1 + r, n) - 1) / r
    : S0 + P * n

  // Valor futuro empezando en 5 años
  const n2 = Math.max(0, n - 60)
  const vf5years = r > 0
    ? S0 * Math.pow(1 + r, n2) + P * (Math.pow(1 + r, n2) - 1) / r
    : S0 + P * n2

  const totalContributed = P * n
  const difference = vfToday - vf5years

  // Bonificación Régimen A — orientativa
  // 15% del aporte anual (tope informativo ~6 UTM/año ≈ $417.252 CLP, UTM vigente $69.542)
  const annualContribution = P * 12
  const bonusRegimeA = Math.min(annualContribution * 0.15, 6 * 69542)

  // Puntos de datos para gráfico (cada 5 años)
  const chartPoints = []
  for (let age = currentAge; age <= targetAge; age += 5) {
    const months = (age - currentAge) * 12
    const vf = r > 0
      ? S0 * Math.pow(1 + r, months) + P * (Math.pow(1 + r, months) - 1) / r
      : S0 + P * months
    const vf5 = r > 0
      ? S0 * Math.pow(1 + r, Math.max(0, months - 60)) + P * (Math.pow(1 + r, Math.max(0, months - 60)) - 1) / r
      : S0 + P * Math.max(0, months - 60)
    chartPoints.push({ age, today: Math.round(vf), in5years: Math.round(vf5) })
  }

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
