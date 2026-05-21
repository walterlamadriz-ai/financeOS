// src/pages/Dashboard/index.jsx
// Dashboard con Visual Insights — FinanceOS v1.0

import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import ChartCard from '../../components/charts/ChartCard.jsx'
import IncomeExpenseBar from '../../components/charts/IncomeExpenseBar.jsx'
import CategoryDonut from '../../components/charts/CategoryDonut.jsx'

const fmt = (n) => (Number(n) || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })
const pct = (n) => ((Number(n) || 0) * 100).toFixed(1) + '%'

export default function Dashboard({ setPage }) {
  const ctx      = useApp() || {}
  const incomes  = Array.isArray(ctx.incomes)       ? ctx.incomes       : []
  const expenses = Array.isArray(ctx.expenses)      ? ctx.expenses      : []
  const settings = (ctx.settings && typeof ctx.settings === 'object') ? ctx.settings : {}
  const subs     = Array.isArray(ctx.subscriptions) ? ctx.subscriptions : []

  const sym         = { CLP:'$', USD:'US$', EUR:'€', VES:'Bs.', MXN:'$', ARS:'$', COP:'$' }[settings.currency] || '$'
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)

  const kpis = useMemo(() => {
    const inc      = incomes.filter(r  => r?.date?.startsWith(activeMonth))
    const exp      = expenses.filter(r => r?.date?.startsWith(activeMonth))
    const totalInc = inc.reduce((s, r)  => s + (Number(r?.amount) || 0), 0)
    const totalExp = exp.reduce((s, r)  => s + (Number(r?.amount) || 0), 0)
    const balance  = totalInc - totalExp
    return { totalInc, totalExp, balance, savingRate: totalInc > 0 ? balance / totalInc : 0, incCount: inc.length, expCount: exp.length }
  }, [incomes, expenses, activeMonth])

  const monthExpenses = useMemo(() =>
    expenses.filter(r => r?.date?.startsWith(activeMonth)),
    [expenses, activeMonth]
  )

  // Suscripciones — calcular mensual desde el array
  const subMonthly = useMemo(() => subs.reduce((s, sub) => {
    if (!sub) return s
    const amt  = Number(sub.amount) || 0
    const freq = sub.frequency || sub.frecuencia || 'monthly'
    if (freq === 'annual' || freq === 'anual') return s + amt / 12
    return s + amt
  }, 0), [subs])

  const KPIS = [
    { label:'Ingresos',       value:`${sym}${fmt(kpis.totalInc)}`,  color:'var(--accent)', sub:`${kpis.incCount} registros` },
    { label:'Gastos',         value:`${sym}${fmt(kpis.totalExp)}`,  color:'var(--red)',    sub:`${kpis.expCount} registros` },
    { label:'Balance neto',   value:`${sym}${fmt(kpis.balance)}`,   color:kpis.balance >= 0 ? 'var(--accent)' : 'var(--red)', sub:kpis.balance >= 0 ? 'Positivo' : 'Negativo' },
    { label:'Tasa de ahorro', value:pct(kpis.savingRate),           color:kpis.savingRate >= 0.2 ? 'var(--accent)' : kpis.savingRate >= 0 ? 'var(--amb)' : 'var(--red)', sub:'del ingreso' },
    { label:'Suscripciones',  value:`${sym}${fmt(subMonthly)}/mes`, color:'var(--amb)',    sub:`${sym}${fmt(subMonthly * 12)}/año estimado` },
  ]

  return (
    <div style={{ maxWidth:960, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--grn2)', marginBottom:6 }}>Dashboard</div>
        <h1 style={{ fontSize:22, fontWeight:700, color:'var(--tx)', letterSpacing:'-.5px', marginBottom:2 }}>Resumen financiero</h1>
        <p style={{ fontSize:13, color:'var(--th)', fontFamily:'var(--mono)' }}>// {activeMonth} · datos locales</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:20 }}>
        {KPIS.map((k, i) => (
          <div key={i} style={{ background:'var(--sur)', border:'.5px solid var(--brd)', borderRadius:'var(--r)', padding:'14px 16px' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--th)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:6 }}>{k.label}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:700, color:k.color, marginBottom:3 }}>{k.value}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--th)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <ChartCard title="Ingresos vs Gastos" subtitle="últimos 6 meses" minHeight={220}>
          <IncomeExpenseBar incomes={incomes} expenses={expenses} sym={sym} months={6}/>
        </ChartCard>
        <ChartCard title="Gastos por categoría" subtitle={activeMonth} minHeight={160}>
          <CategoryDonut records={monthExpenses} sym={sym} maxCategories={6}/>
        </ChartCard>
      </div>

      {setPage && (
        <div style={{ padding:'10px 14px', background:'var(--sur)', border:'.5px solid var(--brd)', borderRadius:'var(--r)', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span style={{ fontSize:12, color:'var(--th)', fontFamily:'var(--mono)' }}>◈ Revisa señales orientativas en FinanceOS Coach.</span>
          <button onClick={() => setPage('coach')} style={{ background:'none', border:'.5px solid var(--brd2)', borderRadius:6, padding:'4px 12px', fontSize:11, color:'var(--accent)', cursor:'pointer', fontFamily:'var(--mono)' }}>
            Ver Coach →
          </button>
        </div>
      )}

      <div style={{ fontSize:10, color:'var(--th)', fontFamily:'var(--mono)', lineHeight:1.6 }}>
        Los gráficos reflejan los datos registrados en FinanceOS. No constituyen asesoría financiera, tributaria, legal ni de inversión.
      </div>
    </div>
  )
}
