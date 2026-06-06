// src/pages/shared/constants.js
// Constantes compartidas entre módulos de páginas

export const CURRENCY_SYMBOLS = { CLP: '$', USD: 'US$', EUR: '€', VES: 'Bs.' }
export const CURRENCY_OPTIONS  = [
  { code: 'CLP', label: 'CLP — Peso chileno' },
  { code: 'USD', label: 'USD — Dólar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'VES', label: 'VES — Bolívar' },
]
export const monthLabel = (m) => {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return `${['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+mo]} ${y}`
}
