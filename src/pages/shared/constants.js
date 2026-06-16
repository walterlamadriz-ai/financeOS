// src/pages/shared/constants.js
// Constantes compartidas entre módulos de páginas

export const CURRENCY_SYMBOLS = { CLP: '$', USD: 'US$', EUR: '€', VES: 'Bs.', MXN: '$', ARS: '$', COP: '$', PEN: 'S/', PYG: '₲', UYU: '$U', BRL: 'R$' }
export const CURRENCY_OPTIONS  = [
  { code: 'CLP', label: 'CLP — Peso chileno' },
  { code: 'USD', label: 'USD — Dólar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'MXN', label: 'MXN — Peso mexicano' },
  { code: 'ARS', label: 'ARS — Peso argentino' },
  { code: 'COP', label: 'COP — Peso colombiano' },
  { code: 'PEN', label: 'PEN — Sol peruano' },
  { code: 'BRL', label: 'BRL — Real brasileño' },
  { code: 'UYU', label: 'UYU — Peso uruguayo' },
  { code: 'VES', label: 'VES — Bolívar' },
]

// Tasas orientativas de referencia (1 USD = X moneda local) — el usuario las ajusta
export const DEFAULT_USD_RATES = {
  CLP: 950, MXN: 17.5, ARS: 1000, COP: 4100, PEN: 3.75,
  BRL: 5.0, UYU: 39, VES: 36, EUR: 0.92, USD: 1,
}
export const monthLabel = (m) => {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return `${['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+mo]} ${y}`
}
