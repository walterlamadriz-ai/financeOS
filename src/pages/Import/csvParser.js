// src/pages/Import/csvParser.js
// Lógica de parsing CSV — sin React, sin dependencias externas
// 100% local · sin envío de datos a servidores

// ── CONSTANTES ────────────────────────────────────────────────────────────────
export const MAX_ROWS = 1000

// ── PARSE CSV ─────────────────────────────────────────────────────────────────
export function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return { headers: [], rows: [], rawLines: lines }

  const delimiter = detectDelimiter(lines[0])
  const headers = splitLine(lines[0], delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''))

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cells = splitLine(line, delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''))
    if (cells.length >= 2) {
      const row = {}
      headers.forEach((h, idx) => { row[h] = cells[idx] || '' })
      row._rowIndex = i
      rows.push(row)
    }
  }

  return { headers, rows: rows.slice(0, MAX_ROWS), rawLines: lines, totalLines: lines.length - 1 }
}

function detectDelimiter(line) {
  const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 }
  for (const ch of line) if (counts[ch] !== undefined) counts[ch]++
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

function splitLine(line, delimiter) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' || ch === "'") { inQuotes = !inQuotes; continue }
    if (ch === delimiter && !inQuotes) { result.push(current); current = ''; continue }
    current += ch
  }
  result.push(current)
  return result
}

// ── DETECT COLUMNS ────────────────────────────────────────────────────────────
export function detectColumns(headers) {
  const lower = headers.map(h => h.toLowerCase())
  const find = (keywords) => {
    const idx = lower.findIndex(h => keywords.some(k => h.includes(k)))
    return idx >= 0 ? headers[idx] : null
  }

  return {
    date:        find(['fecha', 'date', 'día', 'dia', 'fec']),
    description: find(['descripcion', 'descripción', 'concepto', 'detalle', 'desc', 'detail', 'name', 'nombre']),
    amount:      find(['monto', 'importe', 'amount', 'valor', 'total', 'suma']),
    debit:       find(['debito', 'débito', 'cargo', 'egreso', 'debit', 'out']),
    credit:      find(['credito', 'crédito', 'abono', 'ingreso', 'credit', 'in']),
    category:    find(['categoria', 'categoría', 'category', 'tipo', 'rubro']),
    account:     find(['cuenta', 'account', 'tarjeta', 'card']),
  }
}

// ── NORMALIZE DATE ────────────────────────────────────────────────────────────
export function normalizeDate(str) {
  if (!str) return null
  const s = str.trim()

  // ISO: 2024-01-15
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`

  // MM/DD/YYYY (US)
  const mdy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`

  // DD/MM/YY
  const dmy2 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/)
  if (dmy2) {
    const yr = parseInt(dmy2[3]) > 50 ? `19${dmy2[3]}` : `20${dmy2[3]}`
    return `${yr}-${dmy2[2].padStart(2,'0')}-${dmy2[1].padStart(2,'0')}`
  }

  return null
}

// ── NORMALIZE AMOUNT ──────────────────────────────────────────────────────────
export function normalizeAmount(str) {
  if (!str && str !== 0) return null
  const s = String(str).trim()
  if (!s) return null

  // Detectar si usa coma como decimal: 1.234,56 → 1234.56
  const commaDecimal = /^\-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s) || /^\-?\d+(,\d{1,2})$/.test(s)

  let clean = s.replace(/[^0-9,.\-]/g, '')
  if (commaDecimal) {
    clean = clean.replace(/\./g, '').replace(',', '.')
  } else {
    clean = clean.replace(/,/g, '')
  }

  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

// ── DETECT TRANSACTION TYPE ───────────────────────────────────────────────────
export function detectTransactionType(row, mapping, config) {
  const { mode, negativeIsExpense } = config

  if (mode === 'debit_credit') {
    const debitVal = normalizeAmount(row[mapping.debit])
    const creditVal = normalizeAmount(row[mapping.credit])
    if (debitVal && Math.abs(debitVal) > 0) return 'expense'
    if (creditVal && Math.abs(creditVal) > 0) return 'income'
    return 'expense'
  }

  // mode === 'single'
  const amount = normalizeAmount(row[mapping.amount])
  if (amount === null) return null
  if (negativeIsExpense) return amount < 0 ? 'expense' : 'income'
  return amount > 0 ? 'income' : 'expense'
}

// ── GET AMOUNT FROM ROW ───────────────────────────────────────────────────────
export function getAmount(row, mapping, config) {
  if (config.mode === 'debit_credit') {
    const d = normalizeAmount(row[mapping.debit])
    const c = normalizeAmount(row[mapping.credit])
    if (d && Math.abs(d) > 0) return Math.abs(d)
    if (c && Math.abs(c) > 0) return Math.abs(c)
    return 0
  }
  const a = normalizeAmount(row[mapping.amount])
  return a !== null ? Math.abs(a) : 0
}

// ── VALIDATE ROWS ─────────────────────────────────────────────────────────────
export function validateRows(rows, mapping, config) {
  return rows.map(row => {
    const date = normalizeDate(row[mapping.date])
    const amount = getAmount(row, mapping, config)
    const type = detectTransactionType(row, mapping, config)
    const description = (row[mapping.description] || '').trim()
    const errors = []

    if (!date) errors.push('Fecha no reconocida')
    if (!amount || amount === 0) errors.push('Monto inválido')
    if (!description) errors.push('Sin descripción')

    return {
      _rowIndex: row._rowIndex,
      date: date || '',
      description,
      amount,
      type,
      category: row[mapping.category] || '',
      account: row[mapping.account] || '',
      originalDescription: description,
      status: errors.length > 0 ? 'error' : 'valid',
      errors,
    }
  })
}

// ── DETECT DUPLICATES ─────────────────────────────────────────────────────────
export function detectDuplicates(validatedRows, existingRecords) {
  // Construir set de claves de registros existentes
  const existingKeys = new Set(
    existingRecords.map(r =>
      `${r.date}|${(r.description || r.concept || '').toLowerCase().trim()}|${Math.round((r.amount || 0) * 100)}`
    )
  )

  // También detectar duplicados dentro del mismo CSV
  const batchKeys = new Set()

  return validatedRows.map(row => {
    if (row.status === 'error') return row
    const key = `${row.date}|${row.description.toLowerCase().trim()}|${Math.round(row.amount * 100)}`
    const isDuplicateExternal = existingKeys.has(key)
    const isDuplicateBatch = batchKeys.has(key)
    batchKeys.add(key)

    return {
      ...row,
      status: (isDuplicateExternal || isDuplicateBatch) ? 'duplicate' : 'valid',
      isDuplicateExternal,
      isDuplicateBatch,
    }
  })
}

// ── CREATE IMPORT BATCH ───────────────────────────────────────────────────────
export function createImportBatch(fileName, rows) {
  const imported = rows.filter(r => r._include && r.status === 'valid')
  const incomes  = imported.filter(r => r.type === 'income')
  const expenses = imported.filter(r => r.type === 'expense')
  const skipped  = rows.filter(r => !r._include || r.status === 'error')
  const dupes    = rows.filter(r => r.status === 'duplicate')

  return {
    id: `batch_${Date.now()}`,
    fileName,
    importedAt: new Date().toISOString(),
    totalRows: rows.length,
    importedRows: imported.length,
    skippedRows: skipped.length,
    duplicateRows: dupes.length,
    totalIncome:  incomes.reduce((s, r) => s + r.amount, 0),
    totalExpense: expenses.reduce((s, r) => s + r.amount, 0),
  }
}

// ── BUILD TRANSACTIONS ────────────────────────────────────────────────────────
export function buildTransactions(rows, batchId, importedAt) {
  const incomes  = []
  const expenses = []
  const now = importedAt || new Date().toISOString()

  rows.forEach(row => {
    if (!row._include || row.status !== 'valid') return
    const base = {
      date: row.date,
      description: row.description,
      concept: row.description,
      amount: row.amount,
      category: row.category || (row.type === 'income' ? 'Importado' : 'Importado'),
      account: row.account || '',
      notes: '',
      source: 'csv',
      importBatchId: batchId,
      importedAt: now,
      originalDescription: row.originalDescription,
    }
    if (row.type === 'income') incomes.push(base)
    else expenses.push(base)
  })

  return { incomes, expenses }
}
