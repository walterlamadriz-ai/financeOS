// src/pages/Expenses/index.jsx — v1.5
import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { KPI, Card, CardHeader, TxRow, FormGroup, FormRow, Btn, Alert, PageHeader } from '../../components/ui/index.jsx'
import { fmtMoney, CAT_COLORS, CATS_EXPENSE, METHODS, RECURRENCES, today } from '../../utils/index.js'
import { CURRENCY_SYMBOLS, monthLabel } from '../shared/constants.js'
import MonthSelector from '../shared/MonthSelector.jsx'
import ChartCard from '../../components/charts/ChartCard.jsx'
import CategoryDonut from '../../components/charts/CategoryDonut.jsx'
import HorizontalBars from '../../components/charts/HorizontalBars.jsx'

export default function Expenses() {
  const { expenses, addExpense, delExpense, updateExpense, settings } = useApp()
  const [f, setF]       = useState({ description: '', amount: '', date: today(), category: 'Alimentación', method: 'Débito', type: 'Necesidad', recurrence: 'Único', notes: '' })
  const [err, setErr]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm]   = useState({})

  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const filtered    = useMemo(() => expenses.filter(r => r.date?.startsWith(activeMonth)), [expenses, activeMonth])
  const sym         = CURRENCY_SYMBOLS[settings.currency] || '$'
  const total       = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered])
  const necesidad   = useMemo(() => filtered.filter(r => r.type === 'Necesidad').reduce((s, r) => s + r.amount, 0), [filtered])

  async function saveEdit(r) {
    if (!editForm.description?.trim() || !editForm.amount || Number(editForm.amount) <= 0) return
    await updateExpense({ ...r, description:editForm.description.trim(), amount:Number(editForm.amount), date:editForm.date||r.date, category:editForm.category||r.category, type:editForm.type||r.type, notes:editForm.notes||'' })
    setEditingId(null); setEditForm({})
  }

  async function submit() {
    if (!f.description.trim())             { setErr('La descripción es requerida'); return }
    if (!f.amount || Number(f.amount) <= 0) { setErr('Ingresa un monto válido'); return }
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
      <p style={{fontSize:12,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12,marginTop:-8}}>Registra salidas y entiende tus categorías principales.</p>
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <KPI label="Total mes"   value={fmtMoney(total, sym)} color="red" />
        <KPI label="Necesidades" value={fmtMoney(necesidad, sym)} sub={total > 0 ? (necesidad/total*100).toFixed(1)+'% del gasto' : '-'} />
        <KPI label="Deseos"      value={fmtMoney(total-necesidad, sym)} sub={total > 0 ? ((total-necesidad)/total*100).toFixed(1)+'% del gasto' : '-'} />
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
            <FormGroup label="Tipo"><select value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value }))}>{['Necesidad','Deseo'].map(t => <option key={t}>{t}</option>)}</select></FormGroup>
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
          {filtered.length === 0
            ? <div style={{textAlign:'center',padding:'24px 0'}}>
                <div style={{fontSize:13,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12}}>Aún no tienes gastos registrados.</div>
                <button onClick={() => {}} style={{background:'var(--grn)',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Agregar gasto</button>
              </div>
            : <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {filtered.map(r => <TxRow key={r.id} dot={CAT_COLORS[r.category] || '#888'} name={r.description}
                  meta={`${r.category} · ${r.date.slice(5).replace('-','/')}${r.type === 'Deseo' ? ' · Deseo' : ''}`}
                  amount={fmtMoney(r.amount, sym)} isIncome={false} onDelete={() => delExpense(r.id)} />)}
              </div>
          }
        </Card>
      </div>
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
