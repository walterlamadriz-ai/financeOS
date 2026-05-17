// src/data/coachRules.js
// Motor de reglas del FinanceOS Coach
// Configurable sin tocar componentes React
// Cada regla: id, categoría, condición, severidad, mensaje, acción sugerida

export const COACH_CONFIG = {
  // Umbrales configurables
  thresholds: {
    savingsRateGood:        0.20,   // 20% ahorro = bueno
    savingsRateWarn:        0.10,   // 10% ahorro = atención
    subscriptionRatioWarn:  0.07,   // 7% suscripciones/ingreso = atención
    subscriptionRatioHigh:  0.12,   // 12% = warning
    budgetOverUsePct:       0.90,   // 90% del presupuesto usado = atención
    budgetExceededPct:      1.00,   // 100% = warning
    debtLoadWarn:           0.30,   // 30% deuda/ingreso anual = atención
    debtLoadHigh:           0.50,   // 50% = warning
    emergencyFundMonthsGood: 3,     // 3 meses = bueno
    emergencyFundMonthsWarn: 1,     // 1 mes = atención
    goalsProgressWarn:      0.25,   // menos del 25% en meta = atención
    backupDaysWarn:         14,     // sin backup en 14 días = atención
    backupDaysHigh:         30,     // sin backup en 30 días = warning
  },

  // Severidades disponibles: info | attention | warning
  severityColors: {
    info:       'var(--grn)',
    attention:  'var(--amb)',
    warning:    'var(--red)',
  },
}

// ── REGLAS ────────────────────────────────────────────────────────────────────
// Cada regla recibe `metrics` y retorna null si no aplica,
// o un objeto { id, category, severity, title, msg, action } si aplica

export const COACH_RULES = [

  // ── FLUJO DE CAJA ──────────────────────────────────────────────────────────
  {
    id: 'cashflow_positive',
    category: 'Flujo de caja',
    evaluate: (m) => m.cashFlow > 0 ? {
      severity: 'info',
      title: 'Flujo positivo este mes',
      msg: `Tu balance neto es positivo: ${m.sym}${fmt(m.cashFlow)}. Buen trabajo manteniendo ingresos por encima de gastos.`,
      action: 'Considerá destinar parte de este excedente a una meta de ahorro.',
    } : null,
  },
  {
    id: 'cashflow_negative',
    category: 'Flujo de caja',
    evaluate: (m) => m.cashFlow < 0 ? {
      severity: 'warning',
      title: 'Flujo negativo este mes',
      msg: `Tus gastos superaron tus ingresos en ${m.sym}${fmt(Math.abs(m.cashFlow))} este mes.`,
      action: 'Revisá en qué categorías de gastos hubo más movimiento este mes.',
    } : null,
  },
  {
    id: 'no_income',
    category: 'Flujo de caja',
    evaluate: (m) => m.monthlyIncome === 0 ? {
      severity: 'attention',
      title: 'Sin ingresos registrados',
      msg: 'No hay ingresos registrados para este mes. El análisis puede estar incompleto.',
      action: 'Registrá tus ingresos del mes para obtener métricas completas.',
    } : null,
  },

  // ── TASA DE AHORRO ─────────────────────────────────────────────────────────
  {
    id: 'savings_good',
    category: 'Ahorro',
    evaluate: (m) => m.monthlyIncome > 0 && m.savingsRate >= COACH_CONFIG.thresholds.savingsRateGood ? {
      severity: 'info',
      title: 'Tasa de ahorro saludable',
      msg: `Tu tasa de ahorro este mes es del ${pct(m.savingsRate)}, por encima del objetivo del ${pct(COACH_CONFIG.thresholds.savingsRateGood)}.`,
      action: 'Revisá si podés asignar parte del excedente a una meta específica.',
    } : null,
  },
  {
    id: 'savings_warn',
    category: 'Ahorro',
    evaluate: (m) => m.monthlyIncome > 0 && m.savingsRate >= 0 && m.savingsRate < COACH_CONFIG.thresholds.savingsRateWarn ? {
      severity: 'attention',
      title: 'Tasa de ahorro baja',
      msg: `Tu tasa de ahorro es del ${pct(m.savingsRate)}, por debajo del mínimo recomendado del ${pct(COACH_CONFIG.thresholds.savingsRateWarn)}.`,
      action: 'Evaluá si hay gastos variables que podrían reducirse este mes.',
    } : null,
  },
  {
    id: 'savings_negative',
    category: 'Ahorro',
    evaluate: (m) => m.monthlyIncome > 0 && m.savingsRate < 0 ? {
      severity: 'warning',
      title: 'Sin ahorro este mes',
      msg: `Los gastos superaron los ingresos. La tasa de ahorro es negativa (${pct(m.savingsRate)}).`,
      action: 'Revisá los gastos del mes por categoría para identificar oportunidades de ajuste.',
    } : null,
  },

  // ── SUSCRIPCIONES ──────────────────────────────────────────────────────────
  {
    id: 'subscriptions_high',
    category: 'Suscripciones',
    evaluate: (m) => m.subscriptionRatio >= COACH_CONFIG.thresholds.subscriptionRatioHigh ? {
      severity: 'warning',
      title: 'Alto gasto en suscripciones',
      msg: `Tus suscripciones representan el ${pct(m.subscriptionRatio)} de tus ingresos mensuales (${m.sym}${fmt(m.subscriptionMonthly)}/mes · ${m.sym}${fmt(m.subscriptionAnnual)}/año).`,
      action: 'Revisá la sección Suscripciones para identificar servicios que podrían evaluarse.',
    } : null,
  },
  {
    id: 'subscriptions_warn',
    category: 'Suscripciones',
    evaluate: (m) => m.subscriptionRatio >= COACH_CONFIG.thresholds.subscriptionRatioWarn && m.subscriptionRatio < COACH_CONFIG.thresholds.subscriptionRatioHigh ? {
      severity: 'attention',
      title: 'Suscripciones en zona de atención',
      msg: `Tus suscripciones representan el ${pct(m.subscriptionRatio)} de tus ingresos. Gasto anual estimado: ${m.sym}${fmt(m.subscriptionAnnual)}.`,
      action: 'Considerá revisar si todos los servicios activos se usan regularmente.',
    } : null,
  },
  {
    id: 'subscriptions_info',
    category: 'Suscripciones',
    evaluate: (m) => m.subscriptionCount > 0 && m.subscriptionRatio < COACH_CONFIG.thresholds.subscriptionRatioWarn ? {
      severity: 'info',
      title: 'Suscripciones bajo control',
      msg: `Tenés ${m.subscriptionCount} suscripción${m.subscriptionCount > 1 ? 'es' : ''} activa${m.subscriptionCount > 1 ? 's' : ''} (${m.sym}${fmt(m.subscriptionMonthly)}/mes · ${pct(m.subscriptionRatio)} del ingreso).`,
      action: null,
    } : null,
  },

  // ── PRESUPUESTOS ───────────────────────────────────────────────────────────
  {
    id: 'budget_exceeded',
    category: 'Presupuestos',
    evaluate: (m) => m.budgetsExceeded > 0 ? {
      severity: 'warning',
      title: `${m.budgetsExceeded} presupuesto${m.budgetsExceeded > 1 ? 's' : ''} excedido${m.budgetsExceeded > 1 ? 's' : ''}`,
      msg: `Superaste el límite en ${m.budgetsExceeded} categoría${m.budgetsExceeded > 1 ? 's' : ''} de presupuesto este mes.`,
      action: 'Revisá la sección Presupuestos para ver qué categorías se excedieron.',
    } : null,
  },
  {
    id: 'budget_near',
    category: 'Presupuestos',
    evaluate: (m) => m.budgetsNearLimit > 0 && m.budgetsExceeded === 0 ? {
      severity: 'attention',
      title: `${m.budgetsNearLimit} presupuesto${m.budgetsNearLimit > 1 ? 's' : ''} cerca del límite`,
      msg: `${m.budgetsNearLimit} categoría${m.budgetsNearLimit > 1 ? 's' : ''} está${m.budgetsNearLimit > 1 ? 'n' : ''} por encima del 90% del presupuesto asignado.`,
      action: 'Prestá atención a esas categorías antes de cerrar el mes.',
    } : null,
  },

  // ── DEUDAS ─────────────────────────────────────────────────────────────────
  {
    id: 'debt_high',
    category: 'Deudas',
    evaluate: (m) => m.monthlyIncome > 0 && m.debtLoad >= COACH_CONFIG.thresholds.debtLoadHigh ? {
      severity: 'warning',
      title: 'Carga de deuda elevada',
      msg: `Tu deuda total es de ${m.sym}${fmt(m.totalDebt)}, equivalente al ${pct(m.debtLoad)} de tus ingresos anuales estimados.`,
      action: 'Revisá la sección Deudas para ver qué deuda tiene mayor tasa de interés.',
    } : null,
  },
  {
    id: 'debt_warn',
    category: 'Deudas',
    evaluate: (m) => m.monthlyIncome > 0 && m.debtLoad >= COACH_CONFIG.thresholds.debtLoadWarn && m.debtLoad < COACH_CONFIG.thresholds.debtLoadHigh ? {
      severity: 'attention',
      title: 'Deuda en zona de atención',
      msg: `Tu deuda representa el ${pct(m.debtLoad)} de tus ingresos anuales estimados.`,
      action: 'Evaluá si los pagos mínimos están cubiertos en tu presupuesto mensual.',
    } : null,
  },

  // ── FONDO DE EMERGENCIA ────────────────────────────────────────────────────
  {
    id: 'emergency_fund_good',
    category: 'Fondo de emergencia',
    evaluate: (m) => m.emergencyFundMonths >= COACH_CONFIG.thresholds.emergencyFundMonthsGood ? {
      severity: 'info',
      title: 'Fondo de emergencia saludable',
      msg: `Tu fondo de emergencia cubre aproximadamente ${m.emergencyFundMonths.toFixed(1)} meses de gastos.`,
      action: null,
    } : null,
  },
  {
    id: 'emergency_fund_warn',
    category: 'Fondo de emergencia',
    evaluate: (m) => m.emergencyFundMonths > 0 && m.emergencyFundMonths < COACH_CONFIG.thresholds.emergencyFundMonthsGood ? {
      severity: 'attention',
      title: 'Fondo de emergencia insuficiente',
      msg: `Tu fondo de emergencia cubre ${m.emergencyFundMonths.toFixed(1)} mes${m.emergencyFundMonths < 2 ? '' : 'es'} de gastos. Lo recomendado es al menos 3 meses.`,
      action: 'Considerá asignar parte del ahorro mensual a una meta de fondo de emergencia.',
    } : null,
  },
  {
    id: 'emergency_fund_none',
    category: 'Fondo de emergencia',
    evaluate: (m) => m.emergencyFundMonths === 0 && m.monthlyExpense > 0 ? {
      severity: 'warning',
      title: 'Sin fondo de emergencia identificado',
      msg: 'No se detectó una meta de fondo de emergencia. Tener 3 meses de gastos reservados es una base financiera importante.',
      action: 'Creá una meta específica llamada "Fondo de emergencia" en la sección Metas.',
    } : null,
  },

  // ── METAS ──────────────────────────────────────────────────────────────────
  {
    id: 'goals_progress_warn',
    category: 'Metas',
    evaluate: (m) => m.goalsStalled > 0 ? {
      severity: 'attention',
      title: `${m.goalsStalled} meta${m.goalsStalled > 1 ? 's' : ''} con poco avance`,
      msg: `${m.goalsStalled} meta${m.goalsStalled > 1 ? 's' : ''} tiene${m.goalsStalled > 1 ? 'n' : ''} menos del 25% de progreso.`,
      action: 'Revisá la sección Metas para ver las fechas objetivo y ajustar el plan de ahorro.',
    } : null,
  },
  {
    id: 'goals_good',
    category: 'Metas',
    evaluate: (m) => m.goalsOnTrack > 0 && m.goalsStalled === 0 ? {
      severity: 'info',
      title: 'Metas en progreso',
      msg: `Tenés ${m.goalsOnTrack} meta${m.goalsOnTrack > 1 ? 's' : ''} activa${m.goalsOnTrack > 1 ? 's' : ''} con avance positivo.`,
      action: null,
    } : null,
  },

  // ── BACKUP ─────────────────────────────────────────────────────────────────
  {
    id: 'backup_warn',
    category: 'Respaldo',
    evaluate: (m) => m.daysSinceBackup >= COACH_CONFIG.thresholds.backupDaysWarn && m.daysSinceBackup < COACH_CONFIG.thresholds.backupDaysHigh ? {
      severity: 'attention',
      title: 'Backup pendiente',
      msg: `Hace ${m.daysSinceBackup} días que no creás un respaldo de tus datos.`,
      action: 'Exportá un backup JSON desde Ajustes antes de cerrar el mes.',
    } : null,
  },
  {
    id: 'backup_high',
    category: 'Respaldo',
    evaluate: (m) => m.daysSinceBackup >= COACH_CONFIG.thresholds.backupDaysHigh ? {
      severity: 'warning',
      title: 'Backup muy desactualizado',
      msg: `Hace ${m.daysSinceBackup} días sin respaldo. Si perdés el navegador o cambiás de dispositivo, podrías perder todos tus datos.`,
      action: 'Creá un backup JSON desde Ajustes ahora mismo.',
    } : null,
  },
  {
    id: 'backup_ok',
    category: 'Respaldo',
    evaluate: (m) => m.daysSinceBackup >= 0 && m.daysSinceBackup < COACH_CONFIG.thresholds.backupDaysWarn ? {
      severity: 'info',
      title: 'Respaldo al día',
      msg: `Tu último backup fue hace ${m.daysSinceBackup} días.`,
      action: null,
    } : null,
  },
]

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmt(n) { return (n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 }) }
function pct(n) { return ((n || 0) * 100).toFixed(1) + '%' }

// ── EVALUADOR DE REGLAS ───────────────────────────────────────────────────────
export function evaluateCoach(metrics) {
  const results = []
  for (const rule of COACH_RULES) {
    try {
      const result = rule.evaluate(metrics)
      if (result) {
        results.push({ id: rule.id, category: rule.category, ...result })
      }
    } catch (e) {
      console.warn(`Coach rule ${rule.id} error:`, e)
    }
  }
  // Ordenar: warning primero, luego attention, luego info
  const order = { warning: 0, attention: 1, info: 2 }
  return results.sort((a, b) => (order[a.severity] || 2) - (order[b.severity] || 2))
}

// ── CALCULADOR DE MÉTRICAS PARA EL COACH ─────────────────────────────────────
export function calcCoachMetrics({ incomes, expenses, budgets, debts, goals, subs, settings }) {
  const activeMonth = settings?.activeMonth || new Date().toISOString().slice(0, 7)
  const sym = { CLP: '$', USD: 'US$', EUR: '€', VES: 'Bs.', MXN: '$', ARS: '$', COP: '$' }[settings?.currency] || '$'

  // Ingresos y gastos del mes activo
  const monthlyIncome  = incomes.filter(r => r.date?.startsWith(activeMonth)).reduce((s, r) => s + (r.amount || 0), 0)
  const monthlyExpense = expenses.filter(r => r.date?.startsWith(activeMonth)).reduce((s, r) => s + (r.amount || 0), 0)
  const cashFlow       = monthlyIncome - monthlyExpense
  const savingsRate    = monthlyIncome > 0 ? cashFlow / monthlyIncome : 0

  // Suscripciones
  const activeSubs = (subs || []).filter(s => s.status === 'active')
  const toMonthly = (amount, freq) => {
    const a = parseFloat(amount) || 0
    return freq === 'weekly' ? a * 4.33 : freq === 'quarterly' ? a / 3 : freq === 'annual' ? a / 12 : a
  }
  const toAnnual = (amount, freq) => {
    const a = parseFloat(amount) || 0
    return freq === 'weekly' ? a * 52 : freq === 'quarterly' ? a * 4 : freq === 'annual' ? a : a * 12
  }
  const subscriptionMonthly = activeSubs.reduce((s, sub) => s + toMonthly(sub.amount, sub.frequency), 0)
  const subscriptionAnnual  = activeSubs.reduce((s, sub) => s + toAnnual(sub.amount, sub.frequency), 0)
  const subscriptionRatio   = monthlyIncome > 0 ? subscriptionMonthly / monthlyIncome : 0
  const subscriptionCount   = activeSubs.length

  // Presupuestos
  const expByCat = {}
  expenses.filter(r => r.date?.startsWith(activeMonth)).forEach(e => {
    expByCat[e.category] = (expByCat[e.category] || 0) + e.amount
  })
  const budgetsExceeded  = budgets.filter(b => (expByCat[b.category] || 0) >= b.limit * COACH_CONFIG.thresholds.budgetExceededPct).length
  const budgetsNearLimit = budgets.filter(b => {
    const used = (expByCat[b.category] || 0) / b.limit
    return used >= COACH_CONFIG.thresholds.budgetOverUsePct && used < COACH_CONFIG.thresholds.budgetExceededPct
  }).length

  // Deudas
  const totalDebt = debts.reduce((s, d) => s + (d.balance || 0), 0)
  const annualIncome = monthlyIncome * 12
  const debtLoad = annualIncome > 0 ? totalDebt / annualIncome : 0

  // Fondo de emergencia
  const emergencyGoal = goals.find(g =>
    g.name?.toLowerCase().includes('emergencia') ||
    g.name?.toLowerCase().includes('emergency') ||
    g.name?.toLowerCase().includes('fondo')
  )
  const emergencyFundMonths = emergencyGoal && monthlyExpense > 0
    ? (emergencyGoal.saved || 0) / monthlyExpense
    : 0

  // Metas
  const goalsStalled  = goals.filter(g => g.target > 0 && (g.saved || 0) / g.target < COACH_CONFIG.thresholds.goalsProgressWarn).length
  const goalsOnTrack  = goals.filter(g => g.target > 0 && (g.saved || 0) / g.target >= COACH_CONFIG.thresholds.goalsProgressWarn).length

  // Backup
  let daysSinceBackup = 999
  try {
    const lastBackup = localStorage.getItem('fos_last_backup')
    if (lastBackup) {
      daysSinceBackup = Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000)
    }
  } catch {}

  return {
    sym, activeMonth,
    monthlyIncome, monthlyExpense, cashFlow, savingsRate,
    subscriptionMonthly, subscriptionAnnual, subscriptionRatio, subscriptionCount,
    budgetsExceeded, budgetsNearLimit,
    totalDebt, debtLoad,
    emergencyFundMonths,
    goalsStalled, goalsOnTrack,
    daysSinceBackup,
  }
}
