// src/utils/budgets.js
// Cálculo ÚNICO del límite efectivo de presupuesto por categoría, honrando el
// rollover opt-in (settings.budgetRollover). Compartido por la página
// Presupuestos, el diagnóstico (coachRules), el score y el Modo Asesor, para
// que "presupuesto excedido" signifique lo mismo en todas partes.
//
// Rollover: lo NO gastado el mes anterior (acotado a [0, limit]) se suma al
// límite base del mes actual.

function prevMonthOf(activeMonth) {
  const [y, m] = String(activeMonth).split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

// Devuelve { [categoria]: limiteEfectivo }. Con rollover OFF = límite base.
export function effectiveBudgetLimits({ budgets, expenses, activeMonth, settings }) {
  const out = {}
  const rolloverOn = !!settings?.budgetRollover
  const bs = Array.isArray(budgets) ? budgets : []

  if (!rolloverOn) {
    bs.forEach(b => { out[b.category] = Number(b.limit) || 0 })
    return out
  }

  const prev = prevMonthOf(activeMonth)
  const prevByCat = {}
  ;(expenses || []).forEach(e => {
    if (e?.date?.startsWith(prev) && !e?.inv) {
      prevByCat[e.category] = (prevByCat[e.category] || 0) + (Number(e.amount) || 0)
    }
  })
  bs.forEach(b => {
    const limit = Number(b.limit) || 0
    const prevSpent = prevByCat[b.category] || 0
    const carry = Math.max(0, Math.min(limit - prevSpent, limit))
    out[b.category] = limit + carry
  })
  return out
}

// Cuenta cuántas categorías superaron su límite EFECTIVO este mes (excluye
// gastos de inversión 💼, coherente con el presupuesto personal).
export function countBudgetsExceeded({ budgets, expenses, activeMonth, settings }) {
  const limits = effectiveBudgetLimits({ budgets, expenses, activeMonth, settings })
  const spent = {}
  ;(expenses || []).forEach(e => {
    if (e?.date?.startsWith(activeMonth) && !e?.inv) {
      spent[e.category] = (spent[e.category] || 0) + (Number(e.amount) || 0)
    }
  })
  return (Array.isArray(budgets) ? budgets : []).filter(
    b => (spent[b.category] || 0) > (limits[b.category] || 0)
  ).length
}
