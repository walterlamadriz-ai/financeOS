// src/demo/demoData.js
// Datos ficticios para el modo demo de FinanceOS
// Perfil: Carlos Mendoza — Profesional independiente, 34 años
// 3 meses de datos (mes actual y 2 anteriores)
// IMPORTANTE: estos datos nunca se escriben en IndexedDB

// Genera IDs fijos para el demo (no aleatorios — para consistencia)
const d = (suffix) => `demo-${suffix}`

// Fechas siempre relativas al mes actual
const now = new Date()
const y0  = now.getFullYear()
const m0  = now.getMonth() + 1                              // mes actual (1-12)
const y1  = m0 === 1  ? y0 - 1 : y0
const m1  = m0 === 1  ? 12 : m0 - 1                       // mes anterior
const y2  = m1 === 1  ? y1 - 1 : y1
const m2  = m1 === 1  ? 12 : m1 - 1                       // hace 2 meses
const y3  = m2 === 1  ? y2 - 1 : y2
const m3  = m2 === 1  ? 12 : m2 - 1                       // hace 3 meses
const y4  = m3 === 1  ? y3 - 1 : y3
const m4  = m3 === 1  ? 12 : m3 - 1                       // hace 4 meses
const y5  = m4 === 1  ? y4 - 1 : y4
const m5  = m4 === 1  ? 12 : m4 - 1                       // hace 5 meses
const pad = (n) => String(n).padStart(2, '0')
const M0  = `${y0}-${pad(m0)}`                             // p.ej. "2026-06"
const M1  = `${y1}-${pad(m1)}`
const M2  = `${y2}-${pad(m2)}`
const M3  = `${y3}-${pad(m3)}`
const M4  = `${y4}-${pad(m4)}`
const M5  = `${y5}-${pad(m5)}`
const day = (ym, d) => `${ym}-${pad(d)}`

export const DEMO_SETTINGS = {
  currency: 'USD',
  theme: 'light',
  language: 'es',
  savingGoalPct: 20,
  onboardingDone: true,
  activeMonth: M0,
  isDemo: true,
}

export const DEMO_INCOMES = [
  // Mes actual
  { id: d('i1'),  date: day(M0,  1), source: 'Salario neto',                amount: 4_800, category: 'Salario',   recurrence: 'Mensual', notes: '' },
  { id: d('i2'),  date: day(M0, 10), source: 'Proyecto freelance — diseño', amount:   650, category: 'Freelance', recurrence: 'Único',   notes: '' },
  { id: d('i3'),  date: day(M0, 18), source: 'Venta curso online',          amount:   320, category: 'Freelance', recurrence: 'Único',   notes: '' },
  // Mes anterior
  { id: d('i4'),  date: day(M1,  1), source: 'Salario neto',                amount: 4_800, category: 'Salario',   recurrence: 'Mensual', notes: '' },
  { id: d('i5'),  date: day(M1, 14), source: 'Consultoría — cliente B',     amount:   800, category: 'Freelance', recurrence: 'Único',   notes: '' },
  { id: d('i6'),  date: day(M1, 25), source: 'Dividendo ETF',               amount:    95, category: 'Inversión', recurrence: 'Único',   notes: '' },
  // Hace 2 meses
  { id: d('i7'),  date: day(M2,  1), source: 'Salario neto',                amount: 4_800, category: 'Salario',   recurrence: 'Mensual', notes: '' },
  { id: d('i8'),  date: day(M2,  8), source: 'Proyecto freelance — web',    amount:   550, category: 'Freelance', recurrence: 'Único',   notes: '' },
  { id: d('i9'),  date: day(M2, 22), source: 'Bono trimestral',             amount:   400, category: 'Bono',      recurrence: 'Único',   notes: '' },
  // Hace 3 meses
  { id: d('i10'), date: day(M3,  1), source: 'Salario neto',                amount: 4_800, category: 'Salario',   recurrence: 'Mensual', notes: '' },
  { id: d('i11'), date: day(M3, 20), source: 'Proyecto freelance — app',    amount:   720, category: 'Freelance', recurrence: 'Único',   notes: '' },
  // Hace 4 meses
  { id: d('i12'), date: day(M4,  1), source: 'Salario neto',                amount: 4_600, category: 'Salario',   recurrence: 'Mensual', notes: '' },
  { id: d('i13'), date: day(M4, 15), source: 'Consultoría puntual',         amount:   380, category: 'Freelance', recurrence: 'Único',   notes: '' },
  // Hace 5 meses
  { id: d('i14'), date: day(M5,  1), source: 'Salario neto',                amount: 4_600, category: 'Salario',   recurrence: 'Mensual', notes: '' },
  { id: d('i15'), date: day(M5, 10), source: 'Venta equipos usados',        amount:   250, category: 'Otros',     recurrence: 'Único',   notes: '' },
]

export const DEMO_EXPENSES = [
  // Mes actual — Necesidades
  { id: d('e1'),  date: day(M0,  1), description: 'Renta apartamento',       amount: 1_350, category: 'Vivienda',        method: 'Transferencia', type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e2'),  date: day(M0,  2), description: 'Electricidad + internet', amount:   120, category: 'Servicios',       method: 'Débito',        type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e3'),  date: day(M0,  3), description: 'Supermercado semana 1',   amount:   210, category: 'Alimentación',    method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e4'),  date: day(M0,  5), description: 'Gasolina',                amount:    75, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e5'),  date: day(M0,  7), description: 'Farmacia',                amount:    32, category: 'Salud',           method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e6'),  date: day(M0, 12), description: 'Supermercado semana 2',   amount:   185, category: 'Alimentación',    method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e7'),  date: day(M0, 14), description: 'Gasolina semana 2',       amount:    68, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  // Mes actual — Deseos
  { id: d('e8'),  date: day(M0,  4), description: 'Netflix',                 amount:    18, category: 'Entretenimiento', method: 'Crédito',       type: 'Deseo',     recurrence: 'Mensual', notes: '' },
  { id: d('e9'),  date: day(M0,  4), description: 'Spotify',                 amount:    11, category: 'Entretenimiento', method: 'Crédito',       type: 'Deseo',     recurrence: 'Mensual', notes: '' },
  { id: d('e10'), date: day(M0,  8), description: 'Almuerzo de trabajo',     amount:    45, category: 'Alimentación',    method: 'Crédito',       type: 'Deseo',     recurrence: 'Único',   notes: 'Deducible' },
  { id: d('e11'), date: day(M0, 11), description: 'Ropa',                    amount:    95, category: 'Ropa',            method: 'Crédito',       type: 'Deseo',     recurrence: 'Único',   notes: '' },
  { id: d('e12'), date: day(M0, 16), description: 'Cine + cena',             amount:    55, category: 'Entretenimiento', method: 'Débito',        type: 'Deseo',     recurrence: 'Único',   notes: '' },
  { id: d('e13'), date: day(M0, 18), description: 'Curso online',            amount:    29, category: 'Educación',       method: 'Crédito',       type: 'Deseo',     recurrence: 'Único',   notes: 'Finanzas personales' },
  // Mes anterior
  { id: d('e14'), date: day(M1,  1), description: 'Renta apartamento',       amount: 1_350, category: 'Vivienda',        method: 'Transferencia', type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e15'), date: day(M1,  3), description: 'Supermercado',            amount:   390, category: 'Alimentación',    method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e16'), date: day(M1,  5), description: 'Gasolina',                amount:   140, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e17'), date: day(M1, 10), description: 'Streaming x3',            amount:    39, category: 'Entretenimiento', method: 'Crédito',       type: 'Deseo',     recurrence: 'Mensual', notes: '' },
  { id: d('e18'), date: day(M1, 15), description: 'Servicios hogar',         amount:   112, category: 'Servicios',       method: 'Débito',        type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e19'), date: day(M1, 20), description: 'Reparación auto',         amount:   280, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: 'Imprevisto' },
  { id: d('e20'), date: day(M1, 25), description: 'Salida fin de semana',    amount:    72, category: 'Entretenimiento', method: 'Débito',        type: 'Deseo',     recurrence: 'Único',   notes: '' },
  // Hace 2 meses
  { id: d('e21'), date: day(M2,  1), description: 'Renta apartamento',       amount: 1_350, category: 'Vivienda',        method: 'Transferencia', type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e22'), date: day(M2,  5), description: 'Supermercado',            amount:   410, category: 'Alimentación',    method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e23'), date: day(M2,  8), description: 'Gasolina',                amount:   130, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e24'), date: day(M2, 12), description: 'Servicios hogar',         amount:   108, category: 'Servicios',       method: 'Débito',        type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e25'), date: day(M2, 15), description: 'Streaming x3',            amount:    39, category: 'Entretenimiento', method: 'Crédito',       type: 'Deseo',     recurrence: 'Mensual', notes: '' },
  { id: d('e26'), date: day(M2, 22), description: 'Dentista',                amount:   145, category: 'Salud',           method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  // Hace 3 meses
  { id: d('e27'), date: day(M3,  1), description: 'Renta apartamento',       amount: 1_350, category: 'Vivienda',        method: 'Transferencia', type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e28'), date: day(M3,  4), description: 'Supermercado',            amount:   370, category: 'Alimentación',    method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e29'), date: day(M3,  7), description: 'Gasolina',                amount:   120, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e30'), date: day(M3, 10), description: 'Servicios hogar',         amount:   110, category: 'Servicios',       method: 'Débito',        type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e31'), date: day(M3, 14), description: 'Streaming x3',            amount:    39, category: 'Entretenimiento', method: 'Crédito',       type: 'Deseo',     recurrence: 'Mensual', notes: '' },
  { id: d('e32'), date: day(M3, 20), description: 'Ropa de temporada',       amount:   185, category: 'Ropa',            method: 'Crédito',       type: 'Deseo',     recurrence: 'Único',   notes: '' },
  // Hace 4 meses
  { id: d('e33'), date: day(M4,  1), description: 'Renta apartamento',       amount: 1_350, category: 'Vivienda',        method: 'Transferencia', type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e34'), date: day(M4,  4), description: 'Supermercado',            amount:   360, category: 'Alimentación',    method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e35'), date: day(M4,  6), description: 'Gasolina',                amount:   115, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e36'), date: day(M4, 10), description: 'Servicios hogar',         amount:   105, category: 'Servicios',       method: 'Débito',        type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e37'), date: day(M4, 13), description: 'Streaming x3',            amount:    39, category: 'Entretenimiento', method: 'Crédito',       type: 'Deseo',     recurrence: 'Mensual', notes: '' },
  // Hace 5 meses
  { id: d('e38'), date: day(M5,  1), description: 'Renta apartamento',       amount: 1_350, category: 'Vivienda',        method: 'Transferencia', type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e39'), date: day(M5,  4), description: 'Supermercado',            amount:   340, category: 'Alimentación',    method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e40'), date: day(M5,  7), description: 'Gasolina',                amount:   108, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
  { id: d('e41'), date: day(M5, 12), description: 'Servicios hogar',         amount:   102, category: 'Servicios',       method: 'Débito',        type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: d('e42'), date: day(M5, 14), description: 'Streaming x3',            amount:    39, category: 'Entretenimiento', method: 'Crédito',       type: 'Deseo',     recurrence: 'Mensual', notes: '' },
  { id: d('e43'), date: day(M5, 25), description: 'Vacuna anual + consulta', amount:    85, category: 'Salud',           method: 'Débito',        type: 'Necesidad', recurrence: 'Único',   notes: '' },
]

export const DEMO_BUDGETS = [
  { id: d('b1'), category: 'Vivienda',        limit: 1_400 },
  { id: d('b2'), category: 'Alimentación',    limit:   650 },
  { id: d('b3'), category: 'Transporte',      limit:   200 },
  { id: d('b4'), category: 'Entretenimiento', limit:   150 },
  { id: d('b5'), category: 'Salud',           limit:   120 },
  { id: d('b6'), category: 'Servicios',       limit:   200 },
  { id: d('b7'), category: 'Educación',       limit:    80 },
]

// Fecha de vencimiento dinámica: próximo mes, día fijo
const nextMonthDate = (day) => {
  const d1 = new Date(y0, m0, day) // m0 es ya 1-based, new Date usa 0-based para mes siguiente
  return `${d1.getFullYear()}-${pad(d1.getMonth() + 1)}-${pad(d1.getDate())}`
}
const nextYearDate = (month, day) => `${y0 + 1}-${pad(month)}-${pad(day)}`

export const DEMO_DEBTS = [
  { id: d('d1'), creditor: 'Tarjeta de crédito Visa', initial: 4_800, balance: 3_150, minPayment: 235, dueDate: nextMonthDate(15), rate: 19.9, notes: 'Consolidar en cuota fija' },
  { id: d('d2'), creditor: 'Préstamo personal Chase',  initial: 15_000, balance: 9_800, minPayment: 420, dueDate: nextMonthDate(5),  rate: 12.5, notes: 'Préstamo a 36 meses' },
  { id: d('d3'), creditor: 'Préstamo familiar',        initial: 3_000,  balance: 1_800, minPayment: 150, dueDate: nextYearDate(12, 31), rate: 0, notes: 'Sin intereses' },
]

export const DEMO_GOALS = [
  { id: d('g1'), name: 'Fondo de emergencia (6 meses)', target: 34_800, saved: 18_500, targetDate: nextYearDate(12, 31), priority: 'Alta',  color: '#d4982a', notes: '~3 meses cubiertos' },
  { id: d('g2'), name: 'Viaje a Europa en verano',      target:  6_500, saved:  2_200, targetDate: nextYearDate(7, 15),  priority: 'Media', color: '#1a6b4a', notes: 'Vuelos + 10 noches hotel' },
  { id: d('g3'), name: 'Certificación en finanzas',     target:  1_800, saved:  1_800, targetDate: day(M1, 28),          priority: 'Alta',  color: '#4a9ad4', notes: '✓ Meta alcanzada' },
  { id: d('g4'), name: 'Enganche casa propia',          target: 60_000, saved:  8_500, targetDate: nextYearDate(12, 31), priority: 'Alta',  color: '#7f77dd', notes: '10% + gastos de cierre' },
]

// ── DEMO SUBSCRIPTIONS ─────────────────────────────────────────────────────────
export const DEMO_SUBSCRIPTIONS = [
  { id: 'sub1', name: 'Netflix',          category: 'Streaming',      amount: 17.99, currency: 'USD', frequency: 'monthly', nextPaymentDate: day(M0,  5), paymentMethod: 'Visa', status: 'active', notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'sub2', name: 'Spotify',          category: 'Música',         amount: 10.99, currency: 'USD', frequency: 'monthly', nextPaymentDate: day(M0, 10), paymentMethod: 'Visa', status: 'active', notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'sub3', name: 'Disney+',          category: 'Streaming',      amount: 13.99, currency: 'USD', frequency: 'monthly', nextPaymentDate: day(M0, 12), paymentMethod: 'Visa', status: 'active', notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'sub4', name: 'YouTube Premium',  category: 'Streaming',      amount:  13.99, currency: 'USD', frequency: 'monthly', nextPaymentDate: day(M0, 20), paymentMethod: 'Google Pay', status: 'active', notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'sub5', name: 'iCloud 200GB',     category: 'Almacenamiento', amount:   2.99, currency: 'USD', frequency: 'monthly', nextPaymentDate: day(M0, 15), paymentMethod: 'Apple Pay', status: 'active', notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'sub6', name: 'Microsoft 365',    category: 'Productividad',  amount:  99.99, currency: 'USD', frequency: 'annual',  nextPaymentDate: nextYearDate(3, 1), paymentMethod: 'Visa', status: 'active', notes: 'Plan familiar', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'sub7', name: 'Gimnasio Anytime', category: 'Salud',          amount:  34.99, currency: 'USD', frequency: 'monthly', nextPaymentDate: day(M0,  1), paymentMethod: 'Débito', status: 'active', notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]

// Estado completo de demo para usar con useReducer HYDRATE
export const DEMO_STATE = {
  incomes:  DEMO_INCOMES,
  expenses: DEMO_EXPENSES,
  budgets:  DEMO_BUDGETS,
  debts:    DEMO_DEBTS,
  goals:    DEMO_GOALS,
  subscriptions: DEMO_SUBSCRIPTIONS,
  settings: DEMO_SETTINGS,
}
