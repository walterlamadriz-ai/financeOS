// src/pages/Goals/index.jsx — v1.5
import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { KPI, Card, CardHeader, FormGroup, FormRow, Btn, Alert, PageHeader } from '../../components/ui/index.jsx'
import { fmtMoney, fmtPct } from '../../utils/index.js'
import { CURRENCY_SYMBOLS } from '../shared/constants.js'
import { generateGoalSuggestions, totalMonthlyContribution } from '../../utils/goalSuggestions.js'

export default function Goals({ setPage }) {
  const { goals, addGoal, delGoal, updateGoal, incomes: _incAll, expenses: _expAll, settings } = useApp()
  const incomes = (_incAll || []).filter(r => !r?.inv)   // "disponible para ahorrar" personal: excluye inversión
  const expenses = (_expAll || []).filter(r => !r?.inv)
  const [show, setShow]               = useState(false)
  const [f, setF]                     = useState({ name:'', target:'', saved:'', targetDate:'', priority:'Media', color:'#1a6b4a' })
  const [err, setErr]                 = useState('')
  const [savingId, setSavingId]       = useState(null)
  const [addAmt, setAddAmt]           = useState('')
  const [showSuggest, setShowSuggest] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [editingId, setEditingId]     = useState(null)
  const [editForm, setEditForm]       = useState({})

  const sym              = CURRENCY_SYMBOLS[settings.currency] || '$'
  const isChile          = (settings.country || 'CL') === 'CL'
  const activeMonth      = settings.activeMonth || new Date().toISOString().slice(0, 7)

  const ingresoNetoGoals = useMemo(() => {
    return (incomes || []).filter(r => r.date?.startsWith(activeMonth)).reduce((s,r) => s+r.amount, 0)
  }, [incomes, activeMonth])

  const gastoMensualGoals = useMemo(() => {
    return (expenses || []).filter(r => r.date?.startsWith(activeMonth)).reduce((s,r) => s+r.amount, 0)
  }, [expenses, activeMonth])

  const totalTarget = useMemo(() => goals.reduce((s,g) => s+g.target, 0), [goals])
  const totalSaved  = useMemo(() => goals.reduce((s,g) => s+g.saved, 0), [goals])

  function openSuggestions() {
    setSuggestions(generateGoalSuggestions({ ingresoNeto:ingresoNetoGoals, gastoMensual:gastoMensualGoals, existingGoals:goals }))
    setShowSuggest(true)
  }

  async function createSuggestedGoals() {
    for (const s of suggestions.filter(s => s.selected && !s.alreadyExists)) {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() + (s.monthsToGoal || 12))
      await addGoal({ name:`${s.emoji} ${s.name}`, target:s.target, saved:0, targetDate:targetDate.toISOString().slice(0,7), priority:s.goalPriority, color:s.color })
    }
    setShowSuggest(false); setSuggestions([])
  }

  async function saveEdit(goal) {
    if (!editForm.name?.trim() || !editForm.target || Number(editForm.target) <= 0) return
    await updateGoal({ ...goal, name:editForm.name.trim(), target:Number(editForm.target), targetDate:editForm.targetDate||'', priority:editForm.priority||'Media' })
    setEditingId(null); setEditForm({})
  }

  async function submit() {
    if (!f.name.trim() || !f.target || Number(f.target) <= 0) { setErr('Nombre y monto objetivo son requeridos'); return }
    setErr('')
    await addGoal({ ...f, target:Number(f.target), saved:Number(f.saved)||0 })
    setF({ name:'', target:'', saved:'', targetDate:'', priority:'Media', color:'#1a6b4a' })
    setShow(false)
  }

  async function confirmAddSaving(goal) {
    const n = Number(addAmt)
    if (!addAmt || isNaN(n) || n <= 0) return
    await updateGoal({ ...goal, saved:Math.min(goal.saved+n, goal.target) })
    setSavingId(null); setAddAmt('')
  }

  return (
    <div className="stack">
      <PageHeader title="Metas de ahorro" sub="Objetivos financieros con seguimiento visual" />
      <p style={{fontSize:12,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12,marginTop:-4}}>Mide el progreso hacia tus objetivos de ahorro.</p>
      <div className="kpi-row">
        <KPI label="Metas activas"  value={goals.length} />
        <KPI label="Total objetivo" value={fmtMoney(totalTarget,sym)} />
        <KPI label="Total ahorrado" value={fmtMoney(totalSaved,sym)} color="green" sub={totalTarget>0 ? fmtPct(totalSaved/totalTarget)+' del total' : '-'} />
        <KPI label="Completadas"    value={goals.filter(g=>g.saved>=g.target).length} color="green" />
      </div>
      {/* Disponible este mes para ahorrar */}
      {(() => {
        const disponible = ingresoNetoGoals - gastoMensualGoals
        if (ingresoNetoGoals <= 0) return null
        const ok = disponible > 0
        return (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:'var(--r)', background: ok ? 'var(--accent-bg)' : 'var(--red-bg)', border:`.5px solid ${ok ? 'var(--accent)' : 'var(--red)'}`, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--th)', textTransform:'uppercase', letterSpacing:'.5px' }}>Disponible este mes para ahorrar</span>
            <span style={{ fontSize:15, fontWeight:700, fontFamily:'var(--mono)', color: ok ? 'var(--accent)' : 'var(--red)', marginLeft:'auto' }}>
              {ok ? '' : '−'}{fmtMoney(Math.abs(disponible), sym)}
            </span>
            {!ok && <span style={{ fontSize:11, color:'var(--red)', width:'100%' }}>Tus gastos superan tus ingresos este mes — prioriza antes de asignar a metas.</span>}
          </div>
        )
      })()}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <Btn variant="primary" onClick={() => setShow(s=>!s)}>{show ? '— Cerrar' : '+ Nueva meta'}</Btn>
        <Btn variant="ghost"   onClick={openSuggestions}>💡 Sugerir metas básicas</Btn>
      </div>

      {show && (
        <Card>
          <CardHeader title="Nueva meta" />
          {err && <Alert type="danger">⚠ {err}</Alert>}
          <FormGroup label="Nombre de la meta"><input type="text" value={f.name} placeholder="ej. Fondo de emergencia, Viaje" onChange={e=>setF(p=>({...p,name:e.target.value}))} /></FormGroup>
          <FormRow>
            <FormGroup label={`Monto objetivo (${settings.currency||'CLP'})`}><input type="number" min="0" value={f.target} placeholder="0" onChange={e=>setF(p=>({...p,target:e.target.value}))} /></FormGroup>
            <FormGroup label="Ahorrado hasta hoy"><input type="number" min="0" value={f.saved} placeholder="0" onChange={e=>setF(p=>({...p,saved:e.target.value}))} /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Fecha objetivo"><input type="date" value={f.targetDate} onChange={e=>setF(p=>({...p,targetDate:e.target.value}))} /></FormGroup>
            <FormGroup label="Prioridad"><select value={f.priority} onChange={e=>setF(p=>({...p,priority:e.target.value}))}>{['Alta','Media','Baja'].map(p=><option key={p}>{p}</option>)}</select></FormGroup>
          </FormRow>
          <div style={{display:'flex',gap:8}}>
            <Btn variant="primary" onClick={submit}>+ Crear meta</Btn>
            <Btn variant="ghost"   onClick={() => setShow(false)}>Cancelar</Btn>
          </div>
        </Card>
      )}

      {showSuggest && (
        <Card>
          <CardHeader title="💡 Metas financieras básicas sugeridas" />
          {ingresoNetoGoals > 0 ? (
            <>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,padding:'8px 12px',background:'var(--sur2)',borderRadius:6}}>
                <span style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)'}}>Basado en ingreso neto {activeMonth}:</span>
                <span style={{fontSize:13,fontWeight:700,color:'var(--grn)',fontFamily:'var(--mono)'}}>{fmtMoney(ingresoNetoGoals,sym)}</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14}}>
                {suggestions.map((s,i) => (
                  <div key={s.id} style={{padding:'12px 14px',borderRadius:8,border:`0.5px solid ${s.selected&&!s.alreadyExists?'rgba(10,92,62,.25)':'var(--brd)'}`,background:s.alreadyExists?'var(--sur2)':s.selected?'rgba(10,92,62,.04)':'var(--bg)',opacity:s.alreadyExists?0.6:1,boxSizing:'border-box',width:'100%',overflow:'hidden'}}>
                    <div style={{display:'grid',gridTemplateColumns:'20px 1fr',gap:10,alignItems:'start'}}>
                      <input type="checkbox" checked={s.selected&&!s.alreadyExists} disabled={s.alreadyExists}
                        onChange={e=>setSuggestions(prev=>prev.map((x,j)=>j===i?{...x,selected:e.target.checked}:x))}
                        style={{marginTop:3,accentColor:'var(--grn)'}}/>
                      <div style={{minWidth:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4,flexWrap:'wrap',gap:4}}>
                          <span style={{fontSize:13,fontWeight:600,color:'var(--tx)'}}>{s.emoji} {s.name}</span>
                          {s.alreadyExists && <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,background:'var(--sur2)',color:'var(--th)',fontFamily:'var(--mono)'}}>Ya existe</span>}
                        </div>
                        <div style={{fontSize:11,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:6,lineHeight:1.4}}>{s.description}</div>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:4}}>
                          <span style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--grn)',fontWeight:600}}>Objetivo: {fmtMoney(s.target,sym)}</span>
                          <span style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--th)'}}>Aporte: {fmtMoney(s.monthlyContribution,sym)}/mes</span>
                          {s.monthsToGoal && <span style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--th)'}}>~{s.monthsToGoal} meses</span>}
                        </div>
                        <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',fontStyle:'italic',lineHeight:1.4}}>{s.hint}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{padding:'10px 14px',background:'var(--sur2)',borderRadius:6,marginBottom:14}}>
                <div style={{fontSize:11,color:'var(--th)',fontFamily:'var(--mono)'}}>
                  Total aportes mensuales sugeridos: <span style={{color:'var(--grn)',fontWeight:700}}>{fmtMoney(totalMonthlyContribution(suggestions),sym)}/mes</span>
                  <span style={{marginLeft:8,color:'var(--th)'}}>({ingresoNetoGoals>0?((totalMonthlyContribution(suggestions)/ingresoNetoGoals)*100).toFixed(0):0}% del ingreso)</span>
                </div>
              </div>
              <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12,lineHeight:1.5}}>
                ⚠ Sugerencias orientativas. No constituyen asesoría financiera certificada.
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <Btn variant="primary" onClick={createSuggestedGoals} disabled={suggestions.filter(s=>s.selected&&!s.alreadyExists).length===0}>Crear metas seleccionadas →</Btn>
                <Btn variant="ghost" onClick={()=>{setShowSuggest(false);setSuggestions([])}}>Cancelar</Btn>
              </div>
            </>
          ) : (
            <div style={{fontSize:12,color:'var(--th)',fontFamily:'var(--mono)',padding:'12px 0'}}>
              ⚠ No hay ingresos registrados en {activeMonth}. Agrega ingresos primero.
            </div>
          )}
        </Card>
      )}

      {goals.length === 0 && !show && (
        <Card><div style={{textAlign:'center',padding:'24px 0'}}>
          <div style={{fontSize:13,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12}}>Aún no tienes metas de ahorro. Crea una para hacer seguimiento de tus objetivos.</div>
          <button onClick={()=>setShow(true)} style={{background:'var(--grn)',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Crear meta</button>
        </div></Card>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {goals.map(g => {
          const p    = g.target > 0 ? Math.min(g.saved/g.target, 1) : 0
          const done = g.saved >= g.target
          const clr  = done ? 'var(--grn)' : p >= 0.5 ? '#d4982a' : p < 0.25 ? 'var(--red)' : 'var(--tm)'
          const isEditing = editingId === g.id
          return (
            <div key={g.id} style={{background:'var(--sur2)',borderRadius:10,padding:'14px 16px',border:`0.5px solid ${isEditing?'rgba(10,92,62,.4)':done?'rgba(10,92,62,.25)':'var(--brd)'}`}}>
              {isEditing ? (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div style={{gridColumn:'1/-1'}}>
                      <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:4}}>Nombre</div>
                      <input type="text" value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}
                        style={{width:'100%',padding:'6px 10px',fontSize:13,borderRadius:6,border:'0.5px solid var(--brd)',background:'var(--bg)',color:'var(--tx)',boxSizing:'border-box'}}/>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:4}}>Monto objetivo</div>
                      <input type="number" min="0" value={editForm.target||''} onChange={e=>setEditForm(f=>({...f,target:e.target.value}))}
                        style={{width:'100%',padding:'6px 10px',fontSize:13,borderRadius:6,border:'0.5px solid var(--brd)',background:'var(--bg)',color:'var(--tx)',boxSizing:'border-box'}}/>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:4}}>Fecha objetivo</div>
                      <input type="month" value={(editForm.targetDate||'').slice(0,7)} onChange={e=>setEditForm(f=>({...f,targetDate:e.target.value}))}
                        style={{width:'100%',padding:'6px 10px',fontSize:13,borderRadius:6,border:'0.5px solid var(--brd)',background:'var(--bg)',color:'var(--tx)',boxSizing:'border-box'}}/>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:4}}>Prioridad</div>
                      <select value={editForm.priority||'Media'} onChange={e=>setEditForm(f=>({...f,priority:e.target.value}))}
                        style={{width:'100%',padding:'6px 10px',fontSize:13,borderRadius:6,border:'0.5px solid var(--brd)',background:'var(--bg)',color:'var(--tx)',boxSizing:'border-box'}}>
                        {['Alta','Media','Baja'].map(p=><option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <Btn variant="primary" size="xs" onClick={()=>saveEdit(g)}>✓ Guardar</Btn>
                    <Btn variant="ghost"   size="xs" onClick={()=>{setEditingId(null);setEditForm({})}}>Cancelar</Btn>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div style={{flex:1,paddingRight:8}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--tx)',marginBottom:2}}>{g.name}</div>
                      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                        <span style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)'}}>{g.priority} prioridad</span>
                        {g.targetDate && <span style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)'}}>· Meta: {g.targetDate.slice(0,7).replace('-','/')}</span>}
                        {done && <span style={{fontSize:10,padding:'1px 8px',borderRadius:10,background:'rgba(10,92,62,.12)',color:'var(--grn)',fontFamily:'var(--mono)',fontWeight:600}}>✓ Completada</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                      <span style={{fontSize:13,fontWeight:700,color:clr,fontFamily:'var(--mono)'}}>{(p*100).toFixed(0)}%</span>
                      <button onClick={()=>{setEditingId(g.id);setEditForm({name:g.name,target:g.target,targetDate:g.targetDate||'',priority:g.priority||'Media'})}}
                        style={{background:'none',border:'none',color:'var(--th)',fontSize:12,cursor:'pointer',padding:'2px 5px'}} title="Editar meta">✏️</button>
                      <button onClick={()=>delGoal(g.id)} style={{background:'none',border:'none',color:'var(--th)',fontSize:11,cursor:'pointer',padding:'2px 5px'}}>✕</button>
                    </div>
                  </div>
                  <div style={{height:8,background:'var(--brd)',borderRadius:4,overflow:'hidden',marginBottom:8}}>
                    <div style={{height:'100%',width:(p*100)+'%',background:clr,borderRadius:4,transition:'width .4s'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <span style={{fontSize:11,fontFamily:'var(--mono)',color:clr,fontWeight:600}}>{fmtMoney(g.saved,sym)}</span>
                      <span style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)'}}>de {fmtMoney(g.target,sym)}</span>
                      <span style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)'}}>· {fmtMoney(g.target-g.saved,sym)} restante</span>
                    </div>
                    {!done && (
                      savingId === g.id
                        ? <div style={{display:'flex',gap:6,alignItems:'center'}}>
                            <input type="number" min="0" value={addAmt} placeholder="Monto" autoFocus
                              style={{width:90,padding:'4px 7px',fontSize:11,borderRadius:6,border:'0.5px solid var(--brd)',background:'var(--bg)',color:'var(--tx)'}}
                              onChange={e=>setAddAmt(e.target.value)}
                              onKeyDown={e=>e.key==='Enter'&&confirmAddSaving(g)} />
                            <Btn variant="primary" size="xs" onClick={()=>confirmAddSaving(g)}>OK</Btn>
                            <Btn variant="ghost"   size="xs" onClick={()=>{setSavingId(null);setAddAmt('')}}>×</Btn>
                          </div>
                        : <Btn variant="ghost" size="xs" onClick={()=>{setSavingId(g.id);setAddAmt('')}}>+ Agregar ahorro</Btn>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
