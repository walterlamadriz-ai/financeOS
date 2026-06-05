// src/pages/Import/index.jsx
// Importar movimientos — CSV · FinanceOS
// 100% local · sin dependencias externas · sin envío de datos

import { useState, useCallback, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { dbGetAll, dbAdd } from '../../core/db/index.js'
import { uid } from '../../utils/index.js'
import { detectBankTemplate, applyTemplate } from './bankTemplates.js'
import {
  parseFile, detectColumns, validateRows, detectDuplicates,
  createImportBatch, buildTransactions, MAX_ROWS,
} from './fileParser.js'

const s = {
  page: { maxWidth: 860, margin: '0 auto' },
  header: { marginBottom: 24 },
  eyebrow: { fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--grn2)', marginBottom: 6 },
  h1: { fontSize: 22, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-.5px', marginBottom: 4 },
  sub: { fontSize: 13, color: 'var(--th)', fontFamily: 'var(--mono)' },
  card: { background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 12 },
  steps: { display: 'flex', gap: 8, marginBottom: 28 },
  step: (active, done) => ({
    flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 8,
    fontSize: 11, fontFamily: 'var(--mono)',
    background: done ? 'var(--grn-bg)' : active ? 'rgba(0,212,170,.1)' : 'var(--sur)',
    color: done ? 'var(--grn)' : active ? 'var(--accent)' : 'var(--th)',
    border: `.5px solid ${done ? 'var(--grn)' : active ? 'var(--accent)' : 'var(--brd)'}`,
  }),
  dropzone: (drag) => ({
    border: `1.5px dashed ${drag ? 'var(--accent)' : 'var(--brd2)'}`,
    borderRadius: 12, padding: '40px 24px', textAlign: 'center',
    cursor: 'pointer', transition: '.2s',
    background: drag ? 'rgba(0,212,170,.04)' : 'var(--sur2)',
  }),
  privacy: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    background: 'rgba(0,212,170,.06)', border: '.5px solid rgba(0,212,170,.2)',
    borderRadius: 8, padding: '10px 12px', marginTop: 12,
    fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--mono)', lineHeight: 1.5,
  },
  hint: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    background: 'var(--sur2)', border: '.5px solid var(--brd)',
    borderRadius: 8, padding: '10px 12px', marginTop: 8,
    fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.5,
  },
  select: { width: '100%', background: 'var(--sur2)', border: '.5px solid var(--brd2)', borderRadius: 6, padding: '7px 10px', color: 'var(--tx)', fontSize: 13, fontFamily: 'var(--mono)' },
  label: { fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.5px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '7px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--th)', borderBottom: '1px solid var(--brd)', background: 'var(--sur2)', fontFamily: 'var(--mono)' },
  td: { padding: '7px 10px', borderBottom: '.5px solid var(--brd)', fontFamily: 'var(--mono)', verticalAlign: 'top' },
  badge: (status) => ({
    display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600,
    background: status === 'valid' ? 'rgba(0,212,170,.12)' : status === 'duplicate' ? 'rgba(245,166,35,.12)' : 'rgba(255,77,106,.12)',
    color: status === 'valid' ? 'var(--accent)' : status === 'duplicate' ? 'var(--amb)' : 'var(--red)',
  }),
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 16 },
  summaryItem: { background: 'var(--sur2)', borderRadius: 8, padding: '10px 12px', border: '.5px solid var(--brd)' },
  summaryLabel: { fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 },
  summaryVal: { fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--tx)' },
  btn: { padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: '.15s' },
  btnPrimary: { background: 'var(--grn)', color: '#fff' },
  btnSecondary: { background: 'var(--sur2)', color: 'var(--tx)', border: '.5px solid var(--brd2)' },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 },
  disclaimer: { fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, marginTop: 16, padding: '10px 12px', background: 'var(--sur2)', borderRadius: 8, border: '.5px solid var(--brd)' },
  warn: { background: 'rgba(245,166,35,.1)', border: '.5px solid var(--amb)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--amb)', fontFamily: 'var(--mono)', marginBottom: 16 },
}

const STEPS = ['Subir CSV', 'Mapear columnas', 'Revisar', 'Importar']
const fmt = (n) => (n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })

export default function ImportMovements() {
  const { settings } = useApp()
  const sym = { CLP:'$', USD:'US$', EUR:'€', VES:'Bs.', MXN:'$', ARS:'$', COP:'$' }[settings?.currency] || '$'
  const isDemo = !!settings?.isDemo

  const [step, setStep] = useState(0)
  const [drag, setDrag] = useState(false)
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [mapping, setMapping] = useState({})
  const [modeConfig, setModeConfig] = useState({ mode: 'single', negativeIsExpense: true })
  const [rows, setRows] = useState([])
  const [history, setHistory] = useState([])
  const [importing, setImporting] = useState(false)
  const [detectedBank, setDetectedBank] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [warning, setWarning] = useState(null)

  useState(() => {
    if (isDemo) return
    dbGetAll('importBatches').then(d => setHistory(d || []))
  })

  async function handleFile(f) {
    const ext = f.name.split('.').pop().toLowerCase()
    if (ext !== 'csv') {
      setWarning('Solo se aceptan archivos .csv. Si tienes un archivo de otro formato, expórtalo como CSV primero.')
      return
    }
    setWarning(null)
    setLoading(true)
    try {
      const result = await parseFile(f)
      if (result.rows.length === 0) { setWarning('El archivo no contiene filas válidas.'); return }
      const suggested = detectColumns(result.headers)
      const bankTemplate = detectBankTemplate(result.headers)
      setFile(f)
      setParsed(result)
      setDetectedBank(bankTemplate)
      if (bankTemplate) {
        const templateMapping = applyTemplate(bankTemplate, result.headers)
        setMapping({
          date:        templateMapping.date        || suggested.date        || result.headers[0] || '',
          description: templateMapping.description || suggested.description || result.headers[1] || '',
          amount:      templateMapping.amount      || suggested.amount      || result.headers[2] || '',
          debit:       templateMapping.debit       || suggested.debit       || '',
          credit:      templateMapping.credit      || suggested.credit      || '',
          category:    suggested.category || '',
          account:     suggested.account  || '',
        })
        setModeConfig(bankTemplate.config)
      } else {
        setMapping({
          date: suggested.date || result.headers[0] || '',
          description: suggested.description || result.headers[1] || '',
          amount: suggested.amount || result.headers[2] || '',
          debit: suggested.debit || '',
          credit: suggested.credit || '',
          category: suggested.category || '',
          account: suggested.account || '',
        })
        if (suggested.debit && suggested.credit) setModeConfig({ mode: 'debit_credit', negativeIsExpense: true })
      }
      if (result.totalLines > MAX_ROWS) setWarning(`El archivo tiene ${result.totalLines} filas. Se procesarán solo las primeras ${MAX_ROWS}.`)
      setStep(1)
    } catch (err) {
      setWarning('Error al leer el archivo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  async function handlePreview() {
    const validated = validateRows(parsed.rows, mapping, modeConfig)
    let existing = []
    if (!isDemo) {
      const [inc, exp] = await Promise.all([dbGetAll('incomes'), dbGetAll('expenses')])
      existing = [...(inc || []), ...(exp || [])]
    }
    const withDupes = detectDuplicates(validated, existing)
    setRows(withDupes.map(r => ({ ...r, _include: r.status !== 'error' })))
    setStep(2)
  }

  async function handleImport() {
    if (isDemo) { setResult({ demo: true }); setStep(3); return }
    setImporting(true)
    try {
      const batchId = uid()
      const now = new Date().toISOString()
      const { incomes, expenses } = buildTransactions(rows, batchId, now)
      const batch = createImportBatch(file.name, rows)
      batch.id = batchId; batch.importedAt = now
      await Promise.all([
        ...incomes.map(r => dbAdd('incomes', { ...r, id: uid() })),
        ...expenses.map(r => dbAdd('expenses', { ...r, id: uid() })),
        dbAdd('importBatches', batch),
      ])
      try { localStorage.setItem('fos_recent_import', JSON.stringify(batch)) } catch {}
      setHistory(prev => [batch, ...prev])
      setResult(batch)
      setStep(3)
    } catch (err) {
      setWarning('Error al importar: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setStep(0); setFile(null); setParsed(null); setRows([]); setResult(null); setWarning(null)
  }

  const stats = useMemo(() => {
    const included = rows.filter(r => r._include)
    return {
      total: rows.length,
      valid: rows.filter(r => r.status === 'valid').length,
      duplicate: rows.filter(r => r.status === 'duplicate').length,
      error: rows.filter(r => r.status === 'error').length,
      toImport: included.filter(r => r.status === 'valid').length,
      incomeAmt: included.filter(r => r.status === 'valid' && r.type === 'income').reduce((s,r) => s+r.amount, 0),
      expenseAmt: included.filter(r => r.status === 'valid' && r.type === 'expense').reduce((s,r) => s+r.amount, 0),
    }
  }, [rows])

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.eyebrow}>Herramientas</div>
        <h1 style={s.h1}>Importar movimientos</h1>
        <p style={s.sub}>Carga movimientos en formato CSV descargados desde tu banco o exportados desde una planilla.</p>
      </div>

      <div style={s.steps}>
        {STEPS.map((name, i) => (
          <div key={i} style={s.step(step === i, step > i)}>{step > i ? '✓ ' : `${i+1}. `}{name}</div>
        ))}
      </div>

      {warning && <div style={s.warn}>⚠ {warning}</div>}

      {/* STEP 0 — Subir CSV */}
      {step === 0 && (
        <>
          <div style={s.card}>
            <div style={s.cardTitle}>Sube un archivo CSV descargado desde tu banco</div>
            <div
              style={s.dropzone(drag)}
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById('csv-input').click()}
            >
              {loading
                ? <div style={{ color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>Leyendo archivo…</div>
                : <>
                    <div style={{ fontSize: 28, marginBottom: 10, color: 'var(--th)' }}>↑</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginBottom: 4 }}>Arrastra el archivo aquí o haz clic para seleccionarlo</div>
                    <div style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)' }}>Solo archivos .csv · máximo {MAX_ROWS} filas</div>
                  </>
              }
            </div>
            <input id="csv-input" type="file" accept=".csv" style={{ display: 'none' }}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            <div style={s.privacy}>
              <span>◑</span>
              <span>El archivo se procesa localmente en tu navegador. FinanceOS no envía tus movimientos a servidores.</span>
            </div>
            <div style={s.hint}>
              <span>→</span>
              <span>Si tu banco entrega el archivo en otro formato, ábrelo en una planilla y guárdalo como CSV antes de importarlo.</span>
            </div>
          </div>

          {history.length > 0 && (
            <div style={s.card}>
              <div style={s.cardTitle}>Historial de importaciones</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead><tr>
                    <th style={s.th}>Archivo</th><th style={s.th}>Fecha</th>
                    <th style={s.th}>Importados</th><th style={s.th}>Ingresos</th>
                    <th style={s.th}>Gastos</th><th style={s.th}>Omitidos</th>
                  </tr></thead>
                  <tbody>{history.map((b, i) => (
                    <tr key={i}>
                      <td style={{ ...s.td, color: 'var(--tx)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.fileName}</td>
                      <td style={{ ...s.td, color: 'var(--th)' }}>{b.importedAt?.slice(0,10)}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{b.importedRows}</td>
                      <td style={{ ...s.td, color: 'var(--accent)' }}>{sym}{fmt(b.totalIncome)}</td>
                      <td style={{ ...s.td, color: 'var(--red)' }}>{sym}{fmt(b.totalExpense)}</td>
                      <td style={{ ...s.td, color: 'var(--th)' }}>{(b.skippedRows||0)+(b.duplicateRows||0)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {history.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--th)', fontSize: 13, fontFamily: 'var(--mono)' }}>
              Aún no has importado movimientos. Descarga un CSV desde tu banco y súbelo aquí.
            </div>
          )}
        </>
      )}

      {/* STEP 1 — Mapear columnas */}
      {step === 1 && parsed && (
        <div style={s.card}>
          {/* Banner detección banco */}
          {detectedBank ? (
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'rgba(10,92,62,.07)',border:'0.5px solid rgba(10,92,62,.2)',borderRadius:8,marginBottom:16}}>
              <div style={{fontSize:22,flexShrink:0}}>{detectedBank.flag}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--grn)',marginBottom:2}}>✓ Detectamos formato {detectedBank.name}</div>
                <div style={{fontSize:11,color:'var(--th)',fontFamily:'var(--mono)'}}>{detectedBank.hint} · Columnas mapeadas automáticamente</div>
              </div>
              <div style={{fontSize:10,padding:'3px 8px',borderRadius:4,background:'rgba(10,92,62,.1)',color:'var(--grn)',fontFamily:'var(--mono)',flexShrink:0}}>Auto</div>
            </div>
          ) : (
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--sur2)',border:'0.5px solid var(--brd)',borderRadius:8,marginBottom:16}}>
              <div style={{fontSize:18}}>📄</div>
              <div style={{fontSize:11,color:'var(--th)',fontFamily:'var(--mono)'}}>Banco no detectado — verifica el mapeo de columnas manualmente.</div>
            </div>
          )}
          <div style={s.cardTitle}>Confirma el mapeo de columnas</div>
          <p style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)', marginBottom: 16 }}>
            {detectedBank ? 'Mapeo aplicado automáticamente. Podés ajustar si algo no coincide.' : 'FinanceOS detectó las columnas automáticamente. Confirma o corrige el mapeo antes de continuar.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[{ key: 'date', label: 'Fecha *' }, { key: 'description', label: 'Descripción *' }].map(({ key, label }) => (
              <div key={key}>
                <div style={s.label}>{label}</div>
                <select style={s.select} value={mapping[key] || ''} onChange={e => setMapping(m => ({ ...m, [key]: e.target.value }))}>
                  <option value="">— Sin asignar —</option>
                  {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={s.label}>Formato de monto</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              {[['single', 'Columna única'], ['debit_credit', 'Débito / Crédito separados']].map(([val, lbl]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--tx)' }}>
                  <input type="radio" name="mode" value={val} checked={modeConfig.mode === val}
                    onChange={() => setModeConfig(c => ({ ...c, mode: val }))} />
                  {lbl}
                </label>
              ))}
            </div>

            {modeConfig.mode === 'single' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={s.label}>Columna monto *</div>
                  <select style={s.select} value={mapping.amount || ''} onChange={e => setMapping(m => ({ ...m, amount: e.target.value }))}>
                    <option value="">— Sin asignar —</option>
                    {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <div style={s.label}>Monto negativo es</div>
                  <select style={s.select} value={modeConfig.negativeIsExpense ? 'expense' : 'income'}
                    onChange={e => setModeConfig(c => ({ ...c, negativeIsExpense: e.target.value === 'expense' }))}>
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </select>
                </div>
              </div>
            )}

            {modeConfig.mode === 'debit_credit' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={s.label}>Columna débito (gasto)</div>
                  <select style={s.select} value={mapping.debit || ''} onChange={e => setMapping(m => ({ ...m, debit: e.target.value }))}>
                    <option value="">— Sin asignar —</option>
                    {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <div style={s.label}>Columna crédito (ingreso)</div>
                  <select style={s.select} value={mapping.credit || ''} onChange={e => setMapping(m => ({ ...m, credit: e.target.value }))}>
                    <option value="">— Sin asignar —</option>
                    {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[{ key: 'category', label: 'Categoría (opcional)' }, { key: 'account', label: 'Cuenta (opcional)' }].map(({ key, label }) => (
              <div key={key}>
                <div style={s.label}>{label}</div>
                <select style={s.select} value={mapping[key] || ''} onChange={e => setMapping(m => ({ ...m, [key]: e.target.value }))}>
                  <option value="">— No importar —</option>
                  {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', marginBottom: 8 }}>VISTA PREVIA — PRIMERAS 3 FILAS</div>
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table style={s.table}>
              <thead><tr>{parsed.headers.map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>{parsed.rows.slice(0, 3).map((row, i) => (
                <tr key={i}>{parsed.headers.map(h => <td key={h} style={{ ...s.td, color: 'var(--tx)' }}>{row[h]}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>

          <div style={s.btnRow}>
            <button style={{ ...s.btn, ...s.btnSecondary }} onClick={() => setStep(0)}>← Volver</button>
            <button style={{ ...s.btn, ...s.btnPrimary }}
              disabled={!mapping.date || !mapping.description || (modeConfig.mode === 'single' && !mapping.amount) || (modeConfig.mode === 'debit_credit' && !mapping.debit && !mapping.credit)}
              onClick={handlePreview}>
              Revisar movimientos →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Revisar */}
      {step === 2 && (
        <>
          <div style={s.card}>
            <div style={s.cardTitle}>Resumen de importación</div>
            <div style={s.summaryGrid}>
              <div style={s.summaryItem}><div style={s.summaryLabel}>Total filas</div><div style={s.summaryVal}>{stats.total}</div></div>
              <div style={s.summaryItem}><div style={s.summaryLabel}>Válidos</div><div style={{ ...s.summaryVal, color: 'var(--accent)' }}>{stats.valid}</div></div>
              <div style={s.summaryItem}><div style={s.summaryLabel}>Duplicados</div><div style={{ ...s.summaryVal, color: 'var(--amb)' }}>{stats.duplicate}</div></div>
              <div style={s.summaryItem}><div style={s.summaryLabel}>Con error</div><div style={{ ...s.summaryVal, color: 'var(--red)' }}>{stats.error}</div></div>
              <div style={s.summaryItem}><div style={s.summaryLabel}>Ingresos est.</div><div style={{ ...s.summaryVal, color: 'var(--accent)', fontSize: 13 }}>{sym}{fmt(stats.incomeAmt)}</div></div>
              <div style={s.summaryItem}><div style={s.summaryLabel}>Gastos est.</div><div style={{ ...s.summaryVal, color: 'var(--red)', fontSize: 13 }}>{sym}{fmt(stats.expenseAmt)}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              {[
                ['Solo válidos', () => setRows(r => r.map(row => ({ ...row, _include: row.status === 'valid' })))],
                ['Incluir todos', () => setRows(r => r.map(row => ({ ...row, _include: true })))],
                ['Ninguno', () => setRows(r => r.map(row => ({ ...row, _include: false })))],
              ].map(([label, fn]) => (
                <button key={label} style={{ ...s.btn, ...s.btnSecondary, fontSize: 12 }} onClick={fn}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ ...s.card, maxHeight: 420, overflowY: 'auto' }}>
            <table style={s.table}>
              <thead><tr>
                <th style={{ ...s.th, width: 32 }}></th>
                <th style={s.th}>Fecha</th><th style={s.th}>Descripción</th>
                <th style={s.th}>Monto</th><th style={s.th}>Tipo</th><th style={s.th}>Estado</th>
              </tr></thead>
              <tbody>{rows.map((row, i) => (
                <tr key={i} style={{ opacity: row._include ? 1 : .45 }}>
                  <td style={s.td}><input type="checkbox" checked={!!row._include} onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, _include: e.target.checked } : x))} /></td>
                  <td style={{ ...s.td, color: 'var(--th)' }}>{row.date || '—'}</td>
                  <td style={{ ...s.td, color: 'var(--tx)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description || '—'}</td>
                  <td style={{ ...s.td, color: row.type === 'income' ? 'var(--accent)' : 'var(--red)', fontWeight: 600 }}>{row.type === 'income' ? '+' : '−'}{sym}{fmt(row.amount)}</td>
                  <td style={{ ...s.td, color: 'var(--th)' }}>{row.type === 'income' ? 'Ingreso' : 'Gasto'}</td>
                  <td style={s.td}>
                    <span style={s.badge(row.status)}>{row.status === 'valid' ? 'Válido' : row.status === 'duplicate' ? 'Duplicado' : 'Error'}</span>
                    {row.errors?.length > 0 && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 2 }}>{row.errors.join(', ')}</div>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div style={{ background: 'rgba(0,212,170,.06)', border: '.5px solid rgba(0,212,170,.2)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--tx)', fontFamily: 'var(--mono)', marginBottom: 16 }}>
            Estos movimientos se guardarán como ingresos y gastos dentro de FinanceOS. Puedes omitir duplicados o filas con error antes de continuar.
          </div>

          <div style={s.btnRow}>
            <button style={{ ...s.btn, ...s.btnSecondary }} onClick={() => setStep(1)}>← Volver</button>
            <button style={{ ...s.btn, ...s.btnPrimary, opacity: importing ? .6 : 1 }}
              disabled={importing || stats.toImport === 0} onClick={handleImport}>
              {importing ? 'Importando…' : `Importar ${stats.toImport} movimiento${stats.toImport !== 1 ? 's' : ''} →`}
            </button>
          </div>
          <div style={s.disclaimer}>Esta función ayuda a importar y organizar movimientos. No constituye asesoría financiera, tributaria, legal ni de inversión.</div>
        </>
      )}

      {/* STEP 3 — Resultado */}
      {step === 3 && (
        <div style={s.card}>
          {result?.demo ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>◈</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)', marginBottom: 8 }}>Modo demo activo</div>
              <p style={{ fontSize: 13, color: 'var(--th)', fontFamily: 'var(--mono)' }}>En el modo demo no se guardan datos reales.</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 12, color: 'var(--accent)' }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>
                {result?.importedRows} movimiento{result?.importedRows !== 1 ? 's' : ''} importado{result?.importedRows !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '20px auto', maxWidth: 400 }}>
                <div style={s.summaryItem}><div style={s.summaryLabel}>Ingresos</div><div style={{ ...s.summaryVal, color: 'var(--accent)', fontSize: 14 }}>{sym}{fmt(result?.totalIncome)}</div></div>
                <div style={s.summaryItem}><div style={s.summaryLabel}>Gastos</div><div style={{ ...s.summaryVal, color: 'var(--red)', fontSize: 14 }}>{sym}{fmt(result?.totalExpense)}</div></div>
                <div style={s.summaryItem}><div style={s.summaryLabel}>Omitidos</div><div style={{ ...s.summaryVal, color: 'var(--th)', fontSize: 14 }}>{(result?.skippedRows||0)+(result?.duplicateRows||0)}</div></div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--th)', fontFamily: 'var(--mono)', marginBottom: 16 }}>Los movimientos ya aparecen en Dashboard e Ingresos/Gastos.</p>
              <button style={{ ...s.btn, ...s.btnPrimary }} onClick={reset}>Importar otro archivo</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
