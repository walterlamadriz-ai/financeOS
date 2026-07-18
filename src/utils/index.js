// src/utils/index.js

export const uid = () => Math.random().toString(36).slice(2, 10)

export const today = () => new Date().toISOString().slice(0, 10)

// Locale de formato de miles, seteado una vez desde AppContext según la moneda
// del usuario (default es-CL = separador punto, comportamiento histórico).
// Evita que un cliente en USA/México/Portugal vea el separador chileno.
let _moneyLocale = 'es-CL'
const CURRENCY_LOCALE = {
  CLP: 'es-CL', COP: 'es-CO', ARS: 'es-AR', PEN: 'es-PE', VES: 'es-VE',
  MXN: 'es-MX', USD: 'en-US', EUR: 'pt-PT', BRL: 'pt-BR',
}
export function setMoneyLocale(currency) {
  _moneyLocale = CURRENCY_LOCALE[currency] || 'es-CL'
}

export const fmtMoney = (n, symbol = '$') => {
  const abs = Math.abs(Math.round(n || 0))
  return symbol + abs.toLocaleString(_moneyLocale)
}

export const fmtPct = (n) => (Math.round((n || 0) * 1000) / 10).toFixed(1) + '%'

export const fmtDate = (iso) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export const CAT_COLORS = {
  Vivienda: '#1a6b4a',
  Alimentación: '#3dbe7a',
  Transporte: '#d4982a',
  Salud: '#4a9ad4',
  Educación: '#7f77dd',
  Entretenimiento: '#e05a4a',
  Servicios: '#0f6e56',
  Ropa: '#d4537e',
  Otro: '#888780',
  Salario: '#1a6b4a',
  Freelance: '#4a9ad4',
  Inversión: '#7f77dd',
  Arriendo: '#d4982a',
  Bono: '#3dbe7a',
}

// Emoji por categoría — hace el registro más ágil y amigable. Fallback: solo el nombre.
export const CAT_EMOJIS = {
  Vivienda: '🏠', Alimentación: '🛒', Transporte: '🚗', Salud: '⚕️', Educación: '📚',
  Entretenimiento: '🎬', Servicios: '💡', Ropa: '👕', Tecnología: '💻', Mascota: '🐾',
  Propiedad: '🏢', Inversión: '📈', Otro: '📦',
  Salario: '💼', Freelance: '🧑‍💻', Arriendo: '🔑', Bono: '🎁', Pensión: '🏦', 'Negocio propio': '🏪',
}
// Devuelve el emoji de la categoría (o '' si no tiene).
export const catEmoji = (c) => CAT_EMOJIS[c] || ''
// Devuelve "emoji nombre" (o solo el nombre si no hay emoji). Para options, listas y etiquetas.
export const catLabel = (c) => { const e = CAT_EMOJIS[c]; return e ? `${e} ${c}` : (c || '') }

// Categorías de SUSCRIPCIONES (distintas de las de gasto). Fallback: solo el nombre.
export const SUB_EMOJIS = {
  Streaming: '🎥', 'Música': '🎵', Software: '🧰', Gimnasio: '🏋️', Seguro: '🛡️',
  'Educación': '📚', Cloud: '☁️', Delivery: '🛵', 'Suscripción': '🔄', Productividad: '⚙️', Otros: '📦',
}
export const subEmoji = (c) => SUB_EMOJIS[c] || ''
export const subLabel = (c) => { const e = SUB_EMOJIS[c]; return e ? `${e} ${c}` : (c || '') }

// Prioridad de metas — semáforo visual (🔴 alta, 🟡 media, 🟢 baja).
export const PRIO_EMOJIS = { Alta: '🔴', Media: '🟡', Baja: '🟢' }
export const prioEmoji = (p) => PRIO_EMOJIS[p] || ''

// Tipos de deuda con emoji. Los valores se guardan en español (como la prioridad);
// el emoji es solo presentación. Fallback 💳 para deudas antiguas sin tipo.
export const DEBT_TYPES  = ['Tarjeta', 'Hipoteca', 'Auto', 'Crédito', 'Préstamo', 'Estudiantil', 'Otro']
export const DEBT_EMOJIS = { Tarjeta: '💳', Hipoteca: '🏠', Auto: '🚗', Crédito: '📄', Préstamo: '🤝', Estudiantil: '🎓', Otro: '💰' }
export const debtEmoji = (tp) => DEBT_EMOJIS[tp] || '💳'

export const CATS_INCOME  = ['Salario', 'Freelance', 'Inversión', 'Arriendo', 'Bono', 'Otro']
export const CATS_EXPENSE = ['Vivienda', 'Alimentación', 'Transporte', 'Salud', 'Educación', 'Entretenimiento', 'Servicios', 'Ropa', 'Otro']
export const METHODS      = ['Débito', 'Crédito', 'Efectivo', 'Transferencia']
export const RECURRENCES  = ['Único', 'Mensual', 'Quincenal', 'Semanal']

// Seed data para demo
export const SEED_INCOMES = [
  { id: uid(), date: '2025-05-01', source: 'Salario empresa', amount: 3500000, category: 'Salario', recurrence: 'Mensual', notes: '' },
  { id: uid(), date: '2025-05-15', source: 'Freelance diseño', amount: 450000, category: 'Freelance', recurrence: 'Único', notes: '' },
  { id: uid(), date: '2025-05-22', source: 'Consultoría', amount: 250000, category: 'Freelance', recurrence: 'Único', notes: '' },
]

export const SEED_EXPENSES = [
  { id: uid(), date: '2025-05-01', description: 'Arriendo', amount: 480000, category: 'Vivienda', method: 'Transferencia', type: 'Necesidad', recurrence: 'Mensual', notes: '' },
  { id: uid(), date: '2025-05-03', description: 'Supermercado', amount: 185000, category: 'Alimentación', method: 'Débito', type: 'Necesidad', recurrence: 'Único', notes: '' },
  { id: uid(), date: '2025-05-04', description: 'Bencina', amount: 62000, category: 'Transporte', method: 'Débito', type: 'Necesidad', recurrence: 'Único', notes: '' },
  { id: uid(), date: '2025-05-05', description: 'Netflix', amount: 18000, category: 'Entretenimiento', method: 'Crédito', type: 'Deseo', recurrence: 'Mensual', notes: '' },
  { id: uid(), date: '2025-05-06', description: 'Farmacia', amount: 35000, category: 'Salud', method: 'Débito', type: 'Necesidad', recurrence: 'Único', notes: '' },
]

export const SEED_BUDGETS = [
  { id: uid(), category: 'Vivienda', limit: 500000 },
  { id: uid(), category: 'Alimentación', limit: 300000 },
  { id: uid(), category: 'Transporte', limit: 80000 },
  { id: uid(), category: 'Entretenimiento', limit: 60000 },
  { id: uid(), category: 'Salud', limit: 100000 },
]

export const SEED_DEBTS = [
  { id: uid(), creditor: 'Tarjeta Banco Estado', initial: 2000000, balance: 1200000, minPayment: 95000, dueDate: '2025-06-15', rate: 19.9 },
  { id: uid(), creditor: 'Crédito Santander', initial: 5000000, balance: 3600000, minPayment: 190000, dueDate: '2025-07-05', rate: 12.5 },
]

export const SEED_GOALS = [
  { id: uid(), name: 'Fondo de emergencia', target: 7200000, saved: 4200000, targetDate: '2025-12-31', priority: 'Alta', color: '#d4982a' },
  { id: uid(), name: 'Viaje a Europa', target: 5000000, saved: 1400000, targetDate: '2026-03-01', priority: 'Media', color: '#1a6b4a' },
  { id: uid(), name: 'Pie departamento', target: 5800000, saved: 1200000, targetDate: '2027-06-01', priority: 'Alta', color: '#4a9ad4' },
]
