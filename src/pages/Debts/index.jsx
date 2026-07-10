// src/pages/Debts/index.jsx — v1.5
import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useT } from '../../i18n/useT.js'
import { KPI, Card, CardHeader, FormGroup, FormRow, Btn, Alert, Badge, ProgressBar, PageHeader } from '../../components/ui/index.jsx'
import { fmtMoney, fmtPct } from '../../utils/index.js'
import { CURRENCY_SYMBOLS } from '../shared/constants.js'
import DebtProgressList from '../../components/charts/DebtProgressList.jsx'
import ProGate from '../../components/ui/ProGate.jsx'

// ── Calculadora Avalanche / Snowball ─────────────────────────────────────────
function calcPayoffPlan(debts, extraPayment, method) {
  if (!debts.length) return { months: 0, totalInterest: 0, order: [] }
  let pool = debts
    .filter(d => d.balance > 0 && d.minPayment > 0)
    .map(d => ({ ...d, balance: Number(d.balance), minPayment: Number(d.minPayment), rate: Number(d.rate) || 0 }))

  // Ordenar según método
  if (method === 'avalanche') pool.sort((a, b) => b.rate - a.rate)
  else pool.sort((a, b) => a.balance - b.balance) // snowball

  let months = 0
  let totalInterest = 0
  const maxMonths = 600

  while (pool.some(d => d.balance > 0) && months < maxMonths) {
    months++
    // Aplicar interés mensual
    pool = pool.map(d => {
      if (d.balance <= 0) return d
      const interest = d.balance * (d.rate / 100 / 12)
      totalInterest += interest
      return { ...d, balance: d.balance + interest }
    })
    // Pagar mínimos
    pool = pool.map(d => {
      if (d.balance <= 0) return d
      const pay = Math.min(d.minPayment, d.balance)
      return { ...d, balance: Math.max(0, d.balance - pay) }
    })
    // Aplicar pago extra a la primera deuda activa (según orden del método)
    let extra = extraPayment
    for (let i = 0; i < pool.length && extra > 0; i++) {
      if (pool[i].balance > 0) {
        const pay = Math.min(extra, pool[i].balance)
        pool[i] = { ...pool[i], balance: Math.max(0, pool[i].balance - pay) }
        extra -= pay
      }
    }
  }

  return { months, totalInterest: Math.round(totalInterest) }
}

function DebtPayoffSimulator({ debts, sym }) {
  const [method, setMethod]   = useState('avalanche')
  const [extra, setExtra]     = useState(0)
  const activeDebts = debts.filter(d => d.balance > 0 && d.minPayment > 0)

  const base     = useMemo(() => calcPayoffPlan(activeDebts, 0, method), [activeDebts, method])
  const withExtra = useMemo(() => calcPayoffPlan(activeDebts, Number(extra)||0, method), [activeDebts, extra, method])

  const monthsSaved    = base.months - withExtra.months
  const interestSaved  = base.totalInterest - withExtra.totalInterest

  const fmtMonths = m => m >= 600 ? '+50 años' : m > 12 ? `${Math.floor(m/12)} año${Math.floor(m/12)>1?'s':''} ${m%12?`${m%12} mes`:''}` : `${m} mes${m!==1?'es':''}`

  if (!activeDebts.length) return null

  return (
    <Card>
      <CardHeader title="Simulador de pago — Avalanche & Snowball" />
      <p style={{fontSize:12,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:16,marginTop:-4,lineHeight:1.6}}>
        Calcula cuánto antes puedes salir de deudas y cuánto ahorras en intereses pagando un poco más cada mes.
      </p>

      {/* Selector de método */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {[
          { id:'avalanche', label:'⚡ Avalanche', desc:'Mayor tasa primero · Ahorra más intereses' },
          { id:'snowball',  label:'❄️ Snowball',  desc:'Menor saldo primero · Más motivación' },
        ].map(m => (
          <button key={m.id} onClick={() => setMethod(m.id)} style={{
            flex:1, minWidth:160, padding:'10px 14px', borderRadius:8, cursor:'pointer', textAlign:'left',
            border: method===m.id ? '1.5px solid var(--grn)' : '.5px solid var(--brd)',
            background: method===m.id ? 'rgba(10,92,62,.06)' : 'var(--sur)',
          }}>
            <div style={{fontSize:12,fontWeight:600,color: method===m.id ? 'var(--grn)' : 'var(--tx)',fontFamily:'var(--mono)'}}>{m.label}</div>
            <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginTop:3}}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Input pago extra */}
      <div style={{marginBottom:16}}>
        <label style={{fontSize:11,color:'var(--th)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.5px',display:'block',marginBottom:4}}>
          Pago extra mensual ({sym})
        </label>
        <input
          type="number" min="0" value={extra}
          onChange={e => setExtra(e.target.value)}
          placeholder="0 — solo con mínimos"
          style={{width:'100%',maxWidth:240,padding:'7px 10px',borderRadius:7,border:'.5px solid var(--brd)',background:'var(--sur)',color:'var(--tx)',fontFamily:'var(--mono)',fontSize:13}}
        />
      </div>

      {/* Resultados */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:12}}>
        <div style={{padding:'12px 14px',borderRadius:8,background:'var(--sur)',border:'.5px solid var(--brd)'}}>
          <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:4}}>Libre de deudas en</div>
          <div style={{fontSize:18,fontWeight:700,color:'var(--tx)',fontFamily:'var(--mono)'}}>{fmtMonths(withExtra.months)}</div>
          {monthsSaved > 0 && <div style={{fontSize:10,color:'var(--grn)',fontFamily:'var(--mono)',marginTop:3}}>↓ {fmtMonths(monthsSaved)} antes</div>}
        </div>
        <div style={{padding:'12px 14px',borderRadius:8,background:'var(--sur)',border:'.5px solid var(--brd)'}}>
          <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:4}}>Intereses totales</div>
          <div style={{fontSize:18,fontWeight:700,color:'var(--red,#e53e3e)',fontFamily:'var(--mono)'}}>{fmtMoney(withExtra.totalInterest,sym)}</div>
          {interestSaved > 0 && <div style={{fontSize:10,color:'var(--grn)',fontFamily:'var(--mono)',marginTop:3}}>↓ {fmtMoney(interestSaved,sym)} ahorrado</div>}
        </div>
        {(Number(extra)||0) > 0 && monthsSaved > 0 && (
          <div style={{padding:'12px 14px',borderRadius:8,background:'rgba(10,92,62,.06)',border:'1px solid rgba(10,92,62,.2)'}}>
            <div style={{fontSize:9,color:'var(--grn)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:4}}>Con {sym}{Number(extra).toLocaleString('es-CL')}/mes extra</div>
            <div style={{fontSize:13,fontWeight:700,color:'var(--grn)',fontFamily:'var(--mono)'}}>Ahorrás {fmtMoney(interestSaved,sym)}</div>
            <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginTop:3}}>en {fmtMonths(monthsSaved)} menos</div>
          </div>
        )}
      </div>

      {/* Orden de pago */}
      <div style={{marginTop:4}}>
        <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:8}}>
          Orden recomendado — método {method === 'avalanche' ? 'Avalanche' : 'Snowball'}
        </div>
        {[...activeDebts]
          .sort((a,b) => method==='avalanche' ? (Number(b.rate)||0)-(Number(a.rate)||0) : Number(a.balance)-Number(b.balance))
          .map((d,i) => (
            <div key={d.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderTop:i>0?'.5px solid var(--brd)':'none'}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:i===0?'var(--grn)':'var(--brd)',color:i===0?'#fff':'var(--th)',fontSize:10,fontFamily:'var(--mono)',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,fontSize:12,fontFamily:'var(--mono)',color:'var(--tx)'}}>{d.creditor}</div>
              <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--th)'}}>{fmtMoney(d.balance,sym)}</div>
              {Number(d.rate) > 0 && <Badge color="red">{d.rate}% TAE</Badge>}
            </div>
          ))
        }
      </div>
      <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginTop:12,lineHeight:1.6}}>
        Proyección orientativa basada en tasa anual ingresada. No constituye asesoría financiera.
      </div>
    </Card>
  )
}

export default function Debts() {
  const { debts, addDebt, delDebt, updateDebt, addExpense, incomes, expenses, settings } = useApp()
  const { t } = useT()
  const [show, setShow]             = useState(false)
  const [f, setF]                   = useState({ creditor:'', initial:'', balance:'', minPayment:'', dueDate:'', rate:'', totalInstallments:'', paidInstallments:'', project:'' })
  const [err, setErr]               = useState('')
  const [confirmPay, setConfirmPay] = useState(null)
  const [payMsg, setPayMsg]         = useState(null)
  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'

  const totalBalance = useMemo(() => debts.reduce((s,d) => s+d.balance, 0), [debts])
  const totalMin     = useMemo(() => debts.reduce((s,d) => s+d.minPayment, 0), [debts])
  const totalPaid    = useMemo(() => debts.reduce((s,d) => s+Math.max(0,(Number(d.initial)||Number(d.balance)||0)-Number(d.balance||0)), 0), [debts])
  const knownProjects = useMemo(() => {
    const set = new Set()
    ;[...(incomes||[]), ...(expenses||[])].forEach(r => { const k=(r?.project||'').trim(); if(k) set.add(k) })
    return [...set].sort()
  }, [incomes, expenses])

  async function handleRegisterPayment(d) {
    const monto = Math.min(Number(d.minPayment)||0, d.balance)
    if (monto <= 0) return
    const newBalance = Math.max(0, d.balance - monto)
    const todayStr = new Date().toISOString().slice(0,10)
    await updateDebt({...d, balance:newBalance, paidInstallments:(Number(d.paidInstallments)||0)+1})
    await addExpense({
      date: todayStr,
      description: `Pago deuda · ${d.creditor}`,
      amount: monto,
      category: 'Deudas',
      notes: `Cuota ${(Number(d.paidInstallments)||0)+1} registrada automáticamente`,
    })
    setConfirmPay(null)
    setPayMsg({id:d.id, text:`✓ Pago de ${sym}${Math.round(monto).toLocaleString('es-CL')} registrado`})
    setTimeout(() => setPayMsg(null), 3000)
  }

  async function submit() {
    if (!f.creditor.trim() || !f.balance || Number(f.balance) <= 0) { setErr('Acreedor y saldo son requeridos'); return }
    const init = Number(f.initial) || Number(f.balance)
    if (Number(f.balance) > init) { setErr('El saldo actual no puede superar el monto inicial'); return }
    setErr('')
    await addDebt({...f, initial:init, balance:Number(f.balance), minPayment:Number(f.minPayment)||0, rate:Number(f.rate)||0, totalInstallments:Number(f.totalInstallments)||0, paidInstallments:Number(f.paidInstallments)||0})
    setF({creditor:'',initial:'',balance:'',minPayment:'',dueDate:'',rate:'',totalInstallments:'',paidInstallments:'',project:''})
    setShow(false)
  }

  return (
    <div className="stack">
      <PageHeader title="Deudas" sub="Seguimiento de obligaciones financieras" />
      <p style={{fontSize:12,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12,marginTop:-4}}>Sigue saldo pendiente y avance de pago por deuda.</p>
      <div className="kpi-row">
        <KPI label="Deuda total"       value={fmtMoney(totalBalance,sym)} color="red" />
        <KPI label="Pago mín. mensual" value={fmtMoney(totalMin,sym)} />
        <KPI label="Deudas activas"    value={debts.length} />
        <KPI label="Total pagado"      value={fmtMoney(totalPaid,sym)} color="green" />
      </div>
      <div><Btn variant="primary" onClick={() => setShow(s => !s)}>{show ? '— Cerrar' : '+ Nueva deuda'}</Btn></div>
      {show && (
        <Card>
          <CardHeader title="Nueva deuda" />
          {err && <Alert type="danger">⚠ {err}</Alert>}
          <FormRow>
            <FormGroup label="Acreedor"><input type="text" value={f.creditor} placeholder="ej. Banco, Persona" onChange={e => setF(p=>({...p,creditor:e.target.value}))} /></FormGroup>
            <FormGroup label={`Saldo actual (${settings.currency||'CLP'})`}><input type="number" min="0" value={f.balance} placeholder="0" onChange={e => setF(p=>({...p,balance:e.target.value}))} /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Monto inicial"><input type="number" min="0" value={f.initial} placeholder="Si no sabes, igual al saldo" onChange={e => setF(p=>({...p,initial:e.target.value}))} /></FormGroup>
            <FormGroup label="Pago mínimo"><input type="number" min="0" value={f.minPayment} placeholder="0" onChange={e => setF(p=>({...p,minPayment:e.target.value}))} /></FormGroup>
          </FormRow>
          <div style={{marginTop:8,marginBottom:8}}>
            <button type="button" onClick={() => setF(p=>({...p,_showExtra:!p._showExtra}))}
              style={{background:'none',border:'none',color:'var(--grn)',fontSize:12,fontFamily:'var(--mono)',cursor:'pointer',padding:0}}>
              {f._showExtra ? '▲ Menos opciones' : '▼ Más opciones (tasa, cuotas, vencimiento)'}
            </button>
          </div>
          {f._showExtra && (
            <>
              <FormRow>
                <FormGroup label="Fecha vencimiento"><input type="date" value={f.dueDate} onChange={e => setF(p=>({...p,dueDate:e.target.value}))} /></FormGroup>
                <FormGroup label="Tasa anual % (TAE)"><input type="number" min="0" max="200" value={f.rate} placeholder="0" onChange={e => setF(p=>({...p,rate:e.target.value}))} /></FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup label="Cuotas totales"><input type="number" min="0" value={f.totalInstallments} placeholder="ej. 36" onChange={e => setF(p=>({...p,totalInstallments:e.target.value}))} /></FormGroup>
                <FormGroup label="Cuotas pagadas"><input type="number" min="0" value={f.paidInstallments} placeholder="ej. 12" onChange={e => setF(p=>({...p,paidInstallments:e.target.value}))} /></FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup label={t('debts.projectLabel')}>
                  <input type="text" list="fnos-debt-projects" value={f.project} placeholder={t('debts.projectPlaceholder')} onChange={e => setF(p=>({...p,project:e.target.value}))} />
                  <datalist id="fnos-debt-projects">{knownProjects.map(n => <option key={n} value={n} />)}</datalist>
                </FormGroup>
              </FormRow>
            </>
          )}
          <div style={{display:'flex',gap:8}}>
            <Btn variant="primary" onClick={submit}>+ Registrar deuda</Btn>
            <Btn variant="ghost" onClick={() => setShow(false)}>Cancelar</Btn>
          </div>
        </Card>
      )}
      {debts.length === 0 && !show && (
        <Card><div style={{textAlign:'center',padding:'24px 0'}}>
          <div style={{fontSize:13,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12}}>Aún no tienes deudas registradas.</div>
          <button onClick={() => setShow(true)} style={{background:'var(--grn)',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Agregar deuda</button>
        </div></Card>
      )}
      {debts.map(d => {
        const paid      = Math.max(0, d.initial - d.balance)
        const prog      = d.initial > 0 ? paid/d.initial : 0
        const totalInst = Number(d.totalInstallments)||0
        const paidInst  = Number(d.paidInstallments)||0
        const pendInst  = totalInst > 0 ? Math.max(0,totalInst-paidInst) : 0
        const instProg  = totalInst > 0 ? paidInst/totalInst : 0
        const monthsLeft = d.minPayment > 0 && d.balance > 0 ? Math.ceil(d.balance/d.minPayment) : pendInst > 0 ? pendInst : 0
        const finDate   = monthsLeft > 0 ? new Date(Date.now()+monthsLeft*30*24*60*60*1000).toLocaleDateString('es-CL',{month:'short',year:'numeric'}) : null
        return (
          <Card key={d.id}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--tx)'}}>{d.creditor}</div>
              <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
                {d.rate > 0 && <Badge color="red">{d.rate}% TAE</Badge>}
                {(d.project||'').trim() && <Badge color="green">🏢 {d.project}</Badge>}
                {d.balance > 0 && d.minPayment > 0 && confirmPay !== d.id && (
                  <button onClick={() => setConfirmPay(d.id)}
                    style={{fontSize:11,padding:'2px 8px',borderRadius:4,border:'0.5px solid rgba(10,92,62,.3)',background:'rgba(10,92,62,.08)',color:'var(--grn)',cursor:'pointer',fontFamily:'var(--mono)',fontWeight:600}}>
                    💳 Registrar pago
                  </button>
                )}
                {d.balance <= 0 && <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,background:'rgba(10,92,62,.1)',color:'var(--grn)',fontFamily:'var(--mono)'}}>✓ Saldada</span>}
                <button onClick={() => delDebt(d.id)} aria-label="Eliminar deuda" style={{background:'none',border:'none',color:'var(--th)',fontSize:13,cursor:'pointer',minWidth:44,minHeight:44,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              </div>
            </div>
            {confirmPay === d.id && (
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',marginBottom:8,background:'rgba(10,92,62,.06)',borderRadius:6,border:'0.5px solid rgba(10,92,62,.2)',flexWrap:'wrap'}}>
                <span style={{fontSize:12,color:'var(--tx)',fontFamily:'var(--mono)',flex:1}}>
                  ¿Registrar pago de <strong>{sym}{Math.round(Math.min(Number(d.minPayment)||0,d.balance)).toLocaleString('es-CL')}</strong> para {d.creditor}?
                </span>
                <div style={{display:'flex',gap:6}}>
                  <Btn variant="primary" size="xs" onClick={() => handleRegisterPayment(d)}>✓ Confirmar</Btn>
                  <Btn variant="ghost"   size="xs" onClick={() => setConfirmPay(null)}>Cancelar</Btn>
                </div>
              </div>
            )}
            {payMsg?.id === d.id && (
              <div style={{fontSize:11,color:'var(--grn)',fontFamily:'var(--mono)',marginBottom:6,padding:'4px 8px',background:'rgba(10,92,62,.06)',borderRadius:4}}>{payMsg.text}</div>
            )}
            <div style={{fontSize:11,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:8}}>
              Saldo: {fmtMoney(d.balance,sym)}{d.minPayment ? ` · Cuota: ${fmtMoney(d.minPayment,sym)}/mes` : ''}{d.dueDate ? ` · Vence: ${d.dueDate.slice(5).replace('-','/')}` : ''}
            </div>
            <div style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',marginBottom:3}}>
                <span>Progreso por monto</span><span>{fmtPct(prog)} pagado</span>
              </div>
              <ProgressBar value={paid} max={d.initial} color="green" height={5}/>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:3,fontSize:10,fontFamily:'var(--mono)',color:'var(--th)'}}>
                <span>Pagado: {fmtMoney(paid,sym)}</span><span>Inicial: {fmtMoney(d.initial,sym)}</span>
              </div>
            </div>
            {totalInst > 0 && (
              <div style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',marginBottom:3}}>
                  <span>Cuotas</span><span>{paidInst}/{totalInst}</span>
                </div>
                <div style={{height:5,background:'var(--brd)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.min(instProg*100,100)}%`,background:'var(--accent,#00d4aa)',borderRadius:3,transition:'.3s'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:3,fontSize:10,fontFamily:'var(--mono)'}}>
                  <span style={{color:'var(--accent,#00d4aa)'}}>✅ Pagadas: {paidInst}</span>
                  <span style={{color:'var(--amb,#f5a623)'}}>⏳ Pendientes: {pendInst}</span>
                </div>
              </div>
            )}
            {monthsLeft > 0 && (
              <div style={{marginTop:6,padding:'8px 10px',borderRadius:6,background:'rgba(0,212,170,.06)',border:'.5px solid rgba(0,212,170,.2)',display:'flex',gap:16,flexWrap:'wrap'}}>
                <div><div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>Meses restantes</div><div style={{fontSize:14,fontWeight:700,color:'var(--tx)',fontFamily:'var(--mono)'}}>{monthsLeft}</div></div>
                {finDate && <div><div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>Fin estimado</div><div style={{fontSize:14,fontWeight:700,color:'var(--accent,#00d4aa)',fontFamily:'var(--mono)'}}>📅 {finDate}</div></div>}
                {d.minPayment > 0 && <div><div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>Total restante</div><div style={{fontSize:14,fontWeight:700,color:'var(--red)',fontFamily:'var(--mono)'}}>{fmtMoney(d.balance,sym)}</div></div>}
              </div>
            )}
          </Card>
        )
      })}
      {debts.length > 0 && <ProGate feature="Simulador de liquidación de deudas"><DebtPayoffSimulator debts={debts} sym={sym} /></ProGate>}
      {debts.length > 0 && <DebtProgressList debts={debts} sym={sym} />}
    </div>
  )
}
