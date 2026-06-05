import * as XLSX from 'xlsx'
// src/pages/Import/fileParser.js
// Parser CSV — sin dependencias externas · 100% local · sin envío de datos

export const MAX_ROWS = 1000
export const SUPPORTED_TYPES = ['.csv', '.xlsx', '.xls']

export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') {
    return parseXLSX(file)
  }
  if (ext !== 'csv') {
    throw new Error('Formato no soportado. Se aceptan archivos .csv, .xlsx y .xls')
  }
  const text = await readAsText(file)
  return parseCSV(text)
}

async function parseXLSX(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        // Usar la primera hoja
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        // Convertir a JSON — primera fila como headers
        const jsonRows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd',
          defval: '',
        })
        if (!jsonRows || jsonRows.length < 2) {
          rej(new Error('El archivo Excel no contiene filas válidas.'))
          return
        }
        // Buscar la primera fila con contenido real como headers
        // Algunos bancos tienen filas vacías o de título al inicio
        let headerRowIdx = 0
        for (let i = 0; i < Math.min(10, jsonRows.length); i++) {
          const row = jsonRows[i]
          const nonEmpty = row.filter(c => c && String(c).trim())
          if (nonEmpty.length >= 3) { headerRowIdx = i; break }
        }
        const headers = jsonRows[headerRowIdx]
          .map(h => String(h || '').trim())
          .filter(h => h)
        const dataRows = []
        for (let i = headerRowIdx + 1; i < jsonRows.length; i++) {
          const cells = jsonRows[i]
          if (!cells || cells.every(c => !c || !String(c).trim())) continue
          const row = { _rowIndex: i }
          headers.forEach((h, idx) => { row[h] = String(cells[idx] || '').trim() })
          dataRows.push(row)
        }
        res({
          headers,
          rows: dataRows.slice(0, MAX_ROWS),
          totalLines: dataRows.length,
          sourceType: 'xlsx',
          sheetName,
        })
      } catch (err) {
        rej(new Error('Error al leer el Excel: ' + err.message))
      }
    }
    reader.onerror = () => rej(new Error('No se pudo leer el archivo Excel'))
    reader.readAsArrayBuffer(file)
  })
}

function readAsText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result)
    r.onerror = () => rej(new Error('No se pudo leer el archivo'))
    r.readAsText(file, 'UTF-8')
  })
}

export function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return { headers: [], rows: [], totalLines: 0 }
  const delimiter = detectDelimiter(lines[0])
  const headers = splitLine(lines[0], delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''))
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cells = splitLine(line, delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''))
    if (cells.length >= 2) {
      const row = { _rowIndex: i }
      headers.forEach((h, idx) => { row[h] = cells[idx] || '' })
      rows.push(row)
    }
  }
  return { headers, rows: rows.slice(0, MAX_ROWS), totalLines: lines.length - 1 }
}

function detectDelimiter(line) {
  const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 }
  for (const ch of line) if (counts[ch] !== undefined) counts[ch]++
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

function splitLine(line, delimiter) {
  const result = []
  let current = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' || ch === "'") { inQuotes = !inQuotes; continue }
    if (ch === delimiter && !inQuotes) { result.push(current); current = ''; continue }
    current += ch
  }
  result.push(current)
  return result
}

export function detectColumns(headers) {
  const lower = headers.map(h => h.toLowerCase())
  const find = (kw) => { const i = lower.findIndex(h => kw.some(k => h.includes(k))); return i >= 0 ? headers[i] : null }
  return {
    date:        find(['fecha', 'date', 'día', 'dia', 'fec']),
    description: find(['descripcion', 'descripción', 'concepto', 'detalle', 'desc', 'glosa', 'nombre']),
    amount:      find(['monto', 'importe', 'amount', 'valor', 'total', 'suma']),
    debit:       find(['debito', 'débito', 'cargo', 'egreso', 'debit', 'retiro']),
    credit:      find(['credito', 'crédito', 'abono', 'ingreso', 'credit', 'deposito']),
    category:    find(['categoria', 'categoría', 'category', 'tipo', 'rubro']),
    account:     find(['cuenta', 'account', 'tarjeta', 'card']),
  }
}

export function normalizeDate(str) {
  if (!str) return null
  const s = String(str).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`
  const dmy2 = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/)
  if (dmy2) { const yr = parseInt(dmy2[3]) > 50 ? `19${dmy2[3]}` : `20${dmy2[3]}`; return `${yr}-${dmy2[2].padStart(2,'0')}-${dmy2[1].padStart(2,'0')}` }
  return null
}

export function normalizeAmount(str) {
  if (!str && str !== 0) return null
  const s = String(str).trim()
  if (!s) return null
  let clean = s.replace(/[^\d,.\-]/g, '')
  const commaDecimal = /^\-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(clean) || /^\-?\d+(,\d{1,2})$/.test(clean)
  if (commaDecimal) clean = clean.replace(/\./g, '').replace(',', '.')
  else clean = clean.replace(/,/g, '')
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

export function detectTransactionType(row, mapping, config) {
  const { mode, negativeIsExpense } = config
  if (mode === 'debit_credit') {
    const d = normalizeAmount(row[mapping.debit])
    const c = normalizeAmount(row[mapping.credit])
    if (d && Math.abs(d) > 0) return 'expense'
    if (c && Math.abs(c) > 0) return 'income'
    return 'expense'
  }
  const amount = normalizeAmount(row[mapping.amount])
  if (amount === null) return null
  return negativeIsExpense ? (amount < 0 ? 'expense' : 'income') : (amount > 0 ? 'income' : 'expense')
}

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
    return { _rowIndex: row._rowIndex, date: date || '', description, amount, type, category: row[mapping.category] || '', account: row[mapping.account] || '', originalDescription: description, status: errors.length > 0 ? 'error' : 'valid', errors }
  })
}

export function detectDuplicates(validatedRows, existingRecords) {
  const existingKeys = new Set(existingRecords.map(r => `${r.date}|${(r.description||r.concept||'').toLowerCase().trim()}|${Math.round((r.amount||0)*100)}`))
  const batchKeys = new Set()
  return validatedRows.map(row => {
    if (row.status === 'error') return row
    const key = `${row.date}|${row.description.toLowerCase().trim()}|${Math.round(row.amount*100)}`
    const isDuplicateExternal = existingKeys.has(key)
    const isDuplicateBatch = batchKeys.has(key)
    batchKeys.add(key)
    return { ...row, status: (isDuplicateExternal || isDuplicateBatch) ? 'duplicate' : 'valid', isDuplicateExternal, isDuplicateBatch }
  })
}

export function createImportBatch(fileName, rows) {
  const imported = rows.filter(r => r._include && r.status === 'valid')
  return {
    id: `batch_${Date.now()}`,
    fileName,
    importedAt: new Date().toISOString(),
    totalRows: rows.length,
    importedRows: imported.length,
    skippedRows: rows.filter(r => !r._include || r.status === 'error').length,
    duplicateRows: rows.filter(r => r.status === 'duplicate').length,
    totalIncome: imported.filter(r => r.type === 'income').reduce((s,r) => s+r.amount, 0),
    totalExpense: imported.filter(r => r.type === 'expense').reduce((s,r) => s+r.amount, 0),
  }
}

export function buildTransactions(rows, batchId, importedAt) {
  const incomes = [], expenses = []
  const now = importedAt || new Date().toISOString()
  rows.forEach(row => {
    if (!row._include || row.status !== 'valid') return
    const base = { date: row.date, description: row.description, concept: row.description, amount: row.amount, category: row.category || 'Importado', account: row.account || '', notes: '', source: 'csv', importBatchId: batchId, importedAt: now, originalDescription: row.originalDescription }
    if (row.type === 'income') incomes.push(base)
    else expenses.push(base)
  })
  return { incomes, expenses }
}
