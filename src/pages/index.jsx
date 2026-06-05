// src/pages/index.jsx — v1.2 (QA fixes)
// Fixes: filtro por mes, useMemo en todos los cálculos, prompt→modal,
//        currency como código limpio, loading states, cálculo ahorro correcto,
//        totalExpense filtrado en Budgets, validación saldo>inicial en Deudas

import { useState, useMemo } from 'react'
import useSubscriptionMetrics from '../hooks/useSubscriptionMetrics.js'
import { BackupWarning, ReportsDisclaimer } from '../components/legal/MicroCopy.jsx'
import BackupManager, { BackupStatusBadge } from '../components/backup/BackupManager.jsx'
import TemplateSelector from '../components/templates/TemplateSelector.jsx'
import { useApp } from '../context/AppContext.jsx'
import { KPI, Card, CardHeader, TxRow, BarRow, FormGroup, FormRow, Btn, Badge, Alert, Empty, ProgressBar, PageHeader } from '../components/ui/index.jsx'
import { fmtMoney, fmtPct, CAT_COLORS, CATS_INCOME, CATS_EXPENSE, METHODS, RECURRENCES, today } from '../utils/index.js'

const CURRENCY_SYMBOLS = { CLP: '$', USD: 'US$', EUR: '€', VES: 'Bs.' }
const CURRENCY_OPTIONS  = [
  { code: 'CLP', label: 'CLP — Peso chileno' },
  { code: 'USD', label: 'USD — Dólar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'VES', label: 'VES — Bolívar' },
]

const monthLabel = (m) => {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return `${['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+mo]} ${y}`
}

// ─── MONTH SELECTOR HELPER ─────────────────────────────────────────────────────
function MonthSelector({ incomes, expenses }) {
  const { settings, updateSettings } = useApp()
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const allDates = [...incomes.map(r => r.date), ...expenses.map(r => r.date)].filter(Boolean)
  const months   = [...new Set(allDates.map(d => d.slice(0, 7)))].sort().reverse()
  if (months.length === 0) return null
  return (
    <select value={activeMonth} onChange={e => updateSettings({ ...settings, activeMonth: e.target.value })}
      style={{ width: 'auto', fontSize: 11, padding: '5px 8px', marginLeft: 'auto' }}>
      {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
    </select>
  )
}

// ─── INCOME ───────────────────────────────────────────────────────────────────
export function Income() {
  const { incomes, addIncome, delIncome, settings } = useApp()
  const [f, setF]       = useState({ source: '', amount: '', date: today(), category: 'Salario', recurrence: 'Único', notes: '' })
  const [err, setErr]   = useState('')
  const [saving, setSaving] = useState(false)

  // FIX: filtro por mes activo
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const filtered    = useMemo(() => incomes.filter(r => r.date?.startsWith(activeMonth)), [incomes, activeMonth])
  const sym         = CURRENCY_SYMBOLS[settings.currency] || '$'

  const total = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered])
  const fixed = useMemo(() => filtered.filter(r => r.recurrence !== 'Único').reduce((s, r) => s + r.amount, 0), [filtered])

  // FIX: loading state para evitar doble submit
  async function submit() {
    if (!f.source.trim())                        { setErr('El nombre es requerido'); return }
    if (!f.amount || Number(f.amount) <= 0)       { setErr('Ingresa un monto válido'); return }
    setErr(''); setSaving(true)
    try { await addIncome({ ...f, amount: Number(f.amount) }) }
    catch { /* toast ya fue mostrado desde el contexto */ }
    finally {
      setSaving(false)
      setF({ source: '', amount: '', date: today(), category: 'Salario', recurrence: 'Único', notes: '' })
    }
  }

  return (
    <div className="stack">
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <PageHeader title="Ingresos" sub={`${monthLabel(activeMonth)} · ${filtered.length} registros`} />
        <MonthSelector incomes={incomes} expenses={[]} />
      </div>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <KPI label="Total mes" value={fmtMoney(total, sym)} color="green" />
        <KPI label="Fijo"      value={fmtMoney(fixed, sym)} sub={total > 0 ? fmtPct(fixed / total) + ' del total' : '-'} />
        <KPI label="Variable"  value={fmtMoney(total - fixed, sym)} sub={total > 0 ? fmtPct((total - fixed) / total) + ' del total' : '-'} />
      </div>
      <div className="grid2">
        <Card>
          <CardHeader title="Nuevo ingreso" />
          {err && <Alert type="danger">⚠ {err}</Alert>}
          <FormGroup label="Fuente / descripción">
            <input type="text" value={f.source} placeholder="ej. Salario, Freelance cliente A" onChange={e => setF(p => ({ ...p, source: e.target.value }))} />
          </FormGroup>
          <FormRow>
            <FormGroup label={`Monto (${settings.currency || 'CLP'})`}><input type="number" min="0" value={f.amount} placeholder="0" onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></FormGroup>
            <FormGroup label="Fecha"><input type="date" value={f.date} onChange={e => setF(p => ({ ...p, date: e.target.value }))} /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Categoría"><select value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))}>{CATS_INCOME.map(c => <option key={c}>{c}</option>)}</select></FormGroup>
            <FormGroup label="Recurrencia"><select value={f.recurrence} onChange={e => setF(p => ({ ...p, recurrence: e.target.value }))}>{RECURRENCES.map(r => <option key={r}>{r}</option>)}</select></FormGroup>
          </FormRow>
          <FormGroup label="Notas"><input type="text" value={f.notes} placeholder="opcional" onChange={e => setF(p => ({ ...p, notes: e.target.value }))} /></FormGroup>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* FIX: disabled durante saving */}
            <Btn variant="primary" onClick={submit} disabled={saving}>{saving ? 'Guardando…' : '+ Registrar'}</Btn>
            <Btn variant="ghost" onClick={() => { setF({ source: '', amount: '', date: today(), category: 'Salario', recurrence: 'Único', notes: '' }); setErr('') }}>Limpiar</Btn>
          </div>
        </Card>
        <Card>
          <CardHeader title={`Historial (${filtered.length})`} />
          {filtered.length === 0 ? <div style={{textAlign:'center',padding:'24px 0'}}>
              <div style={{fontSize:13,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12}}>Aún no tienes ingresos registrados.</div>
              <button onClick={()=>{ setF({source:'',amount:'',date:today(),category:'Salario',recurrence:'Mensual',notes:''}); }} style={{background:'var(--grn)',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Agregar ingreso</button>
            </div> :
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {filtered.map(r => <TxRow key={r.id} dot={CAT_COLORS[r.category] || '#888'} name={r.source}
                meta={`${r.category} · ${r.date.slice(5).replace('-', '/')}${r.recurrence !== 'Único' ? ' · ' + r.recurrence : ''}`}
                amount={fmtMoney(r.amount, sym)} isIncome onDelete={() => delIncome(r.id)} />)}
            </div>
          }
        </Card>
      </div>
    </div>
  )
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
import ChartCard from '../components/charts/ChartCard.jsx'
import MoneyFlow from '../components/charts/MoneyFlow.jsx'
import CategoryDonut from '../components/charts/CategoryDonut.jsx'
import HorizontalBars from '../components/charts/HorizontalBars.jsx'

export function Expenses() {
  const { expenses, addExpense, delExpense, settings } = useApp()
  const [f, setF]         = useState({ description: '', amount: '', date: today(), category: 'Alimentación', method: 'Débito', type: 'Necesidad', recurrence: 'Único', notes: '' })
  const [err, setErr]     = useState('')
  const [saving, setSaving] = useState(false)

  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const filtered    = useMemo(() => expenses.filter(r => r.date?.startsWith(activeMonth)), [expenses, activeMonth])
  const sym         = CURRENCY_SYMBOLS[settings.currency] || '$'

  const total     = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered])
  const necesidad = useMemo(() => filtered.filter(r => r.type === 'Necesidad').reduce((s, r) => s + r.amount, 0), [filtered])

  async function submit() {
    if (!f.description.trim())                  { setErr('La descripción es requerida'); return }
    if (!f.amount || Number(f.amount) <= 0)      { setErr('Ingresa un monto válido'); return }
    setErr(''); setSaving(true)
    try { await addExpense({ ...f, amount: Number(f.amount) }) }
    catch {}
    finally {
      setSaving(false)
      setF({ description: '', amount: '', date: today(), category: 'Alimentación', method: 'Débito', type: 'Necesidad', recurrence: 'Único', notes: '' })
    }
  }

  return (
    <div className="stack">
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <PageHeader title="Gastos" sub={`${monthLabel(activeMonth)} · ${filtered.length} registros`} />
        <MonthSelector incomes={[]} expenses={expenses} />
      </div>
      <p style={{fontSize:12,color:"var(--th)",fontFamily:"var(--mono)",marginBottom:12,marginTop:-8}}>Registra salidas y entiende tus categorías principales.</p>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <KPI label="Total mes"   value={fmtMoney(total, sym)}           color="red" />
        <KPI label="Necesidades" value={fmtMoney(necesidad, sym)}       sub={total > 0 ? fmtPct(necesidad / total) + ' del gasto' : '-'} />
        <KPI label="Deseos"      value={fmtMoney(total - necesidad, sym)} sub={total > 0 ? fmtPct((total - necesidad) / total) + ' del gasto' : '-'} />
      </div>
      <div className="grid2">
        <Card>
          <CardHeader title="Nuevo gasto" />
          {err && <Alert type="danger">⚠ {err}</Alert>}
          <FormGroup label="Descripción"><input type="text" value={f.description} placeholder="ej. Supermercado Lider" onChange={e => setF(p => ({ ...p, description: e.target.value }))} /></FormGroup>
          <FormRow>
            <FormGroup label={`Monto (${settings.currency || 'CLP'})`}><input type="number" min="0" value={f.amount} placeholder="0" onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></FormGroup>
            <FormGroup label="Fecha"><input type="date" value={f.date} onChange={e => setF(p => ({ ...p, date: e.target.value }))} /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Categoría"><select value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))}>{CATS_EXPENSE.map(c => <option key={c}>{c}</option>)}</select></FormGroup>
            <FormGroup label="Tipo"><select value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value }))}>{['Necesidad', 'Deseo'].map(t => <option key={t}>{t}</option>)}</select></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Método pago"><select value={f.method} onChange={e => setF(p => ({ ...p, method: e.target.value }))}>{METHODS.map(m => <option key={m}>{m}</option>)}</select></FormGroup>
            <FormGroup label="Recurrencia"><select value={f.recurrence} onChange={e => setF(p => ({ ...p, recurrence: e.target.value }))}>{RECURRENCES.map(r => <option key={r}>{r}</option>)}</select></FormGroup>
          </FormRow>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" onClick={submit} disabled={saving}>{saving ? 'Guardando…' : '+ Registrar'}</Btn>
            <Btn variant="ghost" onClick={() => { setF({ description: '', amount: '', date: today(), category: 'Alimentación', method: 'Débito', type: 'Necesidad', recurrence: 'Único', notes: '' }); setErr('') }}>Limpiar</Btn>
          </div>
        </Card>
        <Card>
          <CardHeader title={`Historial (${filtered.length})`} />
          {filtered.length === 0 ? <div style={{textAlign:'center',padding:'24px 0'}}>
              <div style={{fontSize:13,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12}}>Aún no tienes gastos registrados.</div>
              <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
                <button onClick={()=>{ setF({description:'',amount:'',date:today(),category:'Alimentación',method:'Débito',type:'Necesidad',recurrence:'Único',notes:''}); }} style={{background:'var(--grn)',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Agregar gasto</button>
              </div>
            </div> :
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {filtered.map(r => <TxRow key={r.id} dot={CAT_COLORS[r.category] || '#888'} name={r.description}
                meta={`${r.category} · ${r.date.slice(5).replace('-', '/')}${r.type === 'Deseo' ? ' · Deseo' : ''}`}
                amount={fmtMoney(r.amount, sym)} isIncome={false} onDelete={() => delExpense(r.id)} />)}
            </div>
          }
        </Card>
      </div>

      {/* Visual Insights — Gastos */}
      {filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
          <ChartCard title="Distribución por categoría" subtitle={monthLabel(activeMonth)} minHeight={160}>
            <CategoryDonut records={filtered} sym={sym} maxCategories={6} />
          </ChartCard>
          <ChartCard title="Top categorías de gasto" subtitle={monthLabel(activeMonth)} minHeight={160}>
            <HorizontalBars records={filtered} sym={sym} maxItems={6} />
          </ChartCard>
        </div>
      )}
    </div>
  )
}

// ─── BUDGETS ──────────────────────────────────────────────────────────────────
import BudgetProgressList from '../components/charts/BudgetProgressList.jsx'

export function Budgets() {
  const { budgets, addBudget, delBudget, expenses, settings } = useApp()
  const [f, setF]   = useState({ category: 'Vivienda', limit: '' })
  const [err, setErr] = useState('')
  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'

  // FIX: filtrar gastos por mes activo para cálculo de presupuesto
  const activeMonth  = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const mExpenses    = useMemo(() => expenses.filter(r => r.date?.startsWith(activeMonth)), [expenses, activeMonth])

  const expByCat     = useMemo(() => { const m = {}; mExpenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount }); return m }, [mExpenses])
  const totalBudget  = useMemo(() => budgets.reduce((s, b) => s + b.limit, 0), [budgets])

  // FIX: solo gastos de categorías con presupuesto definido
  const budgetedCats   = useMemo(() => new Set(budgets.map(b => b.category)), [budgets])
  const totalBudgeted  = useMemo(() => mExpenses.filter(e => budgetedCats.has(e.category)).reduce((s, r) => s + r.amount, 0), [mExpenses, budgetedCats])
  const overBudget     = useMemo(() => budgets.filter(b => (expByCat[b.category] || 0) > b.limit), [budgets, expByCat])

  async function submit() {
    if (!f.limit || Number(f.limit) <= 0)                          { setErr('Ingresa un límite válido'); return }
    if (budgets.find(b => b.category === f.category))              { setErr('Ya existe presupuesto para esta categoría'); return }
    setErr('')
    await addBudget({ ...f, limit: Number(f.limit) })
    setF({ category: 'Vivienda', limit: '' })
  }

  return (
    <div className="stack">
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <PageHeader title="Presupuestos" sub={`Límites mensuales · ${monthLabel(activeMonth)}`} />
        <MonthSelector incomes={[]} expenses={expenses} />
      </div>
      <p style={{fontSize:12,color:"var(--th)",fontFamily:"var(--mono)",marginBottom:12,marginTop:-8}}>Compara gasto usado vs presupuesto disponible por categoría.</p>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <KPI label="Presupuesto total"    value={fmtMoney(totalBudget, sym)} />
        {/* FIX: gastado = solo categorías con presupuesto */}
        <KPI label="Gastado (con presup.)" value={fmtMoney(totalBudgeted, sym)} color="red" sub={totalBudget > 0 ? fmtPct(totalBudgeted / totalBudget) : '-'} />
        <KPI label="Categorías excedidas"  value={overBudget.length} color={overBudget.length > 0 ? 'red' : 'green'} sub={overBudget.length > 0 ? 'revisar' : 'todo en orden'} />
      </div>
      {overBudget.length > 0 && <Alert type="danger">⚠ {overBudget.map(b => b.category).join(', ')} superaron el límite mensual.</Alert>}
      {/* Fila 1: Formulario + Donut resumen */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16,marginBottom:16}}>
        <Card>
          <CardHeader title="Nuevo presupuesto" />
          {err && <Alert type="danger">⚠ {err}</Alert>}
          <FormRow>
            <FormGroup label="Categoría"><select value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))}>{CATS_EXPENSE.map(c => <option key={c}>{c}</option>)}</select></FormGroup>
            <FormGroup label={`Límite mensual (${settings.currency || 'CLP'})`}><input type="number" min="0" value={f.limit} placeholder="0" onChange={e => setF(p => ({ ...p, limit: e.target.value }))} /></FormGroup>
          </FormRow>
          <Btn variant="primary" onClick={submit}>+ Agregar presupuesto</Btn>
        </Card>
        <Card>
          <CardHeader title={`Resumen · ${monthLabel(activeMonth)}`} />
          {budgets.length === 0 ? (
            <div style={{textAlign:'center',padding:'24px 0'}}>
              <div style={{fontSize:13,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12}}>Aún no tienes presupuestos.</div>
            </div>
          ) : (() => {
            const total = budgets.reduce((s,b) => s+b.limit, 0)
            const gastado = budgets.reduce((s,b) => s+(expByCat[b.category]||0), 0)
            const disponible = Math.max(0, total - gastado)
            const pct = total > 0 ? gastado/total : 0
            const r = 60, cx = 80, cy = 80
            const circ = 2 * Math.PI * r
            const dash = Math.min(pct, 1) * circ
            const strokeColor = pct >= 1 ? '#e84142' : pct >= 0.8 ? 'var(--amber,#f5a623)' : 'var(--grn)'
            return (
              <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
                <div style={{flexShrink:0}}>
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--brd)" strokeWidth="16"/>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={strokeColor} strokeWidth="16"
                      strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"/>
                    <text x={cx} y={cy-10} textAnchor="middle" fontSize="18" fill={strokeColor} fontWeight="700" fontFamily="var(--mono)">{(pct*100).toFixed(0)}%</text>
                    <text x={cx} y={cy+8} textAnchor="middle" fontSize="9" fill="var(--th)" fontFamily="var(--mono)">usado</text>
                    <text x={cx} y={cy+22} textAnchor="middle" fontSize="8" fill="var(--th)" fontFamily="var(--mono)">del total</text>
                  </svg>
                </div>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{background:'var(--sur2)',borderRadius:6,padding:'8px 12px'}}>
                    <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:2}}>PRESUPUESTO TOTAL</div>
                    <div style={{fontSize:14,fontWeight:700,color:'var(--tx)',fontFamily:'var(--mono)'}}>{fmtMoney(total,sym)}</div>
                  </div>
                  <div style={{background:'var(--sur2)',borderRadius:6,padding:'8px 12px'}}>
                    <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:2}}>GASTADO</div>
                    <div style={{fontSize:14,fontWeight:700,color:strokeColor,fontFamily:'var(--mono)'}}>{fmtMoney(gastado,sym)}</div>
                  </div>
                  <div style={{background:'var(--sur2)',borderRadius:6,padding:'8px 12px'}}>
                    <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:2}}>DISPONIBLE</div>
                    <div style={{fontSize:14,fontWeight:700,color:'var(--grn)',fontFamily:'var(--mono)'}}>{fmtMoney(disponible,sym)}</div>
                  </div>
                </div>
              </div>
            )
          })()}
        </Card>
      </div>

      {/* Fila 2: Tarjetas por categoría con donut */}
      {budgets.length > 0 && (
        <div>
          <div style={{fontFamily:'var(--mono)',fontSize:11,letterSpacing:'1px',textTransform:'uppercase',color:'var(--grn2)',marginBottom:12}}>
            Avance por categoría · {monthLabel(activeMonth)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
            {budgets.map(b => {
              const spent = expByCat[b.category] || 0
              const pct = b.limit > 0 ? spent/b.limit : 0
              const over = spent > b.limit
              const warn = !over && pct >= 0.8
              const strokeColor = over ? '#e84142' : warn ? 'var(--amber,#f5a623)' : 'var(--grn)'
              const r = 36, cx = 50, cy = 50
              const circ = 2 * Math.PI * r
              const dash = Math.min(pct, 1) * circ
              return (
                <div key={b.id} style={{background:'var(--sur2)',borderRadius:10,padding:'14px',border:`0.5px solid ${over?'#e84142':warn?'rgba(245,166,35,.3)':'var(--brd)'}`,display:'flex',flexDirection:'column',alignItems:'center',gap:8,position:'relative'}}>
                  <button onClick={() => delBudget(b.id)} style={{position:'absolute',top:8,right:8,background:'none',border:'none',color:'var(--th)',fontSize:11,cursor:'pointer',padding:'2px 5px',borderRadius:4,lineHeight:1}}>✕</button>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--tx)',fontFamily:'var(--mono)',textAlign:'center',maxWidth:120,lineHeight:1.3}}>{b.category}</div>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--brd)" strokeWidth="10"/>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={strokeColor} strokeWidth="10"
                      strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"/>
                    <text x={cx} y={cy-5} textAnchor="middle" fontSize="11" fill={strokeColor} fontWeight="700" fontFamily="var(--mono)">{(pct*100).toFixed(0)}%</text>
                    <text x={cx} y={cy+8} textAnchor="middle" fontSize="7" fill="var(--th)" fontFamily="var(--mono)">{over?'EXCEDIDO':warn?'ATENCIÓN':'en rango'}</text>
                  </svg>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:12,fontWeight:700,color:strokeColor,fontFamily:'var(--mono)'}}>{fmtMoney(spent,sym)}</div>
                    <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)'}}>de {fmtMoney(b.limit,sym)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DEBTS ────────────────────────────────────────────────────────────────────
import DebtProgressList from '../components/charts/DebtProgressList.jsx'

export function Debts() {
  const { debts, addDebt, delDebt, settings } = useApp()
  const [show, setShow] = useState(false)
  const [f, setF]       = useState({ creditor: '', initial: '', balance: '', minPayment: '', dueDate: '', rate: '', totalInstallments: '', paidInstallments: '' })
  const [err, setErr]   = useState('')
  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'

  const totalBalance = useMemo(() => debts.reduce((s, d) => s + d.balance, 0), [debts])
  const totalMin     = useMemo(() => debts.reduce((s, d) => s + d.minPayment, 0), [debts])

  async function submit() {
    if (!f.creditor.trim() || !f.balance || Number(f.balance) <= 0) { setErr('Acreedor y saldo son requeridos'); return }
    const init = Number(f.initial) || Number(f.balance)
    // FIX: validar que saldo no supere inicial (evita progreso negativo)
    if (Number(f.balance) > init) { setErr('El saldo actual no puede superar el monto inicial'); return }
    setErr('')
    await addDebt({ ...f, initial: init, balance: Number(f.balance), minPayment: Number(f.minPayment) || 0, rate: Number(f.rate) || 0, totalInstallments: Number(f.totalInstallments) || 0, paidInstallments: Number(f.paidInstallments) || 0 })
    setF({ creditor: '', initial: '', balance: '', minPayment: '', dueDate: '', rate: '', totalInstallments: '', paidInstallments: '' })
    setShow(false)
  }

  return (
    <div className="stack">
      <PageHeader title="Deudas" sub="Seguimiento de obligaciones financieras" />
      <p style={{fontSize:12,color:"var(--th)",fontFamily:"var(--mono)",marginBottom:12,marginTop:-4}}>Sigue saldo pendiente y avance de pago por deuda.</p>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <KPI label="Deuda total"       value={fmtMoney(totalBalance, sym)} color="red" />
        <KPI label="Pago mín. mensual" value={fmtMoney(totalMin, sym)} />
        <KPI label="Deudas activas"    value={debts.length} />
        <KPI label="Total pagado"      value={fmtMoney(debts.reduce((s,d)=>s+Math.max(0,(Number(d.initial)||Number(d.balance)||0)-Number(d.balance||0)),0), sym)} color="green" />
      </div>
      <div><Btn variant="primary" onClick={() => setShow(s => !s)}>{show ? '— Cerrar' : '+ Nueva deuda'}</Btn></div>
      {show && (
        <Card>
          <CardHeader title="Nueva deuda" />
          {err && <Alert type="danger">⚠ {err}</Alert>}
          <FormRow>
            <FormGroup label="Acreedor"><input type="text" value={f.creditor} placeholder="ej. Banco, Persona" onChange={e => setF(p => ({ ...p, creditor: e.target.value }))} /></FormGroup>
            <FormGroup label={`Saldo actual (${settings.currency || 'CLP'})`}><input type="number" min="0" value={f.balance} placeholder="0" onChange={e => setF(p => ({ ...p, balance: e.target.value }))} /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Monto inicial"><input type="number" min="0" value={f.initial} placeholder="Si no sabes, igual al saldo" onChange={e => setF(p => ({ ...p, initial: e.target.value }))} /></FormGroup>
            <FormGroup label="Pago mínimo"><input type="number" min="0" value={f.minPayment} placeholder="0" onChange={e => setF(p => ({ ...p, minPayment: e.target.value }))} /></FormGroup>
          </FormRow>
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setF(p => ({ ...p, _showExtra: !p._showExtra }))}
              style={{ background: 'none', border: 'none', color: 'var(--grn)', fontSize: 12, fontFamily: 'var(--mono)', cursor: 'pointer', padding: 0 }}
            >
              {f._showExtra ? '▲ Menos opciones' : '▼ Más opciones (tasa, cuotas, vencimiento)'}
            </button>
          </div>
          {f._showExtra && (
            <>
              <FormRow>
                <FormGroup label="Fecha vencimiento"><input type="date" value={f.dueDate} onChange={e => setF(p => ({ ...p, dueDate: e.target.value }))} /></FormGroup>
                <FormGroup label="Tasa anual % (TAE)"><input type="number" min="0" max="200" value={f.rate} placeholder="0" onChange={e => setF(p => ({ ...p, rate: e.target.value }))} /></FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup label="Cuotas totales"><input type="number" min="0" value={f.totalInstallments} placeholder="ej. 36" onChange={e => setF(p => ({ ...p, totalInstallments: e.target.value }))} /></FormGroup>
                <FormGroup label="Cuotas pagadas"><input type="number" min="0" value={f.paidInstallments} placeholder="ej. 12" onChange={e => setF(p => ({ ...p, paidInstallments: e.target.value }))} /></FormGroup>
              </FormRow>
            </>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" onClick={submit}>+ Registrar deuda</Btn>
            <Btn variant="ghost" onClick={() => setShow(false)}>Cancelar</Btn>
          </div>
        </Card>
      )}
      {debts.length === 0 && !show && <Card><div style={{textAlign:'center',padding:'24px 0'}}>
              <div style={{fontSize:13,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12}}>Aún no tienes deudas registradas.</div>
              <button onClick={()=>setShow(true)} style={{background:'var(--grn)',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Agregar deuda</button>
            </div></Card>}
      {debts.map(d => {
        // FIX: Math.max(0, ...) para evitar progreso negativo
        const paid        = Math.max(0, d.initial - d.balance)
        const prog        = d.initial > 0 ? paid / d.initial : 0
        const totalInst   = Number(d.totalInstallments) || 0
        const paidInst    = Number(d.paidInstallments)  || 0
        const pendInst    = totalInst > 0 ? Math.max(0, totalInst - paidInst) : 0
        const instProg    = totalInst > 0 ? paidInst / totalInst : 0
        // Simulador: meses restantes y fecha estimada fin
        const monthsLeft  = d.minPayment > 0 && d.balance > 0
          ? Math.ceil(d.balance / d.minPayment)
          : pendInst > 0 ? pendInst : 0
        const finDate     = monthsLeft > 0
          ? new Date(Date.now() + monthsLeft * 30 * 24 * 60 * 60 * 1000)
              .toLocaleDateString('es-CL', { month:'short', year:'numeric' })
          : null
        return (
          <Card key={d.id}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--tx)' }}>{d.creditor}</div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                {d.rate > 0 && <Badge color="red">{d.rate}% TAE</Badge>}
                <button onClick={() => delDebt(d.id)} style={{ background:'none', border:'none', color:'var(--th)', fontSize:11, cursor:'pointer' }}>✕</button>
              </div>
            </div>

            {/* Info básica */}
            <div style={{ fontSize:11, color:'var(--th)', fontFamily:'var(--mono)', marginBottom:8 }}>
              Saldo: {fmtMoney(d.balance, sym)}
              {d.minPayment ? ` · Cuota: ${fmtMoney(d.minPayment, sym)}/mes` : ''}
              {d.dueDate ? ` · Vence: ${d.dueDate.slice(5).replace('-','/')}` : ''}
            </div>

            {/* Progreso por monto */}
            <div style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
                fontFamily:'var(--mono)', color:'var(--th)', marginBottom:3 }}>
                <span>Progreso por monto</span>
                <span>{fmtPct(prog)} pagado</span>
              </div>
              <ProgressBar value={paid} max={d.initial} color="green" height={5}/>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:3,
                fontSize:10, fontFamily:'var(--mono)', color:'var(--th)' }}>
                <span>Pagado: {fmtMoney(paid, sym)}</span>
                <span>Inicial: {fmtMoney(d.initial, sym)}</span>
              </div>
            </div>

            {/* Progreso por cuotas */}
            {totalInst > 0 && (
              <div style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
                  fontFamily:'var(--mono)', color:'var(--th)', marginBottom:3 }}>
                  <span>Cuotas</span>
                  <span>{paidInst}/{totalInst}</span>
                </div>
                <div style={{ height:5, background:'var(--brd)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(instProg*100,100)}%`,
                    background:'var(--accent,#00d4aa)', borderRadius:3, transition:'.3s' }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:3,
                  fontSize:10, fontFamily:'var(--mono)' }}>
                  <span style={{ color:'var(--accent,#00d4aa)' }}>✅ Pagadas: {paidInst}</span>
                  <span style={{ color:'var(--amb,#f5a623)' }}>⏳ Pendientes: {pendInst}</span>
                </div>
              </div>
            )}

            {/* Simulador — tiempo restante */}
            {monthsLeft > 0 && (
              <div style={{ marginTop:6, padding:'8px 10px', borderRadius:6,
                background:'rgba(0,212,170,.06)', border:'.5px solid rgba(0,212,170,.2)',
                display:'flex', gap:16, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontSize:9, color:'var(--th)', fontFamily:'var(--mono)',
                    textTransform:'uppercase', letterSpacing:'.5px', marginBottom:2 }}>
                    Meses restantes
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--tx)',
                    fontFamily:'var(--mono)' }}>{monthsLeft}</div>
                </div>
                {finDate && (
                  <div>
                    <div style={{ fontSize:9, color:'var(--th)', fontFamily:'var(--mono)',
                      textTransform:'uppercase', letterSpacing:'.5px', marginBottom:2 }}>
                      Fin estimado
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--accent,#00d4aa)',
                      fontFamily:'var(--mono)' }}>📅 {finDate}</div>
                  </div>
                )}
                {d.minPayment > 0 && (
                  <div>
                    <div style={{ fontSize:9, color:'var(--th)', fontFamily:'var(--mono)',
                      textTransform:'uppercase', letterSpacing:'.5px', marginBottom:2 }}>
                      Total restante a pagar
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--red)',
                      fontFamily:'var(--mono)' }}>{fmtMoney(d.balance, sym)}</div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )
      })}
      {debts.length > 0 && (
        <DebtProgressList debts={debts} sym={sym} />
      )}
    </div>
  )
}

// ─── GOALS ────────────────────────────────────────────────────────────────────
import GoalProgressList from '../components/charts/GoalProgressList.jsx'

export function Goals({ setPage }) {
  const { goals, addGoal, delGoal, updateGoal, settings } = useApp()
  const [show, setShow]         = useState(false)
  const [f, setF]               = useState({ name: '', target: '', saved: '', targetDate: '', priority: 'Media', color: '#1a6b4a' })
  const [err, setErr]           = useState('')
  const [savingId, setSavingId] = useState(null) // FIX: mini-modal por meta
  const [addAmt, setAddAmt]     = useState('')

  const isChile = (settings.country || 'CL') === 'CL'

  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'

  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.target, 0), [goals])
  const totalSaved  = useMemo(() => goals.reduce((s, g) => s + g.saved,  0), [goals])

  async function submit() {
    if (!f.name.trim() || !f.target || Number(f.target) <= 0) { setErr('Nombre y monto objetivo son requeridos'); return }
    setErr('')
    await addGoal({ ...f, target: Number(f.target), saved: Number(f.saved) || 0 })
    setF({ name: '', target: '', saved: '', targetDate: '', priority: 'Media', color: '#1a6b4a' })
    setShow(false)
  }

  // FIX: reemplaza prompt() por modal inline — compatible con iOS PWA
  async function confirmAddSaving(goal) {
    const n = Number(addAmt)
    if (!addAmt || isNaN(n) || n <= 0) return
    await updateGoal({ ...goal, saved: Math.min(goal.saved + n, goal.target) })
    setSavingId(null); setAddAmt('')
  }

  return (
    <div className="stack">
      <PageHeader title="Metas de ahorro" sub="Objetivos financieros con seguimiento visual" />
      <p style={{fontSize:12,color:"var(--th)",fontFamily:"var(--mono)",marginBottom:12,marginTop:-4}}>Mide el progreso hacia tus objetivos de ahorro.</p>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <KPI label="Metas activas"   value={goals.length} />
        <KPI label="Total objetivo"  value={fmtMoney(totalTarget, sym)} />
        <KPI label="Total ahorrado"  value={fmtMoney(totalSaved, sym)} color="green" sub={totalTarget > 0 ? fmtPct(totalSaved / totalTarget) + ' del total' : '-'} />
        <KPI label="Completadas"     value={goals.filter(g => g.saved >= g.target).length} color="green" />
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <Btn variant="primary" onClick={() => setShow(s => !s)}>{show ? '— Cerrar' : '+ Nueva meta'}</Btn>

      </div>

      {show && (
        <Card>
          <CardHeader title="Nueva meta" />
          {err && <Alert type="danger">⚠ {err}</Alert>}
          <FormGroup label="Nombre de la meta"><input type="text" value={f.name} placeholder="ej. Fondo de emergencia, Viaje" onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></FormGroup>
          <FormRow>
            <FormGroup label={`Monto objetivo (${settings.currency || 'CLP'})`}><input type="number" min="0" value={f.target} placeholder="0" onChange={e => setF(p => ({ ...p, target: e.target.value }))} /></FormGroup>
            <FormGroup label="Ahorrado hasta hoy"><input type="number" min="0" value={f.saved} placeholder="0" onChange={e => setF(p => ({ ...p, saved: e.target.value }))} /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Fecha objetivo"><input type="date" value={f.targetDate} onChange={e => setF(p => ({ ...p, targetDate: e.target.value }))} /></FormGroup>
            <FormGroup label="Prioridad"><select value={f.priority} onChange={e => setF(p => ({ ...p, priority: e.target.value }))}>{['Alta', 'Media', 'Baja'].map(p => <option key={p}>{p}</option>)}</select></FormGroup>
          </FormRow>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" onClick={submit}>+ Crear meta</Btn>
            <Btn variant="ghost" onClick={() => setShow(false)}>Cancelar</Btn>
          </div>
        </Card>
      )}
      {goals.length === 0 && !show && <Card><div style={{textAlign:'center',padding:'24px 0'}}>
              <div style={{fontSize:13,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12}}>Aún no tienes metas de ahorro. Crea una para hacer seguimiento de tus objetivos.</div>
              <button onClick={()=>setShow(true)} style={{background:'var(--grn)',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Crear meta</button>
            </div></Card>}
      {goals.map(g => {
        const p    = g.target > 0 ? Math.min(g.saved / g.target, 1) : 0
        const done = g.saved >= g.target
        return (
          <Card key={g.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</div>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 2 }}>
                  {g.priority} prioridad{g.targetDate ? ` · Meta: ${g.targetDate.slice(0, 7).replace('-', '/')}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Badge color={done ? 'green' : p >= 0.7 ? 'amber' : 'blue'}>{fmtPct(p)}</Badge>
                <button onClick={() => delGoal(g.id)} style={{ background: 'none', border: 'none', color: 'var(--th)', fontSize: 11, cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            <ProgressBar value={g.saved} max={g.target} color={done ? 'green' : p >= 0.6 ? 'amber' : 'blue'} height={6} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)' }}>{fmtMoney(g.saved, sym)} / {fmtMoney(g.target, sym)}</span>
              {done
                ? <Badge color="green">Completada</Badge>
                : savingId === g.id
                  // FIX: mini-modal inline en lugar de prompt() — compatible iOS PWA
                  ? <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="number" min="0" value={addAmt} placeholder="Monto" autoFocus
                        style={{ width: 90, padding: '4px 7px', fontSize: 11 }}
                        onChange={e => setAddAmt(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && confirmAddSaving(g)} />
                      <Btn variant="primary" size="xs" onClick={() => confirmAddSaving(g)}>OK</Btn>
                      <Btn variant="ghost" size="xs" onClick={() => { setSavingId(null); setAddAmt('') }}>×</Btn>
                    </div>
                  : <Btn variant="ghost" size="xs" onClick={() => { setSavingId(g.id); setAddAmt('') }}>+ Agregar ahorro</Btn>
              }
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area, ReferenceLine,
} from 'recharts'

// Custom tooltip para Recharts con tema de la app
const ChartTooltip = ({ active, payload, label, sym }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--sur)', border: '0.5px solid var(--brd2)', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontFamily: 'var(--mono)', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}>
      {label && <div style={{ color: 'var(--tm)', marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--tx)', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 500 }}>{sym}{Math.abs(p.value).toLocaleString('es-CL')}</span>
        </div>
      ))}

      {/* Visual Insights — Metas */}
      {goals.length > 0 && (
        <GoalProgressList goals={goals} sym={sym} />
      )}
    </div>
  )
}

export function Reports() {
  const { incomes, expenses, budgets, debts: allDebts, subscriptions: allSubs, settings } = useApp()
  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'
  const subMetrics = useSubscriptionMetrics()

  const activeMonth  = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const mIncomes     = useMemo(() => incomes.filter(r => r.date?.startsWith(activeMonth)),  [incomes,  activeMonth])
  const mExpenses    = useMemo(() => expenses.filter(r => r.date?.startsWith(activeMonth)), [expenses, activeMonth])

  const totalIncome  = useMemo(() => mIncomes.reduce((s, r)  => s + r.amount, 0), [mIncomes])
  const totalExpense = useMemo(() => mExpenses.reduce((s, r) => s + r.amount, 0), [mExpenses])

  const totalSubs    = useMemo(() => (Array.isArray(allSubs) ? allSubs : [])
    .filter(s => s?.status === 'active')
    .reduce((s, sub) => {
      const amt = Number(sub.amount) || 0
      const f   = sub.frequency || 'monthly'
      if (f === 'annual' || f === 'anual') return s + amt / 12
      if (f === 'quarterly') return s + amt / 3
      if (f === 'weekly') return s + amt * 4.33
      return s + amt
    }, 0), [allSubs])
  const totalDebt    = useMemo(() => (Array.isArray(allDebts) ? allDebts : []).reduce((s, d) => s + (Number(d.minPayment) || 0), 0), [allDebts])
  const balance      = totalIncome - totalExpense - totalDebt - totalSubs
  const savingRate   = totalIncome > 0 ? Math.max(0, balance) / totalIncome : 0
  const necesidad    = useMemo(() => mExpenses.filter(r => r.type === 'Necesidad').reduce((s, r) => s + r.amount, 0), [mExpenses])
  const deseos       = useMemo(() => mExpenses.filter(r => r.type === 'Deseo').reduce((s, r)    => s + r.amount, 0), [mExpenses])
  const expByCat     = useMemo(() => { const m = {}; mExpenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount }); return m }, [mExpenses])
  const overBudget   = useMemo(() => budgets.filter(b => (expByCat[b.category] || 0) > b.limit), [budgets, expByCat])
  const neededToSave = Math.max(0, totalIncome * (settings.savingGoalPct / 100 || 0.25) - Math.max(0, balance))

  // ── Donut data ───────────────────────────────────────────────────────────
  const donutData = useMemo(() =>
    Object.entries(expByCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value, color: CAT_COLORS[name] || '#888780' }))
  , [expByCat])

  // ── Tendencia 6 meses ─────────────────────────────────────────────────────
  const trendData = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d   = new Date()
      d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      const lbl = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()]
      const inc = incomes.filter(r  => r.date?.startsWith(key)).reduce((s, r) => s + r.amount, 0)
      const exp = expenses.filter(r => r.date?.startsWith(key)).reduce((s, r) => s + r.amount, 0)
      months.push({ mes: lbl, Ingresos: inc, Gastos: exp, Ahorro: Math.max(0, inc - exp) })
    }
    return months
  }, [incomes, expenses])

  const tooltipProps = { content: <ChartTooltip sym={sym} /> }
  const axisStyle    = { fill: 'var(--th)', fontSize: 10 }
  const gridStyle    = { stroke: 'rgba(0,0,0,0.05)', strokeDasharray: '3 3' }

  return (
    <div className="stack">
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <PageHeader title="Reportes" sub={`${monthLabel(activeMonth)} · orientación general, no asesoría certificada`} />
        <MonthSelector incomes={incomes} expenses={expenses} />
      </div>

      {/* KPI strip */}
      <div className="kpi-row">
        <KPI label="Balance neto"  value={fmtMoney(balance, sym)}      color={balance >= 0 ? 'green' : 'red'} />
        <KPI label="Tasa ahorro"   value={fmtPct(savingRate)}          color={savingRate >= 0.25 ? 'green' : savingRate >= 0.1 ? 'amber' : 'red'} sub={`Meta: ${settings.savingGoalPct || 25}%`} />
        <KPI label="Ingresos"      value={fmtMoney(totalIncome, sym)} />
        <KPI label="Suscripciones" value={fmtMoney(totalSubs, sym)} color="amber" sub="pagos recurrentes" />
        <KPI label="Gastos"        value={fmtMoney(totalExpense, sym)} color="red" />
      </div>

      {/* Gráficos principales */}
      <div className="grid2">

        {/* Flujo de dinero del mes */}
        <Card>
          <CardHeader title="Flujo de dinero del mes" />
          <MoneyFlow
            incomes={mIncomes}
            expenses={mExpenses}
            subscriptions={Array.isArray(allSubs) ? allSubs : []}
            debts={Array.isArray(allDebts) ? allDebts : []}
            sym={sym}
          />
        </Card>

        {/* Donut — gastos por categoría */}
        <Card>
          <CardHeader title="Gastos por categoría" />
          <CategoryDonut records={mExpenses} sym={sym} maxCategories={6} />
        </Card>

        {/* Regla 50/30/20 */}
        <Card>
          <CardHeader title="Regla 50/30/20" />
          {totalIncome === 0
            ? <Empty text="Registra ingresos para ver el análisis" />
            : (() => {
                const rules = [
                  { label: 'Necesidades + Deudas', actual: necesidad + totalDebt, ideal: totalIncome * 0.5, color: 'var(--grn)', max: 50 },
                  { label: 'Deseos',      actual: deseos,    ideal: totalIncome * 0.3, color: 'var(--amb)', max: 30 },
                  { label: 'Ahorro',      actual: Math.max(0, balance), ideal: totalIncome * 0.2, color: 'var(--blu)', max: 20 },
                ]
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {rules.map(r => {
                      const actualPct = totalIncome > 0 ? r.actual / totalIncome * 100 : 0
                      const ok = r.label === 'Ahorro' ? actualPct >= r.max : actualPct <= r.max
                      return (
                        <div key={r.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                            <span style={{ fontWeight: 500 }}>{r.label}</span>
                            <span style={{ fontFamily: 'var(--mono)', color: ok ? 'var(--grn)' : 'var(--red)', fontSize: 11 }}>
                              {actualPct.toFixed(1)}% / {r.max}% ideal {ok ? '✓' : '⚠'}
                            </span>
                          </div>
                          <div style={{ height: 8, background: 'var(--sur3)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                            <div style={{ height: '100%', width: Math.min(actualPct / r.max * 100, 100) + '%', background: ok ? r.color : 'var(--red)', borderRadius: 4, transition: 'width .4s' }} />
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
                            <span>{fmtMoney(r.actual, sym)}</span>
                            <span>ideal: {fmtMoney(r.ideal, sym)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()
          }
        </Card>

        {/* Tendencia 6 meses */}
        <Card>
        <CardHeader title="Tendencia 6 meses — Ingresos vs Gastos" />
        {trendData.every(d => d.Ingresos === 0 && d.Gastos === 0)
          ? <Empty text="Registra ingresos y gastos para ver la tendencia" />
          : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} barGap={4} barCategoryGap="30%">
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v} />
                <RTooltip {...tooltipProps} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--mono)', paddingTop: 8 }} />
                <Bar dataKey="Ingresos" fill="var(--grn)"  radius={[3,3,0,0]} opacity={0.85} />
                <Bar dataKey="Gastos"   fill="var(--red)"  radius={[3,3,0,0]} opacity={0.75} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </Card>

      </div>
      {/* Evolución del ahorro — AreaChart */}
      <Card>
        <CardHeader title="Evolución del ahorro mensual" />
        {trendData.every(d => d.Ahorro === 0)
          ? <Empty text="Sin datos de ahorro aún" />
          : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="ahorroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--grn)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--grn)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v} />
                <RTooltip {...tooltipProps} />
                <ReferenceLine y={0} stroke="var(--brd2)" />
                <Area type="monotone" dataKey="Ahorro" name="Ahorro neto"
                  stroke="var(--grn)" strokeWidth={2} fill="url(#ahorroGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )
        }
      </Card>

      {/* Recomendaciones */}
      <Card>
        <CardHeader title="Recomendaciones automáticas" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {totalIncome === 0
            ? <Alert type="info">Registra tus ingresos y gastos para ver recomendaciones personalizadas.</Alert>
            : savingRate >= 0.25
              ? <Alert type="ok">✓ Tu tasa de ahorro ({fmtPct(savingRate)}) supera la meta del {settings.savingGoalPct || 25}%. Considera destinar el excedente a metas prioritarias o reducir deuda de alto interés.</Alert>
              : <Alert type="warn">→ Tasa de ahorro actual: {fmtPct(savingRate)}. Para llegar al {settings.savingGoalPct || 25}% necesitas {balance < 0 ? 'reducir gastos en ' + fmtMoney(-balance + totalIncome * (settings.savingGoalPct / 100 || 0.25), sym) : 'ahorrar ' + fmtMoney(neededToSave, sym) + ' más este mes'}.</Alert>
          }
          {overBudget.length > 0
            ? <Alert type="danger">⚠ {overBudget.map(b => b.category).join(', ')} excedieron su presupuesto mensual.</Alert>
            : budgets.length > 0 && <Alert type="ok">✓ Todos los presupuestos están dentro del límite mensual.</Alert>
          }
          {deseos > 0 && totalExpense > 0 && (
            <Alert type="warn">→ Gastos "deseo": {fmtMoney(deseos, sym)} ({fmtPct(deseos / totalExpense)}). Regla 50/30/20 sugiere máximo 30% del ingreso neto.</Alert>
          )}
        </div>
      </Card>
      {/* ── BLOQUE SUSCRIPCIONES EN REPORTES ── */}
      {subMetrics.count > 0 && (
        <Card>
          <CardHeader title="Suscripciones — gasto estimado" />
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 12 }}>
            Gasto proyectado · no incluido en los gastos registrados del mes
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              { lb: 'Gasto mensual estimado', v: fmtMoney(subMetrics.monthly, sym) },
              { lb: 'Gasto anual estimado',   v: fmtMoney(subMetrics.annual,  sym) },
              { lb: 'Servicios activos',      v: `${subMetrics.count}` },
              ...(subMetrics.monthlyIncome > 0 ? [{ lb: '% del ingreso', v: `${(subMetrics.pct * 100).toFixed(1)}%` }] : []),
            ].map(m => (
              <div key={m.lb} style={{ flex: '1 1 110px', background: 'var(--sur2)', borderRadius: 6, padding: '8px 10px', border: '.5px solid var(--brd)' }}>
                <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>{m.lb}</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--tx)' }}>{m.v}</div>
              </div>
            ))}
          </div>
          {subMetrics.byCategory.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 7 }}>Por categoría</div>
              {subMetrics.byCategory.map(([cat, data]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '.5px solid var(--brd)', fontSize: 12 }}>
                  <span style={{ color: 'var(--tm)' }}>{cat}</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--tx)' }}>{fmtMoney(data.monthly, sym)}/mes · {data.count} servicio{data.count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
          {subMetrics.alerts.map((a, i) => (
            <Alert key={i} type={a.type === 'duplicate' ? 'warn' : 'info'}>{a.msg}</Alert>
          ))}
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 8 }}>
            Las sugerencias son orientativas y no constituyen asesoría financiera.
          </div>
        </Card>
      )}

      <ReportsDisclaimer />
    </div>
  )
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export function Settings() {
  const { settings, updateSettings, clearAll, loadDemo, exportData, exportCSV, importData } = useApp()
  async function handleClear() {
    if (window.confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) {
      await clearAll()
    }
  }

  const srow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '0.5px solid var(--brd)' }
  const slbl = { fontSize: 13, fontWeight: 500, color: 'var(--tx)' }
  const ssub = { fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 1 }

  return (
    <div className="stack">
      <PageHeader title="Ajustes" sub="Personalización y gestión de datos" />

      <Card>
        <CardHeader title="Preferencias" />
        {/* FIX: currency guardado como código limpio 'CLP', no 'CLP — Peso chileno' */}
        <div style={srow}>
          <div><div style={slbl}>Moneda</div><div style={ssub}>Símbolo y formato</div></div>
          <select style={{ width: 'auto' }} value={settings.currency || 'CLP'}
            onChange={e => updateSettings({ ...settings, currency: e.target.value })}>
            {CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div style={srow}>
          <div><div style={slbl}>Idioma</div><div style={ssub}>Español / English</div></div>
          <select style={{ width: 'auto' }} value={settings.language || 'es'}
            onChange={e => updateSettings({ ...settings, language: e.target.value })}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        <div style={srow}>
          <div><div style={slbl}>País</div><div style={ssub}>Activa funciones regionales</div></div>
          <select style={{ width: 'auto' }} value={settings.country || 'CL'}
            onChange={e => updateSettings({ ...settings, country: e.target.value })}>
            <option value="CL">🇨🇱 Chile</option>
            <option value="MX">🇲🇽 México</option>
            <option value="AR">🇦🇷 Argentina</option>
            <option value="CO">🇨🇴 Colombia</option>
            <option value="PE">🇵🇪 Perú</option>
            <option value="VE">🇻🇪 Venezuela</option>
            <option value="OTHER">🌎 Otro</option>
          </select>
        </div>
        <div style={{ ...srow, borderBottom: 'none' }}>
          <div><div style={slbl}>Tema visual</div><div style={ssub}>Claro u oscuro</div></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant={settings.theme === 'light' ? 'primary' : 'ghost'} size="sm" onClick={() => updateSettings({ ...settings, theme: 'light' })}>Claro</Btn>
            <Btn variant={settings.theme === 'dark'  ? 'primary' : 'ghost'} size="sm" onClick={() => updateSettings({ ...settings, theme: 'dark'  })}>Oscuro</Btn>
          </div>
        </div>
      </Card>

      {/* ── Plantillas por perfil ── */}
      <Card>
        <CardHeader title="Plantillas por perfil" />
        <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', marginBottom: 12, lineHeight: 1.5 }}>
          Selecciona un perfil para configurar categorías y presupuestos sugeridos según el tipo de cliente.
          Tus datos registrados no se modifican.
        </div>
        <TemplateSelector />
      </Card>

      {/* ── Respaldo y restauración ── */}
      <Card>
        <CardHeader title="Respaldo y restauración" />
        <BackupManager />
      </Card>

      {/* ── Otras acciones de datos ── */}
      <Card>
        <CardHeader title="Otras acciones" />
        <div style={srow}>
          <div><div style={slbl}>Exportar CSV</div><div style={ssub}>Ingresos y gastos · compatible Excel</div></div>
          <Btn variant="ghost" size="sm" onClick={exportCSV}>Descargar CSV</Btn>
        </div>
        <div style={srow}>
          <div><div style={slbl}>Cargar datos demo</div><div style={ssub}>Sobrescribe con datos de ejemplo</div></div>
          <Btn variant="ghost" size="sm" onClick={loadDemo}>Cargar demo</Btn>
        </div>
        <div style={srow}>
          <div><div style={slbl}>Reiniciar onboarding</div><div style={ssub}>Volver al asistente de configuración inicial</div></div>
          <Btn variant="ghost" size="sm" onClick={() => updateSettings({ ...settings, onboardingDone: false })}>Reiniciar</Btn>
        </div>
        <div style={{ ...srow, borderBottom: 'none' }}>
          <div><div style={slbl}>Borrar todos los datos</div><div style={ssub}>Acción irreversible · sin recuperación posible</div></div>
          <Btn variant="danger" size="sm" onClick={handleClear}>Borrar todo</Btn>
        </div>
      </Card>

      <BackupWarning />
      <div style={{ padding: '10px 12px', background: 'var(--sur2)', borderRadius: 'var(--r)', border: '0.5px solid var(--brd)', fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.7, marginTop: 8 }}>
        FinanceOS v1.2 · MAXNOVA & LUCI Global LLC · Datos locales · Sin servidor · No asesoría financiera certificada
      </div>
    </div>
  )
}
