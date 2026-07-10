// src/utils/personal.js
// Marca de "inversión" en transacciones (ingresos/egresos).
// Un movimiento marcado como inversión (r.inv === true) representa flujo de un activo
// de inversión (ej. propiedad en arriendo, hipoteca de esa propiedad) y NO debe
// distorsionar el presupuesto ni la tasa de ahorro personal.

export const isInvestment = (r) => !!(r && r.inv)

// Devuelve solo los movimientos personales (excluye los marcados como inversión).
export const excludeInvestment = (arr) => (arr || []).filter((r) => !r?.inv)

// ── Deudas sin duplicar ────────────────────────────────────────────────────────
// Problema que resuelve: el "Disponible / tras deudas y subs" restaba SIEMPRE la
// suma de cuotas mínimas de TODAS las deudas, aunque:
//   (a) la deuda esté vinculada a una propiedad (d.project) — su cuota pertenece
//       al ámbito de inversión (ya reflejada en el flujo de Propiedades), no al
//       presupuesto personal; y/o
//   (b) el pago del mes ya se haya registrado como egreso (botón "Registrar pago"
//       crea un gasto con categoría 'Deudas') — restarlo otra vez lo duplicaba.

// Deudas del ámbito personal: excluye las vinculadas a una propiedad/proyecto.
export const personalDebts = (debts) => (debts || []).filter((d) => !(d?.project || '').trim())

// Cuota mensual de deuda personal AÚN NO reflejada como gasto del mes activo:
// suma de pagos mínimos (solo deudas personales) menos los pagos ya registrados
// este mes como egresos de categoría 'Deudas' (nunca negativo).
export function pendingDebtMonthly(debts, monthExpenses) {
  const minTotal = personalDebts(debts).reduce((s, d) => s + (Number(d.minPayment) || 0), 0)
  const paid = (monthExpenses || [])
    .filter((e) => e?.category === 'Deudas')
    .reduce((s, e) => s + (Number(e.amount) || 0), 0)
  return Math.max(0, minTotal - paid)
}
