// src/demo/demoData.js
// Datos ficticios para el modo demo de FinanceOS
// Perfil: María González — Coach financiera independiente, Santiago de Chile
// 3 meses de datos (marzo, abril, mayo 2025)
// IMPORTANTE: estos datos nunca se escriben en IndexedDB

import { uid } from '../utils/index.js'

// Genera IDs fijos para el demo (no aleatorios — para consistencia)
const d = (suffix) => `demo-${suffix}`

export const DEMO_SETTINGS = {
  currency: 'CLP',
  theme: 'light',
  language: 'es',
  savingGoalPct: 25,
  onboardingDone: true,
  activeMonth: '2025-05',
  isDemo: true,
}

export const DEMO_INCOMES = [
  // Mayo
  { id: d('i1'),  date: '2025-05-01', source: 'Salario — Consultoría Independiente', amount: 3_200_000, category: 'Salario',   recurrence: 'Mensual',  notes: '' },
  { id: d('i2'),  date: '2025-05-10', source: 'Sesión coaching — cliente A',          amount:   150_000, category: 'Freelance', recurrence: 'Único',    notes: '' },
  { id: d('i3'),  date: '2025-05-15', source: 'Sesión coaching — cliente B',          amount:   150_000, category: 'Freelance', recurrence: 'Único',    notes: '' },
  { id: d('i4'),  date: '2025-05-20', source: 'Taller finanzas personales',           amount:   480_000, category: 'Freelance', recurrence: 'Único',    notes: '8 participantes' },
  // Abril
  { id: d('i5'),  date: '2025-04-01', source: 'Salario — Consultoría Independiente', amount: 3_200_000, category: 'Salario',   recurrence: 'Mensual',  notes: '' },
  { id: d('i6'),  date: '2025-04-12', source: 'Sesión coaching — cliente A',          amount:   150_000, category: 'Freelance', recurrence: 'Único',    notes: '' },
  { id: d('i7'),  date: '2025-04-25', source: 'Dividendo fondo mutuo',                amount:    82_000, category: 'Inversión', recurrence: 'Único',    notes: '' },
  // Marzo
  { id: d('i8'),  date: '2025-03-01', source: 'Salario — Consultoría Independiente', amount: 3_200_000, category: 'Salario',   recurrence: 'Mensual',  notes: '' },
  { id: d('i9'),  date: '2025-03-08', source: 'Sesión coaching — cliente C',          amount:   150_000, category: 'Freelance', recurrence: 'Único',    notes: '' },
  { id: d('i10'), date: '2025-03-20', source: 'Bono productividad Q1',                amount:   420_000, category: 'Bono',      recurrence: 'Único',    notes: '' },
]

export const DEMO_EXPENSES = [
  // Mayo — Necesidades
  { id: d('e1'),  date: '2025-05-01', description: 'Arriendo depto Providencia',  amount: 680_000, category: 'Vivienda',        method: 'Transferencia', type: 'Necesidad', recurrence: 'Mensual',  notes: '' },
  { id: d('e2'),  date: '2025-05-02', description: 'Cuenta luz + agua + gas',     amount:  85_000, category: 'Servicios',       method: 'Débito',        type: 'Necesidad', recurrence: 'Mensual',  notes: '' },
  { id: d('e3'),  date: '2025-05-03', description: 'Supermercado Jumbo',          amount: 195_000, category: 'Alimentación',    method: 'Débito',        type: 'Necesidad', recurrence: 'Único',    notes: '' },
  { id: d('e4'),  date: '2025-05-05', description: 'Bencina semana 1',            amount:  55_000, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',    notes: '' },
  { id: d('e5'),  date: '2025-05-07', description: 'Farmacia',                    amount:  28_000, category: 'Salud',           method: 'Débito',        type: 'Necesidad', recurrence: 'Único',    notes: '' },
  { id: d('e6'),  date: '2025-05-10', description: 'Internet hogar',              amount:  29_990, category: 'Servicios',       method: 'Crédito',       type: 'Necesidad', recurrence: 'Mensual',  notes: '' },
  { id: d('e7'),  date: '2025-05-12', description: 'Supermercado Lider',          amount:  98_000, category: 'Alimentación',    method: 'Débito',        type: 'Necesidad', recurrence: 'Único',    notes: '' },
  { id: d('e8'),  date: '2025-05-14', description: 'Bencina semana 2',            amount:  52_000, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',    notes: '' },
  { id: d('e9'),  date: '2025-05-15', description: 'Kinesióloga',                 amount:  45_000, category: 'Salud',           method: 'Transferencia', type: 'Necesidad', recurrence: 'Único',    notes: '' },
  // Mayo — Deseos
  { id: d('e10'), date: '2025-05-04', description: 'Netflix',                     amount:  19_990, category: 'Entretenimiento', method: 'Crédito',       type: 'Deseo',     recurrence: 'Mensual',  notes: '' },
  { id: d('e11'), date: '2025-05-04', description: 'Spotify',                     amount:   5_990, category: 'Entretenimiento', method: 'Crédito',       type: 'Deseo',     recurrence: 'Mensual',  notes: '' },
  { id: d('e12'), date: '2025-05-08', description: 'Almuerzo con cliente',        amount:  38_000, category: 'Alimentación',    method: 'Crédito',       type: 'Deseo',     recurrence: 'Único',    notes: 'Deducible' },
  { id: d('e13'), date: '2025-05-11', description: 'Ropa trabajo',                amount:  89_000, category: 'Ropa',            method: 'Crédito',       type: 'Deseo',     recurrence: 'Único',    notes: '' },
  { id: d('e14'), date: '2025-05-16', description: 'Cine + cena',                 amount:  45_000, category: 'Entretenimiento', method: 'Débito',        type: 'Deseo',     recurrence: 'Único',    notes: '' },
  { id: d('e15'), date: '2025-05-18', description: 'Curso online Udemy',          amount:  35_000, category: 'Educación',       method: 'Crédito',       type: 'Deseo',     recurrence: 'Único',    notes: 'Finanzas conductuales' },
  // Abril
  { id: d('e16'), date: '2025-04-01', description: 'Arriendo depto Providencia',  amount: 680_000, category: 'Vivienda',        method: 'Transferencia', type: 'Necesidad', recurrence: 'Mensual',  notes: '' },
  { id: d('e17'), date: '2025-04-03', description: 'Supermercado',                amount: 180_000, category: 'Alimentación',    method: 'Débito',        type: 'Necesidad', recurrence: 'Único',    notes: '' },
  { id: d('e18'), date: '2025-04-05', description: 'Bencina',                     amount: 102_000, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',    notes: '' },
  { id: d('e19'), date: '2025-04-10', description: 'Netflix + Spotify',           amount:  25_980, category: 'Entretenimiento', method: 'Crédito',       type: 'Deseo',     recurrence: 'Mensual',  notes: '' },
  { id: d('e20'), date: '2025-04-15', description: 'Cuenta servicios',            amount:  92_000, category: 'Servicios',       method: 'Débito',        type: 'Necesidad', recurrence: 'Mensual',  notes: '' },
  { id: d('e21'), date: '2025-04-20', description: 'Reparación auto',             amount: 245_000, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',    notes: 'Imprevisto' },
  { id: d('e22'), date: '2025-04-25', description: 'Salida sábado',               amount:  62_000, category: 'Entretenimiento', method: 'Débito',        type: 'Deseo',     recurrence: 'Único',    notes: '' },
  // Marzo
  { id: d('e23'), date: '2025-03-01', description: 'Arriendo depto Providencia',  amount: 680_000, category: 'Vivienda',        method: 'Transferencia', type: 'Necesidad', recurrence: 'Mensual',  notes: '' },
  { id: d('e24'), date: '2025-03-05', description: 'Supermercado',                amount: 210_000, category: 'Alimentación',    method: 'Débito',        type: 'Necesidad', recurrence: 'Único',    notes: '' },
  { id: d('e25'), date: '2025-03-08', description: 'Bencina',                     amount:  98_000, category: 'Transporte',      method: 'Débito',        type: 'Necesidad', recurrence: 'Único',    notes: '' },
  { id: d('e26'), date: '2025-03-12', description: 'Servicios hogar',             amount:  88_000, category: 'Servicios',       method: 'Débito',        type: 'Necesidad', recurrence: 'Mensual',  notes: '' },
  { id: d('e27'), date: '2025-03-15', description: 'Streaming x3',               amount:  35_000, category: 'Entretenimiento', method: 'Crédito',       type: 'Deseo',     recurrence: 'Mensual',  notes: '' },
  { id: d('e28'), date: '2025-03-22', description: 'Dentista',                   amount:  85_000, category: 'Salud',           method: 'Débito',        type: 'Necesidad', recurrence: 'Único',    notes: '' },
]

export const DEMO_BUDGETS = [
  { id: d('b1'), category: 'Vivienda',        limit: 700_000 },
  { id: d('b2'), category: 'Alimentación',    limit: 350_000 },
  { id: d('b3'), category: 'Transporte',      limit: 130_000 },
  { id: d('b4'), category: 'Entretenimiento', limit:  80_000 },
  { id: d('b5'), category: 'Salud',           limit: 100_000 },
  { id: d('b6'), category: 'Servicios',       limit: 130_000 },
  { id: d('b7'), category: 'Educación',       limit:  50_000 },
]

export const DEMO_DEBTS = [
  { id: d('d1'), creditor: 'Tarjeta BancoEstado', initial: 2_400_000, balance: 1_580_000, minPayment: 118_000, dueDate: '2025-06-15', rate: 19.9, notes: 'Consolidar en cuota fija' },
  { id: d('d2'), creditor: 'Crédito Santander',   initial: 8_000_000, balance: 5_240_000, minPayment: 245_000, dueDate: '2025-07-05', rate: 12.5, notes: 'Crédito de consumo 36 cuotas' },
  { id: d('d3'), creditor: 'Préstamo familiar',   initial: 1_500_000, balance:   900_000, minPayment:  75_000, dueDate: '2025-12-31', rate:   0,  notes: 'Sin intereses' },
]

export const DEMO_GOALS = [
  { id: d('g1'), name: 'Fondo de emergencia (6 meses)', target: 9_600_000, saved: 5_800_000, targetDate: '2025-12-31', priority: 'Alta',  color: '#d4982a', notes: 'Meta: 3 meses cubiertos ya' },
  { id: d('g2'), name: 'Viaje a Colombia con familia',  target: 3_200_000, saved: 1_100_000, targetDate: '2025-10-15', priority: 'Media', color: '#1a6b4a', notes: 'Vuelos + hotel 7 noches' },
  { id: d('g3'), name: 'Curso certificación finanzas',  target:   850_000, saved:   850_000, targetDate: '2025-04-30', priority: 'Alta',  color: '#4a9ad4', notes: '✓ Meta alcanzada' },
  { id: d('g4'), name: 'Ahorro inicial depto propio',   target: 18_000_000, saved: 3_200_000, targetDate: '2027-12-31', priority: 'Alta', color: '#7f77dd', notes: 'Pie 10% + gastos notariales' },
]

// Estado completo de demo para usar con useReducer HYDRATE
export const DEMO_STATE = {
  incomes:  DEMO_INCOMES,
  expenses: DEMO_EXPENSES,
  budgets:  DEMO_BUDGETS,
  debts:    DEMO_DEBTS,
  goals:    DEMO_GOALS,
  settings: DEMO_SETTINGS,
}
