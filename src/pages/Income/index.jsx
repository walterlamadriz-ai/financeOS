// src/pages/Income/index.jsx — v1.5
import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { KPI, Card, CardHeader, TxRow, FormGroup, FormRow, Btn, Alert, PageHeader } from '../../components/ui/index.jsx'
import { fmtMoney, CAT_COLORS, CATS_INCOME, RECURRENCES, today } from '../../utils/index.js'
import { CURRENCY_SYMBOLS, monthLabel } from '../shared/constants.js'
import MonthSelector from '../shared/MonthSelector.jsx'

export default function Income() {
  const { incomes, addIncome, delIncome, updateIncome, settings } = useApp()
  const [f, setF]       = useState({ source: '', amount: '', date: today(), category: 'Salario', recurrence: 'Único', notes: '' })
  const [err, setErr]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm]   = useState({})

  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const filtered    = useMemo(() => incomes.filter(r => r.date?.startsWith(activeMonth)), [incomes, activeMonth])
  const sym         = CURRENCY_SYMBOLS[settings.currency] || '$'
  const total       = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered])
  const fixed       = useMemo(() => filtered.filter(r => r.recurrence !== 'Único').reduce((s, r) => s + r.amount, 0), [filtered])
  const investment  = useMemo(() => filtered.filter(r => r.inv).reduce((s, r) => s + r.amount, 0), [filtered])

  async function saveEdit(r) {
    if (!editForm.source?.trim() || !editForm.amount || Number(editForm.amount) <= 0) return
    await updateIncome({ ...r, source:editForm.source.trim(), amount:Number(editForm.amount), date:editForm.date||r.date, category:editForm.category||r.category, recurrence:editForm.recurrence||r.recurrence, notes:editForm.notes||'' })
    setEditingId(null); setEditForm({})
  }

  async function submit() {
    if (!f.source.trim())               { setErr('El nombre es requerido'); return }
    if (!f.amount || Number(f.amount) <= 0) { setErr('Ingresa un monto válido'); return }
    setErr(''); setSaving(true)
    try { await addIncome({ ...f, amount: Number(f.amount) }) }
    catch {}
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
        <KPI label="Total mes" value={fmtMoney(total, sym)} color="green" sub={investment > 0 ? `de los cuales 💼 ${fmtMoney(investment, sym)} inversión` : undefined} />
        <KPI label="Fijo"      value={fmtMoney(fixed, sym)} sub={total > 0 ? (fixed/total*100).toFixed(1)+'% del total' : '-'} />
        <KPI label="Variable"  value={fmtMoney(total - fixed, sym)} sub={total > 0 ? ((total-fixed)/total*100).toFixed(1)+'% del total' : '-'} />
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
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--tm)', cursor:'pointer', margin:'4px 0 10px' }}>
            <input type="checkbox" checked={!!f.inv} onChange={e => setF(p => ({ ...p, inv: e.target.checked }))} />
            💼 Es de inversión (ej. arriendo de una propiedad) — no cuenta en mi presupuesto personal
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" onClick={submit} disabled={saving}>{saving ? 'Guardando…' : '+ Registrar'}</Btn>
            <Btn variant="ghost" onClick={() => { setF({ source: '', amount: '', date: today(), category: 'Salario', recurrence: 'Único', notes: '' }); setErr('') }}>Limpiar</Btn>
          </div>
        </Card>
        <Card>
          <CardHeader title={`Historial (${filtered.length})`} />
          {filtered.length === 0
            ? <div style={{textAlign:'center',padding:'24px 0'}}>
                <div style={{fontSize:13,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12}}>Aún no tienes ingresos registrados.</div>
                <button onClick={() => setF(p => ({...p, recurrence:'Mensual'}))} style={{background:'var(--grn)',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Agregar ingreso</button>
              </div>
            : <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {filtered.map(r => editingId === r.id ? (
                  <div key={r.id} style={{padding:'10px 12px',borderRadius:8,border:'0.5px solid rgba(10,92,62,.3)',background:'rgba(10,92,62,.04)',marginBottom:6}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                      <div style={{gridColumn:'1/-1'}}>
                        <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:3}}>Fuente</div>
                        <input type="text" value={editForm.source||''} onChange={e=>setEditForm(f=>({...f,source:e.target.value}))}
                          style={{width:'100%',padding:'5px 8px',fontSize:12,borderRadius:5,border:'0.5px solid var(--brd)',background:'var(--bg)',color:'var(--tx)',boxSizing:'border-box'}}/>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:3}}>Monto</div>
                        <input type="number" min="0" value={editForm.amount||''} onChange={e=>setEditForm(f=>({...f,amount:e.target.value}))}
                          style={{width:'100%',padding:'5px 8px',fontSize:12,borderRadius:5,border:'0.5px solid var(--brd)',background:'var(--bg)',color:'var(--tx)',boxSizing:'border-box'}}/>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:3}}>Fecha</div>
                        <input type="date" value={editForm.date||''} onChange={e=>setEditForm(f=>({...f,date:e.target.value}))}
                          style={{width:'100%',padding:'5px 8px',fontSize:12,borderRadius:5,border:'0.5px solid var(--brd)',background:'var(--bg)',color:'var(--tx)',boxSizing:'border-box'}}/>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:3}}>Categoría</div>
                        <select value={editForm.category||''} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))}
                          style={{width:'100%',padding:'5px 8px',fontSize:12,borderRadius:5,border:'0.5px solid var(--brd)',background:'var(--bg)',color:'var(--tx)',boxSizing:'border-box'}}>
                          {CATS_INCOME.map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <Btn variant="primary" size="xs" onClick={()=>saveEdit(r)}>✓ Guardar</Btn>
                      <Btn variant="ghost"   size="xs" onClick={()=>{setEditingId(null);setEditForm({})}}>Cancelar</Btn>
                    </div>
                  </div>
                ) : (
                  <div key={r.id}>
                    <TxRow dot={CAT_COLORS[r.category]||'#888'} name={`${r.inv?'💼 ':''}${r.source}`}
                      meta={`${r.category} · ${r.date.slice(5).replace('-','/')}${r.recurrence!=='Único'?' · '+r.recurrence:''}${r.inv?' · inversión':''}`}
                      amount={fmtMoney(r.amount,sym)} isIncome
                      onDelete={()=>delIncome(r.id)}
                      onEdit={()=>{setEditingId(r.id);setEditForm({source:r.source,amount:r.amount,date:r.date,category:r.category,recurrence:r.recurrence,notes:r.notes||''})}} />
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>
    </div>
  )
}
