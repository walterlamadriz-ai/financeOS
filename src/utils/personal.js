// src/utils/personal.js
// Marca de "inversión" en transacciones (ingresos/egresos).
// Un movimiento marcado como inversión (r.inv === true) representa flujo de un activo
// de inversión (ej. propiedad en arriendo, hipoteca de esa propiedad) y NO debe
// distorsionar el presupuesto ni la tasa de ahorro personal.

export const isInvestment = (r) => !!(r && r.inv)

// Devuelve solo los movimientos personales (excluye los marcados como inversión).
export const excludeInvestment = (arr) => (arr || []).filter((r) => !r?.inv)
