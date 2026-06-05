// src/pages/Import/bankTemplates.js
// Templates de bancos chilenos — detección automática de formato
// v1.4 — sin dependencias externas · 100% local

/**
 * Cada template define:
 * - name: nombre del banco
 * - flag: emoji bandera/logo
 * - delimiter: separador del CSV
 * - fingerprint: keywords únicas en headers para detectar el banco
 * - mapping: mapeo de columnas
 * - config: modo (debit_credit o single) y signo
 * - dateFormat: hint para el parser
 * - skipRows: filas a saltar al inicio (algunos bancos tienen headers en fila 2+)
 */

export const BANK_TEMPLATES = [
  {
    id: 'bancoestado',
    name: 'BancoEstado',
    flag: '🏦',
    country: 'CL',
    delimiter: ';',
    fingerprint: ['fecha', 'descripcion', 'debito', 'credito', 'saldo'],
    mapping: {
      date:        'Fecha',
      description: 'Descripcion',
      debit:       'Debito',
      credit:      'Credito',
    },
    config: { mode: 'debit_credit', negativeIsExpense: false },
    hint: 'Cartola BancoEstado — separador punto y coma',
  },
  {
    id: 'bancochile',
    name: 'Banco Chile',
    flag: '🏦',
    country: 'CL',
    delimiter: ';',
    fingerprint: ['fecha', 'glosa', 'cargo', 'abono', 'saldo'],
    mapping: {
      date:        'Fecha',
      description: 'Glosa',
      debit:       'Cargo',
      credit:      'Abono',
    },
    config: { mode: 'debit_credit', negativeIsExpense: false },
    hint: 'Cartola Banco de Chile — separador punto y coma',
  },
  {
    id: 'santander',
    name: 'Santander Chile',
    flag: '🏦',
    country: 'CL',
    delimiter: ';',
    fingerprint: ['fecha', 'descripcion', 'débito', 'crédito', 'saldo'],
    mapping: {
      date:        'Fecha',
      description: 'Descripcion',
      debit:       'Débito',
      credit:      'Crédito',
    },
    config: { mode: 'debit_credit', negativeIsExpense: false },
    hint: 'Cartola Santander Chile — separador punto y coma',
  },
  {
    id: 'bci',
    name: 'BCI',
    flag: '🏦',
    country: 'CL',
    delimiter: ',',
    fingerprint: ['fecha', 'descripción', 'cargo', 'abono', 'saldo'],
    mapping: {
      date:        'Fecha',
      description: 'Descripción',
      debit:       'Cargo',
      credit:      'Abono',
    },
    config: { mode: 'debit_credit', negativeIsExpense: false },
    hint: 'Cartola BCI — separador coma',
  },
  {
    id: 'scotiabank',
    name: 'Scotiabank Chile',
    flag: '🏦',
    country: 'CL',
    delimiter: ';',
    fingerprint: ['fecha', 'detalle', 'débito', 'crédito', 'saldo'],
    mapping: {
      date:        'Fecha',
      description: 'Detalle',
      debit:       'Débito',
      credit:      'Crédito',
    },
    config: { mode: 'debit_credit', negativeIsExpense: false },
    hint: 'Cartola Scotiabank Chile — separador punto y coma',
  },
  {
    id: 'falabella',
    name: 'Banco Falabella',
    flag: '🏦',
    country: 'CL',
    delimiter: ',',
    fingerprint: ['fecha', 'descripcion', 'monto', 'tipo'],
    mapping: {
      date:        'Fecha',
      description: 'Descripcion',
      amount:      'Monto',
    },
    config: { mode: 'single', negativeIsExpense: true },
    hint: 'Cartola Falabella — separador coma · monto negativo = cargo',
  },
  {
    id: 'itau',
    name: 'Itaú Chile',
    flag: '🏦',
    country: 'CL',
    delimiter: ';',
    fingerprint: ['fecha', 'descripcion', 'monto', 'saldo'],
    mapping: {
      date:        'Fecha',
      description: 'Descripcion',
      amount:      'Monto',
    },
    config: { mode: 'single', negativeIsExpense: true },
    hint: 'Cartola Itaú Chile — separador punto y coma',
  },
  {
    id: 'mach',
    name: 'MACH / Tenpo',
    flag: '📱',
    country: 'CL',
    delimiter: ',',
    fingerprint: ['date', 'description', 'amount', 'type'],
    mapping: {
      date:        'date',
      description: 'description',
      amount:      'amount',
    },
    config: { mode: 'single', negativeIsExpense: true },
    hint: 'Export MACH o Tenpo — formato inglés',
  },
  {
    id: 'mercadopago_cl',
    name: 'MercadoPago',
    flag: '💳',
    country: 'CL',
    delimiter: ',',
    fingerprint: ['fecha', 'detalle', 'monto', 'estado'],
    mapping: {
      date:        'Fecha',
      description: 'Detalle',
      amount:      'Monto',
    },
    config: { mode: 'single', negativeIsExpense: true },
    hint: 'Reporte MercadoPago Chile',
  },
]

/**
 * Detecta el template del banco según los headers del CSV
 * @param {string[]} headers — headers del CSV ya parseados
 * @returns {object|null} — template detectado o null
 */
export function detectBankTemplate(headers) {
  if (!headers || headers.length === 0) return null

  const lower = headers.map(h =>
    (h || '').toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quitar tildes para comparar
  )

  for (const template of BANK_TEMPLATES) {
    const fp = template.fingerprint
    const matches = fp.filter(keyword =>
      lower.some(h => h.includes(keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
    )
    // Requiere al menos 3 de los keywords del fingerprint
    if (matches.length >= Math.min(3, fp.length)) {
      return template
    }
  }

  return null
}

/**
 * Aplica el template al mapping de columnas detectado
 * Usa los headers reales del CSV para mapear
 * @param {object} template
 * @param {string[]} headers
 * @returns {object} mapping listo para usar en validateRows
 */
export function applyTemplate(template, headers) {
  const lower = headers.map(h =>
    (h || '').toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  )

  const resolved = {}
  for (const [field, colName] of Object.entries(template.mapping)) {
    const targetLower = colName.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const idx = lower.findIndex(h => h === targetLower || h.includes(targetLower))
    resolved[field] = idx >= 0 ? headers[idx] : null
  }

  return resolved
}
