// src/utils/goalSuggestions.js
// Sugerencias de metas financieras básicas — v1.4
// Basadas en principios financieros generales
// NO constituyen asesoría financiera certificada

/**
 * Definición de metas sugeridas
 * targetFn: función que calcula el objetivo según ingresos/gastos
 * contributionPct: % del ingreso neto mensual sugerido como aporte
 * priority: orden de importancia financiera
 */
export const GOAL_TEMPLATES = [
  {
    id: 'emergency_fund',
    emoji: '🛡️',
    name: 'Fondo de emergencia',
    description: '6 meses de gastos fijos — red de seguridad ante imprevistos',
    priority: 1,
    // 6 meses de gastos (o 6x ingreso neto si no hay gastos registrados)
    targetFn: ({ ingresoNeto, gastoMensual }) => {
      const base = gastoMensual > 0 ? gastoMensual : ingresoNeto
      return Math.round(base * 6)
    },
    contributionPct: 0.10,
    color: '#1a6b4a',
    goalPriority: 'Alta',
    hint: 'Recomendación estándar: 3-6 meses de gastos. Priorizá esta meta primero.',
  },
  {
    id: 'vacations',
    emoji: '✈️',
    name: 'Vacaciones anuales',
    description: 'Fondo para vacaciones familiares — 1 ingreso mensual como objetivo',
    priority: 2,
    targetFn: ({ ingresoNeto }) => Math.round(ingresoNeto * 1.5),
    contributionPct: 0.05,
    color: '#2563eb',
    goalPriority: 'Media',
    hint: 'Ahorrando el 5% mensual alcanzás el objetivo en ~18 meses.',
  },
  {
    id: 'year_end',
    emoji: '🎄',
    name: 'Fondo fiestas de fin de año',
    description: 'Navidad, regalos y celebraciones — evitar deudas en diciembre',
    priority: 3,
    targetFn: ({ ingresoNeto, gastoMensual }) => {
      const base = gastoMensual > 0 ? gastoMensual : ingresoNeto
      return Math.round(base * 0.5)
    },
    contributionPct: 0.04,
    color: '#d4982a',
    goalPriority: 'Media',
    hint: 'Pequeños aportes mensuales evitan el endeudamiento en fiestas.',
  },
  {
    id: 'education',
    emoji: '📚',
    name: 'Educación y desarrollo',
    description: 'Cursos, certificaciones o educación de hijos',
    priority: 4,
    targetFn: ({ ingresoNeto }) => Math.round(ingresoNeto * 0.5),
    contributionPct: 0.03,
    color: '#7c3aed',
    goalPriority: 'Media',
    hint: 'Invertir en educación genera el mayor retorno a largo plazo.',
  },
  {
    id: 'opportunity_fund',
    emoji: '💡',
    name: 'Colchón de oportunidades',
    description: 'Capital disponible para oportunidades de inversión o negocio',
    priority: 5,
    targetFn: ({ ingresoNeto }) => Math.round(ingresoNeto * 2),
    contributionPct: 0.03,
    color: '#0891b2',
    goalPriority: 'Baja',
    hint: 'Tener liquidez te permite aprovechar oportunidades sin endeudarte.',
  },
]

/**
 * Genera sugerencias de metas según los datos del usuario
 * @param {object} params
 * @param {number} params.ingresoNeto - ingreso neto mensual
 * @param {number} params.gastoMensual - gasto mensual promedio
 * @param {Array}  params.existingGoals - metas ya existentes
 * @returns {Array} sugerencias con montos calculados
 */
export function generateGoalSuggestions({ ingresoNeto, gastoMensual = 0, existingGoals = [] }) {
  if (!ingresoNeto || ingresoNeto <= 0) return []

  const existingNames = existingGoals.map(g =>
    (g.name || '').toLowerCase().trim()
  )

  return GOAL_TEMPLATES
    .map(template => {
      const target = template.targetFn({ ingresoNeto, gastoMensual })
      const monthlyContribution = Math.round(ingresoNeto * template.contributionPct)
      const monthsToGoal = monthlyContribution > 0
        ? Math.ceil(target / monthlyContribution)
        : null

      // Detectar si ya existe una meta similar
      const alreadyExists = existingNames.some(name =>
        name.includes(template.id.replace('_', ' ')) ||
        name.includes(template.name.toLowerCase().slice(0, 8))
      )

      return {
        ...template,
        target,
        monthlyContribution,
        monthsToGoal,
        alreadyExists,
        selected: !alreadyExists, // preseleccionada si no existe
      }
    })
}

/**
 * Calcula el total de aportes mensuales sugeridos
 */
export function totalMonthlyContribution(suggestions) {
  return suggestions
    .filter(s => s.selected && !s.alreadyExists)
    .reduce((sum, s) => sum + s.monthlyContribution, 0)
}
