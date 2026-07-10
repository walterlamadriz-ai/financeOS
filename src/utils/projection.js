// src/utils/projection.js
// Proyección de fin de mes — cálculo ÚNICO compartido por el Dashboard y la
// página Proyección (CashFlow) para que ambos muestren exactamente lo mismo.
//
// Ingreso: el salario NO es un flujo diario → no se extrapola por ritmo.
//   projInc = max(lo ya recibido, promedio de hasta 3 meses completos previos).
// Gasto: mezcla entre el ritmo diario actual y el promedio histórico,
//   ponderada por % del mes transcurrido (a inicio de mes pesa el histórico;
//   a fin de mes, el gasto real). Evita extrapolar cuotas mensuales pagadas
//   temprano como si fueran gasto diario.

export function projectEndOfMonth({ incomes, expenses, activeMonth }) {
  const now = new Date()
  const [y, mo] = activeMonth.split('-').map(Number)
  const daysInMonth = new Date(y, mo, 0).getDate()
  const today = (now.getFullYear() === y && now.getMonth() + 1 === mo) ? now.getDate() : daysInMonth
  const daysLeft = daysInMonth - today
  const pctElapsed = daysInMonth > 0 ? today / daysInMonth : 1

  const sumMonth = (arr, m) => (arr || []).filter(r => r?.date?.startsWith(m)).reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const curInc = sumMonth(incomes, activeMonth)
  const curExp = sumMonth(expenses, activeMonth)

  // Promedios de hasta 3 meses completos anteriores al mes en curso.
  // IMPORTANTE: cada promedio usa SOLO meses que tienen datos de ese tipo —
  // un mes con ingresos pero sin gastos registrados NO diluye el promedio de
  // gastos (típico al empezar a usar la app), y viceversa.
  const nowMonth = new Date().toISOString().slice(0, 7)
  const monthsOf = (arr) => [...new Set((arr || []).map(r => r?.date?.slice(0, 7)).filter(Boolean))].sort()
  const completeOrAll = (ms) => { const prev = ms.filter(m => m < nowMonth); return (prev.length ? prev : ms).slice(-3) }
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0
  const incMonths = completeOrAll(monthsOf(incomes))
  const expMonths = completeOrAll(monthsOf(expenses))
  const avgInc = avg(incMonths.map(m => sumMonth(incomes, m)))
  const avgExp = avg(expMonths.map(m => sumMonth(expenses, m)))
  const avgExpMonths = expMonths.filter(m => m < nowMonth).length

  const dailyExp = today > 0 ? curExp / today : 0
  const paceExp  = curExp + dailyExp * daysLeft
  const blended  = avgExp > 0 ? Math.round(pctElapsed * paceExp + (1 - pctElapsed) * avgExp) : Math.round(paceExp)
  // Piso lógico: la proyección nunca puede ser menor que lo YA gastado
  // (si este mes vas por encima de tu histórico, la mezcla no debe "descontar" gasto real).
  const projExp  = Math.max(blended, Math.round(curExp))
  const projInc  = Math.max(curInc, avgInc || curInc)
  const projBal  = projInc - projExp

  return { today, daysInMonth, daysLeft, pctElapsed, dailyExp, curInc, curExp, avgInc, avgExp, avgExpMonths, projInc, projExp, projBal }
}
