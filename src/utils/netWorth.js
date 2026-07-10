// src/utils/netWorth.js
// Cálculo único de Patrimonio neto (stock, a HOY — no depende del mes activo).
// Usado por la página Patrimonio y por el resumen en Reportes/PDF para que
// nunca diverjan.
//   Activos = ahorro en Metas + valor declarado de propiedades
//           + flujo neto positivo de propiedades SIN valor declarado
//   Pasivos = saldos de Deudas + flujo neto negativo de propiedades sin valor
// (las propiedades con valor declarado entran por valor, no por flujo — sin doble conteo)

export function calcNetWorth({ goals, debts, incomes, expenses, settings }) {
  const savedInGoals = (goals || []).reduce((s, g) => s + (Number(g.saved) || 0), 0)
  const pendingDebt  = (debts || []).reduce((s, d) => s + (Number(d.balance) || 0), 0)

  const propertyValues = settings?.propertyValues || {}
  const propsValueTotal = Object.values(propertyValues).reduce((s, v) => s + (Number(v) || 0), 0)
  const valuedNames = new Set(
    Object.keys(propertyValues).filter(k => Number(propertyValues[k]) > 0).map(k => k.trim().toLowerCase())
  )

  const map = {}
  const push = (r, kind) => {
    const key = (r?.project || '').trim()
    if (!key) return
    if (valuedNames.has(key.toLowerCase())) return
    const amt = Number(r.amount) || 0
    map[key] = (map[key] || 0) + (kind === 'inc' ? amt : -amt)
  }
  ;(incomes || []).forEach(r => push(r, 'inc'))
  ;(expenses || []).forEach(r => push(r, 'exp'))
  const propertiesNet = Object.values(map).reduce((s, n) => s + n, 0)

  const totalActivos = savedInGoals + propsValueTotal + Math.max(0, propertiesNet)
  const totalPasivos = pendingDebt + Math.max(0, -propertiesNet)
  return {
    savedInGoals, propsValueTotal, propertiesNet, pendingDebt,
    totalActivos, totalPasivos,
    netWorth: totalActivos - totalPasivos,
    hasData: (goals?.length || 0) > 0 || (debts?.length || 0) > 0 || propertiesNet !== 0 || propsValueTotal > 0,
  }
}
