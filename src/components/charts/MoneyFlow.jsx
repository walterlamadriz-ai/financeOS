// src/components/charts/MoneyFlow.jsx
// Flujo de dinero del mes — FinanceOS
// Visualización orientativa, sin recomendaciones financieras

import { useMemo } from 'react'
import { ChartEmpty } from './ChartCard.jsx'

function fmtV(v, sym) {
  const n = Number(v) || 0
  if (n >= 1000000) return `${sym}${(n/1000000).toFixed(1)}M`
  if (n >= 1000)    return `${sym}${(n/1000).toFixed(0)}K`
  return `${sym}${Math.round(n).toLocaleString('es-CL')}`
}

const FLOW_COLORS = {
  gastos:        '#ff4d6a',
  suscripciones: '#f5a623',
  deudas:        '#00b8d9',
  metas:         '#a78bfa',
  disponible:    '#00d4aa',
}

export default function MoneyFlow({ incomes, expenses, subscriptions, debts, goals, sym = '$' }) {
  const safeInc  = Array.isArray(incomes)       ? incomes       : []
  const safeExp  = Array.isArray(expenses)       ? expenses      : []
  const safeSubs = Array.isArray(subscriptions)  ? subscriptions : []
  const safeDebt = Array.isArray(debts)          ? debts         : []
  const safeGoal = Array.isArray(goals)          ? goals         : []

  const flow = useMemo(() => {
    const totalInc = safeInc.reduce((s, r) => s + (Number(r?.amount) || 0), 0)
    if (totalInc === 0) return null

    const totalExp = safeExp.reduce((s, r) => s + (Number(r?.amount) || 0), 0)

    // Suscripciones — costo mensual estimado
    const totalSubs = safeSubs
      .filter(s => s?.status === 'active')
      .reduce((s, sub) => {
        const amt  = Number(sub.amount) || 0
        const freq = sub.frequency || 'monthly'
        if (freq === 'annual' || freq === 'anual') return s + amt / 12
        if (freq === 'quarterly') return s + amt / 3
        if (freq === 'weekly') return s + amt * 4.33
        return s + amt
      }, 0)

    // Deudas — pago mínimo mensual
    const totalDebt = safeDebt.reduce((s, d) => s + (Number(d?.minPayment) || 0), 0)

    // Metas — ahorro mensual estimado (no calculable directamente, omitir si 0)
    // Usamos 0 si no hay datos — no inventamos
    const totalMetas = 0 // sin campo de aporte mensual en el modelo actual

    const totalSalidas = totalExp + totalSubs + totalDebt
    const disponible   = Math.max(0, totalInc - totalSalidas)

    const items = [
      { key: 'gastos',        label: 'Gastos',         amount: totalExp,   color: FLOW_COLORS.gastos },
      totalSubs > 0 && { key: 'suscripciones', label: 'Suscripciones', amount: totalSubs, color: FLOW_COLORS.suscripciones },
      totalDebt > 0 && { key: 'deudas',        label: 'Pagos deuda',   amount: totalDebt, color: FLOW_COLORS.deudas },
      { key: 'disponible',    label: 'Disponible',     amount: disponible, color: FLOW_COLORS.disponible },
    ].filter(Boolean)

    return { totalInc, items }
  }, [safeInc, safeExp, safeSubs, safeDebt])

  if (!flow) {
    return <ChartEmpty msg="Agrega ingresos y gastos para ver el flujo de dinero del mes." />
  }

  const { totalInc, items } = flow

  return (
    <div>
      {/* Mobile: lista vertical */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {/* Ingresos — fuente */}
        <div style={{ background:'rgba(0,212,170,.08)', border:'.5px solid rgba(0,212,170,.25)', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }}/>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--tx)' }}>Ingresos</span>
          </div>
          <span style={{ fontFamily:'var(--mono)', fontSize:14, fontWeight:700, color:'var(--accent)' }}>{fmtV(totalInc, sym)}</span>
        </div>

        {/* Flecha */}
        <div style={{ textAlign:'center', color:'var(--th)', fontSize:16, lineHeight:1 }}>↓</div>

        {/* Salidas */}
        {items.map((item, i) => {
          const pct = totalInc > 0 ? Math.min((item.amount / totalInc) * 100, 100) : 0
          const isDisponible = item.key === 'disponible'
          return (
            <div key={item.key}>
              {!isDisponible && i > 0 && (
                <div style={{ textAlign:'center', color:'var(--th)', fontSize:14, lineHeight:1, marginBottom:6 }}>↓</div>
              )}
              {isDisponible && (
                <div style={{ textAlign:'center', color:'var(--accent)', fontSize:14, lineHeight:1, marginBottom:6 }}>✓</div>
              )}
              <div style={{
                background: isDisponible ? 'rgba(0,212,170,.06)' : 'var(--sur)',
                border: `.5px solid ${isDisponible ? 'rgba(0,212,170,.2)' : 'var(--brd)'}`,
                borderRadius:8, padding:'10px 14px',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:item.color, flexShrink:0 }}/>
                    <span style={{ fontSize:12, color:'var(--tx)' }}>{item.label}</span>
                  </div>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--th)' }}>{pct.toFixed(0)}%</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:600, color:item.color }}>{fmtV(item.amount, sym)}</span>
                  </div>
                </div>
                {/* Barra proporcional */}
                <div style={{ height:4, background:'var(--sur2)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:item.color, borderRadius:2, transition:'width .4s ease' }}/>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop:12, fontSize:10, color:'var(--th)', fontFamily:'var(--mono)', lineHeight:1.5 }}>
        Distribución orientativa basada en los datos del mes activo. No constituye asesoría financiera.
      </div>
    </div>
  )
}
