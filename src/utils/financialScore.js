// src/utils/financialScore.js
// Puntaje de salud financiera 0-100 basado en 5 componentes de 20 pts c/u
// Resultado es orientativo — no constituye asesoría financiera.

export function calcFinancialScore({ savingRate, budgets, expenses, debts, goals, subs, incomes, activeMonth }) {
  let score = 0
  const breakdown = []

  // 1. Tasa de ahorro (0-20)
  // 20pts = ≥20%, 10pts = 5-19%, 5pts = 0-4.9%, 0pts = negativa
  const sr = Number(savingRate) || 0
  const srPts = sr >= 0.20 ? 20 : sr >= 0.05 ? 10 : sr >= 0 ? 5 : 0
  score += srPts
  breakdown.push({ label: 'Tasa de ahorro', pts: srPts, max: 20 })

  // 2. Control de presupuestos (0-20)
  // 20pts = ningún presupuesto excedido, -4 por cada uno excedido
  const monthExp = Array.isArray(expenses) ? expenses.filter(e => e?.date?.startsWith(activeMonth)) : []
  const expByCat = {}
  monthExp.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + (Number(e.amount) || 0) })
  const budgetArr = Array.isArray(budgets) ? budgets : []
  const exceeded = budgetArr.filter(b => (expByCat[b.category] || 0) > (Number(b.limit) || 0)).length
  const budgetPts = Math.max(0, 20 - exceeded * 5)
  score += budgetPts
  breakdown.push({ label: 'Presupuestos', pts: budgetPts, max: 20 })

  // 3. Carga de deuda (0-20)
  // 20pts = sin deuda, 15pts = <20% ingreso anual, 10pts = 20-50%, 0pts = >50%
  const monthlyIncome = Array.isArray(incomes)
    ? incomes.filter(r => r?.date?.startsWith(activeMonth)).reduce((s, r) => s + (Number(r.amount) || 0), 0)
    : 0
  const annualIncome = monthlyIncome * 12
  const totalDebt = Array.isArray(debts) ? debts.reduce((s, d) => s + (Number(d.balance) || 0), 0) : 0
  const debtLoad = annualIncome > 0 ? totalDebt / annualIncome : (totalDebt > 0 ? 1 : 0)
  const debtPts = totalDebt === 0 ? 20 : debtLoad < 0.20 ? 15 : debtLoad < 0.50 ? 10 : 0
  score += debtPts
  breakdown.push({ label: 'Carga de deuda', pts: debtPts, max: 20 })

  // 4. Metas activas (0-20)
  // 20pts = ≥1 meta con progreso >0, 10pts = meta creada sin progreso, 0pts = sin metas
  const goalArr = Array.isArray(goals) ? goals : []
  const goalsWithProgress = goalArr.filter(g => Number(g.saved) > 0).length
  const goalPts = goalsWithProgress > 0 ? 20 : goalArr.length > 0 ? 10 : 0
  score += goalPts
  breakdown.push({ label: 'Metas', pts: goalPts, max: 20 })

  // 5. Control de suscripciones (0-20)
  // 20pts = <5% ingresos, 10pts = 5-10%, 5pts = 10-20%, 0pts = >20%
  const subsArr = Array.isArray(subs) ? subs : []
  const subMonthly = subsArr.filter(s => s?.status === 'active').reduce((s, sub) => {
    const amt = Number(sub.amount) || 0
    const freq = sub.frequency || 'monthly'
    if (freq === 'annual' || freq === 'anual') return s + amt / 12
    if (freq === 'quarterly') return s + amt / 3
    if (freq === 'weekly') return s + amt * 4.33
    return s + amt
  }, 0)
  const subRatio = monthlyIncome > 0 ? subMonthly / monthlyIncome : 0
  const subPts = subRatio < 0.05 ? 20 : subRatio < 0.10 ? 10 : subRatio < 0.20 ? 5 : 0
  score += subPts
  breakdown.push({ label: 'Suscripciones', pts: subPts, max: 20 })

  const label = score >= 80 ? 'Excelente' : score >= 60 ? 'Bueno' : score >= 40 ? 'Regular' : 'Crítico'
  const color = score >= 80 ? 'var(--accent)' : score >= 60 ? 'var(--grn2)' : score >= 40 ? 'var(--amb)' : 'var(--red)'

  return { score, label, color, breakdown }
}
