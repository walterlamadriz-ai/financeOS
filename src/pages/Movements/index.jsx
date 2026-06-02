// src/pages/Movements/index.jsx — v1.2
// Hub "Salidas del mes" — vista unificada Gastos + Recurrentes

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import MoneyFlow from '../../components/charts/MoneyFlow.jsx'
import ChartCard from '../../components/charts/ChartCard.jsx'
import HorizontalBars from '../../components/charts/HorizontalBars.jsx'
import CategoryDonut from '../../components/charts/CategoryDonut.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
const todayStr = () => new Date().toISOString().slice(0, 10)

function toMonthly(amount, frequency) {
  switch (frequency) {
    case 'weekly':    return amount * 4.33
    case 'quarterly': return amount / 3
    case 'annual':
    case 'anual':     return amount / 12
    default:          return amount
  }
}
function toAnnual(amount, frequency) {
  switch (frequency) {
    case 'weekly':    return amount * 52
    case 'quarterly': return amount * 4
    case 'annual':
    case 'anual':     return amount
    default:          return amount * 12
  }
}

const SYM   = { CLP:'$', USD:'US$', EUR:'€', VES:'Bs.', MXN:'$', ARS:'$', COP:'$' }
const fmt   = n => (Number(n)||0).toLocaleString('es-CL', { maximumFractionDigits:0 })
const fmtM  = (n, sym) => `${sym}${fmt(n)}`

const EXP_CATS = ['Alimentación','Vivienda','Transporte','Salud','Educación',
  'Ropa','Entretención','Servicios','Tecnología','Deporte','Viajes','Otros']
const SUB_CATS = ['Streaming','Música','Software','Gimnasio','Seguro',
  'Educación','Cloud','Delivery','Suscripción','Productividad','Otros']
const METHODS  = ['Débito','Crédito','Efectivo','Transferencia','Otro']
const FREQS    = [
  { value:'monthly',   label:'Mensual' },
  { value:'annual',    label:'Anual' },
  { value:'quarterly', label:'Trimestral' },
  { value:'weekly',    label:'Semanal' },
]
const CAT_COLORS = {
  'Alimentación':'#f5a623','Vivienda':'#ff4d6a','Transporte':'#00b8d9',
  'Salud':'#a78bfa','Educación':'#34d399','Ropa':'#fb923c',
  'Entretención':'#60a5fa','Servicios':'#00d4aa','Tecnología':'#818cf8',
  'Deporte':'#4ade80','Viajes':'#f472b6','Otros':'#888780',
  'Streaming':'#00b8d9','Música':'#a78bfa','Software':'#60a5fa',
  'Gimnasio':'#4ade80','Seguro':'#f5a623','Cloud':'#818cf8',
  'Delivery':'#fb923c','Suscripción':'#00d4aa','Productividad':'#34d399',
}

// ── Formulario Gasto ──────────────────────────────────────────────────────────
function FormGasto({ onSave, onCancel, sym }) {
  const [f, setF] = useState({
    description:'', amount:'', date:todayStr(),
    category:'Alimentación', method:'Débito', type:'Necesidad', notes:''
  })
  const set = (k,v) => setF(p => ({ ...p, [k]:v }))
  const inp = { background:'var(--sur)', border:'.5px solid var(--brd)', borderRadius:6,
    padding:'7px 10px', fontSize:13, color:'var(--tx)', width:'100%',
    boxSizing:'border-box', fontFamily:'var(--mono)' }
  const lbl = { fontSize:10, color:'var(--th)', fontFamily:'var(--mono)',
    textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3, display:'block' }

  return (
    <div style={{ background:'var(--sur)', border:'.5px solid var(--brd)',
      borderRadius:'var(--r)', padding:'16px', marginBottom:12 }}>
      <div style={{ fontSize:13, fontWeight:600, color:'var(--tx)', marginBottom:12 }}>
        💳 Nuevo gasto único
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div><label style={lbl}>Descripción</label>
          <input style={inp} value={f.description} placeholder="Ej: Supermercado"
            onChange={e => set('description', e.target.value)}/></div>
        <div><label style={lbl}>Monto ({sym})</label>
          <input style={inp} type="number" value={f.amount} placeholder="0"
            onChange={e => set('amount', e.target.value)}/></div>
        <div><label style={lbl}>Fecha</label>
          <input style={inp} type="date" value={f.date}
            onChange={e => set('date', e.target.value)}/></div>
        <div><label style={lbl}>Categoría</label>
          <select style={inp} value={f.category} onChange={e => set('category', e.target.value)}>
            {EXP_CATS.map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label style={lbl}>Método</label>
          <select style={inp} value={f.method} onChange={e => set('method', e.target.value)}>
            {METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
        <div><label style={lbl}>Tipo</label>
          <select style={inp} value={f.type} onChange={e => set('type', e.target.value)}>
            <option>Necesidad</option><option>Deseo</option></select></div>
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ background:'none', border:'.5px solid var(--brd)',
          borderRadius:6, padding:'6px 14px', fontSize:12, color:'var(--th)', cursor:'pointer' }}>
          Cancelar
        </button>
        <button onClick={() => {
          if (!f.description.trim() || !f.amount) return
          onSave({ ...f, id:uid(), amount:parseFloat(f.amount)||0,
            createdAt:new Date().toISOString() })
        }} style={{ background:'var(--grn)', color:'#fff', border:'none',
          borderRadius:6, padding:'6px 16px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
          Guardar gasto
        </button>
      </div>
    </div>
  )
}

// ── Formulario Suscripción ────────────────────────────────────────────────────
function FormSub({ onSave, onCancel }) {
  const [f, setF] = useState({
    name:'', amount:'', frequency:'monthly', category:'Streaming',
    status:'active', notes:'', nextPaymentDate:''
  })
  const set = (k,v) => setF(p => ({ ...p, [k]:v }))
  const inp = { background:'var(--sur)', border:'.5px solid var(--brd)', borderRadius:6,
    padding:'7px 10px', fontSize:13, color:'var(--tx)', width:'100%',
    boxSizing:'border-box', fontFamily:'var(--mono)' }
  const lbl = { fontSize:10, color:'var(--th)', fontFamily:'var(--mono)',
    textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3, display:'block' }

  return (
    <div style={{ background:'var(--sur)', border:'.5px solid var(--brd)',
      borderRadius:'var(--r)', padding:'16px', marginBottom:12 }}>
      <div style={{ fontSize:13, fontWeight:600, color:'var(--tx)', marginBottom:12 }}>
        🔄 Nuevo pago recurrente
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div><label style={lbl}>Nombre</label>
          <input style={inp} value={f.name} placeholder="Ej: Netflix"
            onChange={e => set('name', e.target.value)}/></div>
        <div><label style={lbl}>Monto</label>
          <input style={inp} type="number" value={f.amount} placeholder="0"
            onChange={e => set('amount', e.target.value)}/></div>
        <div><label style={lbl}>Frecuencia</label>
          <select style={inp} value={f.frequency} onChange={e => set('frequency', e.target.value)}>
            {FREQS.map(fr => <option key={fr.value} value={fr.value}>{fr.label}</option>)}
          </select></div>
        <div><label style={lbl}>Categoría</label>
          <select style={inp} value={f.category} onChange={e => set('category', e.target.value)}>
            {SUB_CATS.map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label style={lbl}>Próximo pago</label>
          <input style={inp} type="date" value={f.nextPaymentDate}
            onChange={e => set('nextPaymentDate', e.target.value)}/></div>
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ background:'none', border:'.5px solid var(--brd)',
          borderRadius:6, padding:'6px 14px', fontSize:12, color:'var(--th)', cursor:'pointer' }}>
          Cancelar
        </button>
        <button onClick={() => {
          if (!f.name.trim() || !f.amount) return
          onSave({ ...f, id:uid(), amount:parseFloat(f.amount)||0,
            createdAt:new Date().toISOString() })
        }} style={{ background:'var(--grn)', color:'#fff', border:'none',
          borderRadius:6, padding:'6px 16px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
          Guardar recurrente
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Movements({ setPage }) {
  const ctx           = useApp() || {}
  const incomes       = Array.isArray(ctx.incomes)       ? ctx.incomes       : []
  const expenses      = Array.isArray(ctx.expenses)      ? ctx.expenses      : []
  const subscriptions = Array.isArray(ctx.subscriptions) ? ctx.subscriptions : []
  const debts         = Array.isArray(ctx.debts)         ? ctx.debts         : []
  const settings      = ctx.settings || {}
  const addExpense    = ctx.addExpense
  const addSubscription = ctx.addSubscription

  const sym         = SYM[settings.currency] || '$'
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0,7)

  const [showAdd,   setShowAdd]   = useState(false)
  const [showGasto, setShowGasto] = useState(false)
  const [showSub,   setShowSub]   = useState(false)

  // ── Cálculos ─────────────────────────────────────────────────────────────────
  const monthExp   = useMemo(() =>
    expenses.filter(e => e?.date?.startsWith(activeMonth))
      .sort((a,b) => new Date(b.date) - new Date(a.date))
  , [expenses, activeMonth])

  const activeSubs = useMemo(() =>
    subscriptions.filter(s => s?.status === 'active')
  , [subscriptions])

  const totalInc   = useMemo(() =>
    incomes.filter(r => r?.date?.startsWith(activeMonth))
      .reduce((s,r) => s + (Number(r.amount)||0), 0)
  , [incomes, activeMonth])

  const totalExp   = useMemo(() =>
    monthExp.reduce((s,e) => s + (Number(e.amount)||0), 0)
  , [monthExp])

  const totalSubs  = useMemo(() =>
    activeSubs.reduce((s,sub) => s + toMonthly(Number(sub.amount)||0, sub.frequency), 0)
  , [activeSubs])

  const totalAnnual = useMemo(() =>
    activeSubs.reduce((s,sub) => s + toAnnual(Number(sub.amount)||0, sub.frequency), 0)
  , [activeSubs])

  const totalDebt  = useMemo(() =>
    debts.reduce((s,d) => s + (Number(d.minPayment)||0), 0)
  , [debts])

  const totalSalidas = totalExp + totalSubs
  const balance      = totalInc - totalSalidas - totalDebt

  // Lista unificada cronológica — gastos del mes + recurrentes con badge
  const unifiedList = useMemo(() => {
    const gastos = monthExp.map(e => ({
      ...e,
      _type: 'gasto',
      _monthly: Number(e.amount)||0,
      _sortDate: e.date || activeMonth + '-01',
    }))
    const recur = activeSubs.map(s => ({
      ...s,
      _type: 'recurrente',
      _monthly: toMonthly(Number(s.amount)||0, s.frequency),
      _annual:  toAnnual(Number(s.amount)||0, s.frequency),
      _freq:    FREQS.find(f => f.value === s.frequency)?.label || s.frequency,
      _sortDate: s.nextPaymentDate || activeMonth + '-15',
    }))
    return [...gastos, ...recur].sort((a,b) => new Date(b._sortDate) - new Date(a._sortDate))
  }, [monthExp, activeSubs, activeMonth])

  // Datos para gráficos — combinados
  const chartRecords = useMemo(() => {
    const map = {}
    monthExp.forEach(e => { map[e.category] = (map[e.category]||0) + (Number(e.amount)||0) })
    activeSubs.forEach(s => { map[s.category] = (map[s.category]||0) + toMonthly(Number(s.amount)||0, s.frequency) })
    return Object.entries(map)
      .sort((a,b) => b[1]-a[1])
      .slice(0,8)
      .map(([category, amount]) => ({ category, amount }))
  }, [monthExp, activeSubs])

  const topBarRecords = useMemo(() => {
    const items = [
      ...monthExp.map(e => ({ category: e.description || e.category, amount: Number(e.amount)||0 })),
      ...activeSubs.map(s => ({ category: `${s.name} 🔄`, amount: toMonthly(Number(s.amount)||0, s.frequency) })),
    ]
    return items.sort((a,b) => b.amount-a.amount).slice(0,8)
  }, [monthExp, activeSubs])

  // Alertas de suscripciones
  const alerts = useMemo(() => {
    const al = []
    const catGroups = {}
    activeSubs.forEach(s => { catGroups[s.category] = [...(catGroups[s.category]||[]), s] })
    Object.entries(catGroups).forEach(([cat, items]) => {
      if (items.length >= 2) al.push({ type:'dup', msg:`Tienes ${items.length} suscripciones en "${cat}". Revisa si todas son necesarias.` })
    })
    if (totalInc > 0 && totalSubs/totalInc > 0.15)
      al.push({ type:'income', msg:`Tus recurrentes representan el ${(totalSubs/totalInc*100).toFixed(1)}% de tus ingresos.` })
    const todayD = new Date(), in7 = new Date(); in7.setDate(todayD.getDate()+7)
    activeSubs.filter(s=>s.nextPaymentDate).forEach(s => {
      const d = new Date(s.nextPaymentDate)
      if (d >= todayD && d <= in7)
        al.push({ type:'upcoming', msg:`"${s.name}" tiene un pago próximo el ${d.toLocaleDateString('es-CL')}.` })
    })
    return al
  }, [activeSubs, totalSubs, totalInc])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  async function handleSaveGasto(item) {
    if (addExpense) await addExpense(item)
    setShowGasto(false); setShowAdd(false)
  }
  async function handleSaveSub(item) {
    if (addSubscription) await addSubscription(item)
    setShowSub(false); setShowAdd(false)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const kpiBox = { background:'var(--sur)', border:'.5px solid var(--brd)',
    borderRadius:'var(--r)', padding:'12px 14px', minWidth:0 }

  return (
    <div style={{ maxWidth:960, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--grn)',
          textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:4 }}>Movimientos</div>
        <h1 style={{ fontSize:20, fontWeight:700, color:'var(--tx)', marginBottom:2 }}>
          Salidas del mes
        </h1>
        <p style={{ fontSize:12, color:'var(--th)', fontFamily:'var(--mono)' }}>
          // {activeMonth} · gastos únicos + pagos recurrentes
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',
        gap:10, marginBottom:20 }}>
        {[
          { label:'Ingresos',      value:fmtM(totalInc, sym),      color:'var(--accent,#00d4aa)' },
          { label:'Gastos únicos', value:fmtM(totalExp, sym),      color:'var(--red)' },
          { label:'Recurrentes',   value:fmtM(totalSubs, sym),     color:'var(--amb,#f5a623)' },
          { label:'Total salidas', value:fmtM(totalSalidas, sym),  color:'var(--red)' },
          { label:'Disponible',    value:fmtM(balance, sym),       color: balance >= 0 ? 'var(--accent,#00d4aa)' : 'var(--red)' },
        ].map((k,i) => (
          <div key={i} style={kpiBox}>
            <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--th)',
              textTransform:'uppercase', letterSpacing:'.8px', marginBottom:5 }}>{k.label}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:700, color:k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Banner impacto anual suscripciones */}
      {activeSubs.length > 0 && (
        <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:'var(--r)',
          background: totalSubs > totalInc * 0.15
            ? 'rgba(255,77,106,.08)' : 'rgba(245,166,35,.07)',
          border: `.5px solid ${totalSubs > totalInc * 0.15 ? 'var(--red)' : 'var(--amb,#f5a623)'}`,
          display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ fontSize:20 }}>
            {totalSubs > totalInc * 0.15 ? '⚠️' : '💡'}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:600, fontFamily:'var(--mono)',
              color: totalSubs > totalInc * 0.15 ? 'var(--red)' : 'var(--amb,#f5a623)',
              marginBottom:3 }}>
              Impacto anual de tus servicios recurrentes
            </div>
            <div style={{ fontSize:13, color:'var(--tx)', fontFamily:'var(--mono)' }}>
              Pagás <strong style={{ color:'var(--amb,#f5a623)' }}>{fmtM(totalSubs, sym)}/mes</strong>
              {' → '}
              <strong style={{ color:'var(--red)' }}>{fmtM(totalAnnual, sym)} al año</strong>
              {' en '}{activeSubs.length} servicio{activeSubs.length !== 1 ? 's' : ''} recurrentes
            </div>
          </div>
        </div>
      )}

      {/* Botón agregar */}
      <div style={{ marginBottom:16 }}>
        {!showAdd && !showGasto && !showSub && (
          <button onClick={() => setShowAdd(true)} style={{
            background:'var(--grn)', color:'#fff', border:'none', borderRadius:8,
            padding:'8px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            + Agregar salida
          </button>
        )}

        {showAdd && !showGasto && !showSub && (
          <div style={{ background:'var(--sur)', border:'.5px solid var(--brd)',
            borderRadius:'var(--r)', padding:'16px', marginBottom:4 }}>
            <div style={{ fontSize:13, color:'var(--tx)', fontWeight:600, marginBottom:12 }}>
              ¿Qué tipo de salida querés registrar?
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button onClick={() => { setShowAdd(false); setShowGasto(true) }}
                style={{ background:'var(--sur)', border:'.5px solid var(--red)', borderRadius:8,
                  padding:'10px 18px', fontSize:12, fontWeight:600, color:'var(--red)',
                  cursor:'pointer', flex:1, minWidth:140, textAlign:'left' }}>
                💳 Gasto único
                <div style={{ fontSize:10, fontWeight:400, color:'var(--th)', marginTop:3 }}>
                  Supermercado, bencina, arriendo
                </div>
              </button>
              <button onClick={() => { setShowAdd(false); setShowSub(true) }}
                style={{ background:'var(--sur)', border:'.5px solid var(--amb,#f5a623)', borderRadius:8,
                  padding:'10px 18px', fontSize:12, fontWeight:600, color:'var(--amb,#f5a623)',
                  cursor:'pointer', flex:1, minWidth:140, textAlign:'left' }}>
                🔄 Pago recurrente
                <div style={{ fontSize:10, fontWeight:400, color:'var(--th)', marginTop:3 }}>
                  Netflix, gimnasio, seguro, Claude
                </div>
              </button>
              <button onClick={() => setShowAdd(false)}
                style={{ background:'none', border:'.5px solid var(--brd)', borderRadius:8,
                  padding:'10px 14px', fontSize:12, color:'var(--th)', cursor:'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {showGasto && <FormGasto sym={sym} onSave={handleSaveGasto} onCancel={() => setShowGasto(false)}/>}
        {showSub   && <FormSub              onSave={handleSaveSub}   onCancel={() => setShowSub(false)}/>}
      </div>

      {/* Gráficos unificados */}
      {(monthExp.length > 0 || activeSubs.length > 0) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <ChartCard title="Top salidas del mes" minHeight={180}>
            <HorizontalBars records={topBarRecords} sym={sym} maxItems={8}/>
          </ChartCard>
          <ChartCard title="Distribución por categoría" minHeight={180}>
            <CategoryDonut records={chartRecords} sym={sym}/>
          </ChartCard>
        </div>
      )}

      {/* Alertas */}
      {alerts.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
          {alerts.map((a,i) => (
            <div key={i} style={{ padding:'8px 12px', borderRadius:8, fontSize:12,
              fontFamily:'var(--mono)', color:'var(--tx)',
              background: a.type==='upcoming' ? 'rgba(245,166,35,.08)' : 'rgba(0,184,217,.06)',
              border: `.5px solid ${a.type==='upcoming' ? 'var(--amb,#f5a623)' : 'var(--brd)'}` }}>
              {a.type==='upcoming' ? '📅 ' : a.type==='income' ? '⚠️ ' : '💡 '}{a.msg}
            </div>
          ))}
        </div>
      )}

      {/* Dos secciones compactas separadas */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Gastos únicos */}
        <div style={{ background:'var(--sur)', border:'.5px solid var(--brd)',
          borderRadius:'var(--r)', overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', borderBottom:'.5px solid var(--brd)',
            display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--red)',
              fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'.5px' }}>
              💳 Gastos únicos ({monthExp.length})
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--red)',
              fontFamily:'var(--mono)' }}>{fmtM(totalExp, sym)}</div>
          </div>
          <div style={{ maxHeight:320, overflowY:'auto' }}>
            {monthExp.length === 0 ? (
              <div style={{ padding:'20px', textAlign:'center', fontSize:12,
                color:'var(--th)', fontFamily:'var(--mono)' }}>
                Sin gastos este mes
              </div>
            ) : monthExp.slice(0,10).map((e,i) => (
              <div key={e.id} style={{ display:'flex', alignItems:'center', gap:8,
                padding:'8px 14px',
                borderBottom: i < Math.min(monthExp.length,10)-1 ? '.5px solid var(--brd)' : 'none' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
                  background: CAT_COLORS[e.category]||'#888' }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:'var(--tx)', fontWeight:500,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {e.description || e.category}
                  </div>
                  <div style={{ fontSize:10, color:'var(--th)', fontFamily:'var(--mono)' }}>
                    {e.category} · {e.date?.slice(5)}
                  </div>
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--red)',
                  fontFamily:'var(--mono)', flexShrink:0 }}>
                  -{fmtM(e.amount, sym)}
                </div>
              </div>
            ))}
            {monthExp.length > 10 && (
              <div style={{ padding:'8px 14px', fontSize:11, color:'var(--th)',
                fontFamily:'var(--mono)', textAlign:'center', borderTop:'.5px solid var(--brd)' }}>
                +{monthExp.length - 10} gastos más este mes
              </div>
            )}
          </div>
        </div>

        {/* Recurrentes */}
        <div style={{ background:'var(--sur)', border:'.5px solid var(--brd)',
          borderRadius:'var(--r)', overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', borderBottom:'.5px solid var(--brd)',
            display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--amb,#f5a623)',
              fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'.5px' }}>
              🔄 Recurrentes ({activeSubs.length})
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--amb,#f5a623)',
              fontFamily:'var(--mono)' }}>{fmtM(totalSubs, sym)}/mes</div>
          </div>
          <div style={{ maxHeight:320, overflowY:'auto' }}>
            {activeSubs.length === 0 ? (
              <div style={{ padding:'20px', textAlign:'center', fontSize:12,
                color:'var(--th)', fontFamily:'var(--mono)' }}>
                Sin recurrentes activos
              </div>
            ) : [...activeSubs]
              .sort((a,b) => toMonthly(Number(b.amount)||0,b.frequency) - toMonthly(Number(a.amount)||0,a.frequency))
              .map((sub,i,arr) => {
                const monthly = toMonthly(Number(sub.amount)||0, sub.frequency)
                const freq = FREQS.find(f => f.value === sub.frequency)?.label || sub.frequency
                return (
                  <div key={sub.id} style={{ display:'flex', alignItems:'center', gap:8,
                    padding:'8px 14px',
                    borderBottom: i < arr.length-1 ? '.5px solid var(--brd)' : 'none' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
                      background: CAT_COLORS[sub.category]||'#00b8d9' }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, color:'var(--tx)', fontWeight:500,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {sub.name}
                      </div>
                      <div style={{ fontSize:10, color:'var(--th)', fontFamily:'var(--mono)' }}>
                        {sub.category} · {freq}
                      </div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--amb,#f5a623)',
                      fontFamily:'var(--mono)', flexShrink:0 }}>
                      {fmtM(monthly, sym)}/mes
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>



      {/* Disclaimer */}
      <div style={{ fontSize:10, color:'var(--th)', fontFamily:'var(--mono)', marginTop:4 }}>
        Las visualizaciones muestran el costo mensual equivalente de cada salida. No constituyen asesoría financiera.
      </div>
    </div>
  )
}
