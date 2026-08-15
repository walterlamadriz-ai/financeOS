// src/utils/taxCalcUS.js
// Roth vs Traditional decision helper + HSA optimizer — USA.
// Cifras 2026 confirmadas oficialmente: IRS Notice 2025-67 (retiro),
// Rev. Proc. 2025-32 (tramos/standard deduction), Rev. Proc. 2025-19 (HSA).
// NO constituye asesoría financiera ni fiscal.

export const LIMITES_2026 = {
  contribucion401k: 24500,
  catchUp401k50: 8000,
  catchUp401kSuper6063: 11250,
  contribucionIRA: 7500,
  catchUpIRA50: 1100, // primer ajuste inflacionario bajo SECURE 2.0 — verificar cada año
  hsaSelfOnly: 4400,
  hsaFamily: 8750,
  hsaCatchUp55: 1000, // fijo por ley, no indexado
}

// Tramos federales 2026 — Rev. Proc. 2025-32
const TRAMOS_SINGLE = [
  { hasta: 12400, tasa: 0.10 },
  { hasta: 50400, tasa: 0.12 },
  { hasta: 105700, tasa: 0.22 },
  { hasta: 201775, tasa: 0.24 },
  { hasta: 256225, tasa: 0.32 },
  { hasta: 640600, tasa: 0.35 },
  { hasta: Infinity, tasa: 0.37 },
]

const TRAMOS_MFJ = [
  { hasta: 24800, tasa: 0.10 },
  { hasta: 100800, tasa: 0.12 },
  { hasta: 211400, tasa: 0.22 },
  { hasta: 403550, tasa: 0.24 },
  { hasta: 512450, tasa: 0.32 },
  { hasta: 768700, tasa: 0.35 },
  { hasta: Infinity, tasa: 0.37 },
]

export const STANDARD_DEDUCTION_2026 = { single: 16100, mfj: 32200 }

export function tasaMarginal(taxableIncome, filingStatus = 'single') {
  const tabla = filingStatus === 'mfj' ? TRAMOS_MFJ : TRAMOS_SINGLE
  const income = Number(taxableIncome) || 0
  const tramo = tabla.find(t => income <= t.hasta) || tabla[tabla.length - 1]
  return tramo.tasa
}

// Compara aportar $X a Traditional (deducible hoy, se tributa al retirar) vs
// Roth (se tributa hoy, libre de impuesto al retirar) — mismo aporte nominal,
// mismo crecimiento asumido. La diferencia es puramente la tasa marginal hoy
// vs la tasa marginal esperada en el retiro.
export function compararRothTraditional({ aporte, tasaHoy, tasaRetiro, anios, retornoAnual }) {
  const a = Number(aporte) || 0
  const tHoy = Number(tasaHoy) || 0
  const tRet = Number(tasaRetiro) || 0
  const n = Number(anios) || 0
  const r = (Number(retornoAnual) || 0) / 100

  const crecimiento = Math.pow(1 + r, n)

  // Traditional: aportas el monto completo (pre-tax), crece, tributas al salir
  const traditionalBruto = a * crecimiento
  const traditionalNeto = traditionalBruto * (1 - tRet)

  // Roth: primero pagas impuesto sobre el aporte (con el mismo dinero pre-tax
  // "equivalente"), lo que realmente entra a la cuenta es menos, pero crece
  // libre de impuesto y sale libre de impuesto.
  const rothAportadoNeto = a * (1 - tHoy)
  const rothFinal = rothAportadoNeto * crecimiento

  const diferencia = traditionalNeto - rothFinal
  const convieneTraditional = diferencia > 0

  return {
    traditionalNeto: Math.round(traditionalNeto),
    rothFinal: Math.round(rothFinal),
    diferencia: Math.round(Math.abs(diferencia)),
    convieneTraditional,
  }
}

// HSA — triple ventaja: deducible al aportar, crece libre de impuesto, sale
// libre de impuesto si es gasto médico calificado. Estima el valor de
// maximizar vs. no usar HSA, asumiendo que se usa (no se malgasta) el saldo.
export function calcHSA({ coverage, aporteAnual, tasaMarginalHoy, anios, retornoAnual }) {
  const limite = coverage === 'family' ? LIMITES_2026.hsaFamily : LIMITES_2026.hsaSelfOnly
  const aporte = Math.min(Number(aporteAnual) || 0, limite)
  const t = Number(tasaMarginalHoy) || 0
  const n = Number(anios) || 0
  const r = (Number(retornoAnual) || 0) / 100

  const ahorroFiscalHoy = Math.round(aporte * t)
  const crecimiento = Math.pow(1 + r, n)
  const valorFuturo = Math.round(aporte * crecimiento)
  const faltaParaTope = Math.max(0, limite - aporte)

  return { limite, aporte, ahorroFiscalHoy, valorFuturo, faltaParaTope }
}
