// src/pages/Debts/index.jsx — v1.5
import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { KPI, Card, CardHeader, FormGroup, FormRow, Btn, Alert, Badge, ProgressBar, PageHeader } from '../../components/ui/index.jsx'
import { fmtMoney, fmtPct } from '../../utils/index.js'
import { CURRENCY_SYMBOLS } from '../shared/constants.js'
import DebtProgressList from '../../components/charts/DebtProgressList.jsx'

export default function Debts() {
  const { debts, addDebt, delDebt, updateDebt, addExpense, settings } = useApp()
  const [show, setShow]             = useState(false)
  const [f, setF]                   = useState({ creditor:'', initial:'', balance:'', minPayment:'', dueDate:'', rate:'', totalInstallments:'', paidInstallments:'' })
  const [err, setErr]               = useState('')
  const [confirmPay, setConfirmPay] = useState(null)
  const [payMsg, setPayMsg]         = useState(null)
  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'

  const totalBalance = useMemo(() => debts.reduce((s,d) => s+d.balance, 0), [debts])
  const totalMin     = useMemo(() => debts.reduce((s,d) => s+d.minPayment, 0), [debts])
  const totalPaid    = useMemo(() => debts.reduce((s,d) => s+Math.max(0,(Number(d.initial)||Number(d.balance)||0)-Number(d.balance||0)), 0), [debts])

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
    setF({creditor:'',initial:'',balance:'',minPayment:'',dueDate:'',rate:'',totalInstallments:'',paidInstallments:''})
    setShow(false)
  }

  return (
    <div className="stack">
      <PageHeader title="Deudas" sub="Seguimiento de obligaciones financieras" />
      <p style={{fontSize:12,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12,marginTop:-4}}>Sigue saldo pendiente y avance de pago por deuda.</p>
      <div className="kpi-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
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
                {d.balance > 0 && d.minPayment > 0 && confirmPay !== d.id && (
                  <button onClick={() => setConfirmPay(d.id)}
                    style={{fontSize:11,padding:'2px 8px',borderRadius:4,border:'0.5px solid rgba(10,92,62,.3)',background:'rgba(10,92,62,.08)',color:'var(--grn)',cursor:'pointer',fontFamily:'var(--mono)',fontWeight:600}}>
                    💳 Registrar pago
                  </button>
                )}
                {d.balance <= 0 && <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,background:'rgba(10,92,62,.1)',color:'var(--grn)',fontFamily:'var(--mono)'}}>✓ Saldada</span>}
                <button onClick={() => delDebt(d.id)} style={{background:'none',border:'none',color:'var(--th)',fontSize:11,cursor:'pointer'}}>✕</button>
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
      {debts.length > 0 && <DebtProgressList debts={debts} sym={sym} />}
    </div>
  )
}
