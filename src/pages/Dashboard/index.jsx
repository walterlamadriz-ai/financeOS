// src/pages/Dashboard/index.jsx
// Dashboard Visual Polish — FinanceOS v1.1.1

import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import ChartCard from '../../components/charts/ChartCard.jsx'
import IncomeExpenseBar from '../../components/charts/IncomeExpenseBar.jsx'
import CategoryDonut from '../../components/charts/CategoryDonut.jsx'
import MoneyFlow from '../../components/charts/MoneyFlow.jsx'

const fmt  = (n) => (Number(n) || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })
const pct  = (n) => ((Number(n) || 0) * 100).toFixed(1) + '%'
const pct0 = (n) => ((Number(n) || 0) * 100).toFixed(0) + '%'

export default function Dashboard({ setPage }) {
  const ctx      = useApp() || {}
  const incomes  = Array.isArray(ctx.incomes)       ? ctx.incomes       : []
  const expenses = Array.isArray(ctx.expenses)      ? ctx.expenses      : []
  const budgets  = Array.isArray(ctx.budgets)       ? ctx.budgets       : []
  const goals    = Array.isArray(ctx.goals)         ? ctx.goals         : []
  const settings = (ctx.settings && typeof ctx.settings === 'object') ? ctx.settings : {}
  const subs     = Array.isArray(ctx.subscriptions) ? ctx.subscriptions : []
  const debts    = Array.isArray(ctx.debts) ? ctx.debts : []

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

  const subMonthly = useMemo(() => subs.reduce((s, sub) => {
    if (!sub) return s
    const amt  = Number(sub.amount) || 0
    const freq = sub.frequency || 'monthly'
    if (freq === 'annual' || freq === 'anual') return s + amt / 12
    return s + amt
  }, 0), [subs])

  // ── Insight cards ─────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const cards = []

    // Suscripciones anuales
    if (subMonthly > 0) {
      cards.push({
        icon: '↻',
        color: 'var(--amb)',
        bg: 'rgba(245,166,35,.07)',
        border: 'rgba(245,166,35,.22)',
        text: `Tus suscripciones suman ${sym}${fmt(subMonthly * 12)} al año.`,
        sub: 'Revisa si todas siguen siendo útiles.',
      })
    }

    // Categoría principal de gasto
    if (monthExpenses.length > 0) {
      const catMap = {}
      monthExpenses.forEach(e => {
        const cat = e.category || 'Sin categoría'
        catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0)
      })
      const totalExp = monthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
      const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
      if (topCat && totalExp > 0) {
        const catPct = ((topCat[1] / totalExp) * 100).toFixed(0)
        cards.push({
          icon: '◑',
          color: 'var(--accent2, #00b8d9)',
          bg: 'rgba(0,184,217,.07)',
          border: 'rgba(0,184,217,.2)',
          text: `${topCat[0]} representa el ${catPct}% de tus gastos del mes.`,
          sub: 'Es tu categoría de mayor gasto.',
        })
      }
    }

    // Presupuesto más usado
    if (budgets.length > 0 && monthExpenses.length > 0) {
      const expByCat = {}
      monthExpenses.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + (Number(e.amount) || 0) })
      const totalBudget = budgets.reduce((s, b) => s + (Number(b.limit) || 0), 0)
      const totalUsed   = budgets.reduce((s, b) => s + Math.min(expByCat[b.category] || 0, Number(b.limit) || 0), 0)
      if (totalBudget > 0) {
        const budgetPct = ((totalUsed / totalBudget) * 100).toFixed(0)
        const color = Number(budgetPct) > 90 ? 'var(--red)' : Number(budgetPct) > 70 ? 'var(--amb)' : 'var(--accent)'
        cards.push({
          icon: '⊞',
          color,
          bg: Number(budgetPct) > 90 ? 'rgba(255,77,106,.07)' : 'rgba(0,212,170,.07)',
          border: Number(budgetPct) > 90 ? 'rgba(255,77,106,.22)' : 'rgba(0,212,170,.2)',
          text: `Has usado el ${budgetPct}% de tu presupuesto mensual.`,
          sub: Number(budgetPct) > 90 ? 'Cerca del límite — revisa tus gastos.' : 'Sigue así.',
        })
      }
    }

    // Meta principal
    if (goals.length > 0) {
      const top = [...goals].sort((a, b) => {
        const pa = Number(a.target) > 0 ? Number(a.saved) / Number(a.target) : 0
        const pb = Number(b.target) > 0 ? Number(b.saved) / Number(b.target) : 0
        return pb - pa
      })[0]
      if (top && Number(top.target) > 0) {
        const goalPct = Math.min((Number(top.saved) / Number(top.target)) * 100, 100).toFixed(0)
        cards.push({
          icon: '→',
          color: 'var(--accent)',
          bg: 'rgba(0,212,170,.07)',
          border: 'rgba(0,212,170,.2)',
          text: `"${top.name}" está al ${goalPct}% de tu objetivo.`,
          sub: `${sym}${fmt(Number(top.target) - Number(top.saved))} restantes para completarla.`,
        })
      }
    }

    return cards.slice(0, 4)
  }, [subMonthly, monthExpenses, budgets, goals, sym])

  const KPIS = [
    { label:'Ingresos',       value:`${sym}${fmt(kpis.totalInc)}`,  color:'var(--accent)', sub:`${kpis.incCount} registros` },
    { label:'Gastos',         value:`${sym}${fmt(kpis.totalExp)}`,  color:'var(--red)',    sub:`${kpis.expCount} registros` },
    { label:'Balance neto',   value:`${sym}${fmt(kpis.balance)}`,   color:kpis.balance >= 0 ? 'var(--accent)' : 'var(--red)', sub:kpis.balance >= 0 ? 'Positivo' : 'Negativo' },
    { label:'Tasa de ahorro', value:pct(kpis.savingRate),           color:kpis.savingRate >= 0.2 ? 'var(--accent)' : kpis.savingRate >= 0 ? 'var(--amb)' : 'var(--red)', sub:'del ingreso' },
    { label:'Suscripciones',  value:`${sym}${fmt(subMonthly)}/mes`, color:'var(--amb)',    sub:`${sym}${fmt(subMonthly * 12)}/año estimado` },
  ]

  return (
    <div style={{ maxWidth:960, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--grn2)', marginBottom:6 }}>Dashboard</div>
        <h1 style={{ fontSize:22, fontWeight:700, color:'var(--tx)', letterSpacing:'-.5px', marginBottom:2 }}>Tu mes en una mirada</h1>
        <p style={{ fontSize:13, color:'var(--th)', fontFamily:'var(--mono)' }}>// {activeMonth} · datos locales</p>
      </div>



      {/* Empieza aquí */}
      {setPage && kpis.incCount === 0 && kpis.expCount === 0 && (
        <div style={{ background:'rgba(0,212,170,.06)', border:'.5px solid rgba(0,212,170,.25)', borderRadius:'var(--r)', padding:'18px 20px', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>Empieza aquí</div>
          <p style={{ fontSize:13, color:'var(--th)', fontFamily:'var(--mono)', marginBottom:14 }}>Si es tu primera vez, sigue estos pasos para ordenar tu información.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { n:'1', txt:'Agrega tu primer ingreso.',   btn:'Agregar ingreso',    page:'income',   color:'var(--accent)' },
              { n:'2', txt:'Registra un gasto.',          btn:'Agregar gasto',      page:'expenses', color:'var(--red)' },
              { n:'3', txt:'Crea un presupuesto.',        btn:'Crear presupuesto',  page:'budgets',  color:'var(--amb)' },
              { n:'4', txt:'Crea un backup de tus datos.',btn:'Ir a backups',       page:'settings', color:'#00b8d9' },
            ].map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--accent)', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.n}</div>
                <span style={{ flex:1, fontSize:13, color:'var(--tx)' }}>{s.txt}</span>
                <button onClick={() => setPage?.(s.page)} style={{ background:'none', border:`.5px solid ${s.color}`, borderRadius:7, padding:'5px 12px', fontSize:12, fontWeight:600, color:s.color, cursor:'pointer', fontFamily:'var(--mono)', whiteSpace:'nowrap' }}>{s.btn}</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Acciones rápidas */}
      {setPage && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--th)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:10 }}>Acciones rápidas</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              { label:'+ Ingreso',     page:'income',     color:'var(--accent)' },
              { label:'+ Gasto',       page:'expenses',   color:'var(--red)' },
              { label:'↑ Importar CSV',page:'import',     color:'#00b8d9' },
              { label:'▤ Presupuesto', page:'budgets',    color:'var(--amb)' },
              { label:'◎ Meta',        page:'goals',      color:'var(--accent)' },
            ].map((a,i) => (
              <button key={i} onClick={() => setPage(a.page)} style={{
                background:'none', border:`.5px solid ${a.color}`, borderRadius:8,
                padding:'7px 14px', fontSize:12, fontWeight:600, color:a.color,
                cursor:'pointer', fontFamily:'var(--mono)', transition:'.15s',
                whiteSpace:'nowrap',
              }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:16 }}>
        {KPIS.map((k, i) => (
          <div key={i} style={{ background:'var(--sur)', border:'.5px solid var(--brd)', borderRadius:'var(--r)', padding:'14px 16px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-16, right:-16, width:56, height:56, borderRadius:'50%', background:`${k.color}`, opacity:.08 }}/>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--th)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:6 }}>{k.label}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:700, color:k.color, marginBottom:3 }}>{k.value}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--th)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Insight Cards */}
      {insights.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:10, marginBottom:20 }}>
          {insights.map((ins, i) => (
            <div key={i} style={{ background:ins.bg, border:`.5px solid ${ins.border}`, borderRadius:'var(--r)', padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:10 }}>
              <span style={{ fontSize:16, color:ins.color, flexShrink:0, marginTop:1 }}>{ins.icon}</span>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)', marginBottom:3, lineHeight:1.45 }}>{ins.text}</div>
                <div style={{ fontSize:11, color:'var(--th)', fontFamily:'var(--mono)' }}>{ins.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gráficos */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <ChartCard title="Ingresos vs Gastos" subtitle="últimos 6 meses" minHeight={220}>
          <IncomeExpenseBar incomes={incomes} expenses={expenses} sym={sym} months={6}/>
        </ChartCard>
        <ChartCard title="Gastos por categoría" subtitle={activeMonth} minHeight={160}>
          <CategoryDonut records={monthExpenses} sym={sym} maxCategories={6}/>
        </ChartCard>
      </div>


      {/* Flujo de dinero del mes */}
      <div style={{ background:'var(--sur)', border:'.5px solid var(--brd)', borderRadius:'var(--r)', padding:'18px 20px', marginBottom:16 }}>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--tx)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block' }}/>
            Flujo de dinero del mes
          </div>
          <div style={{ fontSize:11, color:'var(--th)', fontFamily:'var(--mono)', marginTop:3, marginLeft:14 }}>
            Distribución orientativa de ingresos hacia gastos, suscripciones, deudas y balance disponible.
          </div>
        </div>
        <MoneyFlow incomes={incomes} expenses={monthExpenses} subscriptions={subs} debts={debts} goals={goals} sym={sym}/>
      </div>
      {/* Link al Coach */}
      {setPage && (
        <div style={{ padding:'10px 14px', background:'var(--sur)', border:'.5px solid var(--brd)', borderRadius:'var(--r)', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span style={{ fontSize:12, color:'var(--th)', fontFamily:'var(--mono)' }}>◈ Revisa señales orientativas en FinanceOS Coach.</span>
          <button onClick={() => setPage('coach')} style={{ background:'none', border:'.5px solid var(--brd2)', borderRadius:6, padding:'4px 12px', fontSize:11, color:'var(--accent)', cursor:'pointer', fontFamily:'var(--mono)' }}>
            Ver Coach →
          </button>
        </div>
      )}


      {/* Backup recomendado */}
      <div style={{ background:'var(--sur)', border:'.5px solid var(--brd)', borderRadius:'var(--r)', padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--th)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:3 }}>Backup recomendado</div>
          <div style={{ fontSize:12, color:'var(--th)', fontFamily:'var(--mono)' }}>FinanceOS guarda tus datos localmente. Crea backups periódicos para evitar pérdida de información.</div>
        </div>
        {setPage && <button onClick={() => setPage?.('settings')} style={{ background:'none', border:'.5px solid var(--brd2)', borderRadius:7, padding:'5px 12px', fontSize:11, color:'var(--tx)', cursor:'pointer', fontFamily:'var(--mono)', whiteSpace:'nowrap', flexShrink:0 }}>Ir a backups →</button>}
      </div>
      <div style={{ fontSize:10, color:'var(--th)', fontFamily:'var(--mono)', lineHeight:1.6 }}>
        Los gráficos reflejan los datos registrados en FinanceOS. No constituyen asesoría financiera, tributaria, legal ni de inversión.
      </div>
    </div>
  )
}
