// Cobertura nueva del parseo de Excel — no existía ninguna antes de migrar
// de xlsx (CVE de prototype pollution, GHSA-4r6h-8v6p-xvw6, sin mitigar) a
// exceljs. parseWorkbookBuffer/rowsFromMatrix están separadas de parseXLSX
// (que depende de FileReader, solo disponible en el navegador) justamente
// para poder testearlas acá en Node.
import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import { parseWorkbookBuffer, rowsFromMatrix } from './fileParser.js'

async function buildWorkbook(rows, sheetName = 'Movimientos') {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(sheetName)
  rows.forEach(r => ws.addRow(r))
  return wb.xlsx.writeBuffer()
}

describe('parseWorkbookBuffer', () => {
  it('lee un .xlsx simple: header en la fila 0, filas de datos como strings', async () => {
    const buf = await buildWorkbook([
      ['Fecha', 'Descripcion', 'Monto'],
      ['2026-08-01', 'COMPRA CAFE', -3500],
      ['2026-08-02', 'DEPOSITO', 100000],
    ])
    const result = await parseWorkbookBuffer(buf)
    expect(result.headers).toEqual(['Fecha', 'Descripcion', 'Monto'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({ Fecha: '2026-08-01', Descripcion: 'COMPRA CAFE', Monto: '-3500' })
    expect(result.sourceType).toBe('xlsx')
    expect(result.sheetName).toBe('Movimientos')
  })

  it('salta filas de título/vacías antes del header real (patrón típico de cartola bancaria)', async () => {
    const buf = await buildWorkbook([
      ['Banco XYZ - Cartola de movimientos'],
      [],
      ['Fecha', 'Descripcion', 'Monto'],
      ['2026-08-01', 'COMPRA CAFE', -3500],
    ])
    const result = await parseWorkbookBuffer(buf)
    expect(result.headers).toEqual(['Fecha', 'Descripcion', 'Monto'])
    expect(result.rows).toHaveLength(1)
  })

  it('formatea celdas de fecha real (tipo Date) como yyyy-mm-dd, no como serial ni datetime', async () => {
    const buf = await buildWorkbook([
      ['Fecha', 'Descripcion', 'Monto'],
      [new Date(Date.UTC(2026, 7, 1)), 'COMPRA CAFE', -3500],
    ])
    const result = await parseWorkbookBuffer(buf)
    expect(result.rows[0].Fecha).toBe('2026-08-01')
  })

  it('ignora filas totalmente vacías entre datos', async () => {
    const buf = await buildWorkbook([
      ['Fecha', 'Descripcion', 'Monto'],
      ['2026-08-01', 'COMPRA CAFE', -3500],
      [],
      ['2026-08-02', 'DEPOSITO', 100000],
    ])
    const result = await parseWorkbookBuffer(buf)
    expect(result.rows).toHaveLength(2)
  })

  it('rechaza un archivo sin filas suficientes', async () => {
    const buf = await buildWorkbook([['Solo header, sin datos']])
    await expect(parseWorkbookBuffer(buf)).rejects.toThrow('no contiene filas válidas')
  })
})

describe('rowsFromMatrix (heurística compartida, sin depender de exceljs)', () => {
  it('trunca a MAX_ROWS y reporta totalLines real', () => {
    const jsonRows = [['Fecha', 'Monto'], ...Array.from({ length: 5 }, (_, i) => [`2026-08-0${i + 1}`, String(i)])]
    const result = rowsFromMatrix(jsonRows, 'xlsx', 'Hoja1')
    expect(result.totalLines).toBe(5)
    expect(result.rows).toHaveLength(5)
  })
})
