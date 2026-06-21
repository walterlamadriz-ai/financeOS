// src/pages/Dashboard/index.jsx
// Dashboard Visual Polish — FinanceOS v1.1.1

import { useMemo, useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import ChartCard from '../../components/charts/ChartCard.jsx'
import IncomeExpenseBar from '../../components/charts/IncomeExpenseBar.jsx'
import CategoryDonut from '../../components/charts/CategoryDonut.jsx'
import MoneyFlow from '../../components/charts/MoneyFlow.jsx'
import { evaluateCoach, calcCoachMetrics } from '../../data/coachRules.js'
import { calcFinancialScore } from '../../utils/financialScore.js'

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

  const sym         = { CLP:'$', USD:'US$', EUR:'€', VES:'Bs.', MXN:'$', ARS:'$', COP:'$', PEN:'S/', BRL:'R$', UYU:'$U' }[settings.currency] || '$'
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const dualOn      = !!settings.showDualCurrency && settings.currency !== 'USD' && Number(settings.usdRate) > 0
  const usdRate     = Number(settings.usdRate) || 1
  const toUSD       = (n) => `≈ US$${((Number(n) || 0) / usdRate).toLocaleString('es-CL', { maximumFractionDigits: 0 })}`

  const kpis = useMemo(() => {
    const [y, mo] = activeMonth.split('-').map(Number)
    const prevMo  = mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`

    function monthTotals(month) {
      const inc = incomes.filter(r  => r?.date?.startsWith(month))
      const exp = expenses.filter(r => r?.date?.startsWith(month))
      const totalInc = inc.reduce((s, r) => s + (Number(r?.amount) || 0), 0)
      const totalExp = exp.reduce((s, r) => s + (Number(r?.amount) || 0), 0)
      const totalSubs = subs.filter(s => s?.status === 'active').reduce((s, sub) => {
        const amt = Number(sub.amount) || 0
        const f   = sub.frequency || 'monthly'
        if (f === 'annual' || f === 'anual') return s + amt / 12
        if (f === 'quarterly') return s + amt / 3
        if (f === 'weekly') return s + amt * 4.33
        return s + amt
      }, 0)
      const totalDebt = debts.reduce((s, d) => s + (Number(d.minPayment) || 0), 0)
      const balance = totalInc - totalExp - totalDebt - totalSubs
      return { totalInc, totalExp, totalDebt, totalSubs, balance,
               savingRate: totalInc > 0 ? Math.max(0, balance) / totalInc : 0,
               incCount: inc.length, expCount: exp.length }
    }

    const cur  = monthTotals(activeMonth)
    const prev = monthTotals(prevMo)

    function delta(cur, prev) {
      if (prev === 0) return null
      return ((cur - prev) / prev * 100).toFixed(1)
    }

    return {
      ...cur,
      delta: {
        inc:  delta(cur.totalInc,    prev.totalInc),
        exp:  delta(cur.totalExp,    prev.totalExp),
        bal:  delta(cur.balance,     prev.balance),
        save: delta(cur.savingRate,  prev.savingRate),
      }
    }
  }, [incomes, expenses, debts, subs, activeMonth])

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
        const pctN = Number(budgetPct)
        const color = pctN > 90 ? 'var(--red)' : pctN > 80 ? 'var(--amb)' : 'var(--accent)'
        cards.push({
          icon: pctN > 90 ? '⚠' : pctN > 80 ? '◑' : '⊞',
          color,
          bg: pctN > 90 ? 'rgba(255,77,106,.07)' : pctN > 80 ? 'rgba(245,166,35,.07)' : 'rgba(0,212,170,.07)',
          border: pctN > 90 ? 'rgba(255,77,106,.22)' : pctN > 80 ? 'rgba(245,166,35,.22)' : 'rgba(0,212,170,.2)',
          text: `Has usado el ${budgetPct}% de tu presupuesto mensual.`,
          sub: pctN > 90 ? 'Límite inminente — revisá tus gastos.' : pctN > 80 ? 'Alerta temprana — moderá los gastos restantes.' : 'Sigue así.',
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

  // ── Coach signals para Dashboard ──────────────────────────────────────────
  const topSignals = useMemo(() => {
    if (kpis.incCount === 0 && kpis.expCount === 0) return []
    const metrics = calcCoachMetrics({ incomes, expenses, budgets, debts, goals, subs, settings })
    return evaluateCoach(metrics).slice(0, 2)
  }, [incomes, expenses, budgets, debts, goals, subs, settings, kpis.incCount, kpis.expCount])

  // ── Puntaje de salud financiera ───────────────────────────────────────────
  const healthScore = useMemo(() => {
    if (kpis.incCount === 0 && kpis.expCount === 0) return null
    return calcFinancialScore({
      savingRate: kpis.savingRate,
      budgets, expenses, debts, goals, subs, incomes,
      activeMonth,
    })
  }, [kpis.savingRate, kpis.incCount, kpis.expCount, budgets, expenses, debts, goals, subs, incomes, activeMonth])

  // ── Historial de score semanal (localStorage) ────────────────────────────
  const SCORE_KEY = 'fos_score_history'
  const [scoreHistory, setScoreHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '[]') } catch { return [] }
  })

  useEffect(() => {
    if (!healthScore) return
    const week = (() => {
      const d = new Date()
      const jan1 = new Date(d.getFullYear(), 0, 1)
      return `${d.getFullYear()}-W${Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)}`
    })()
    setScoreHistory(prev => {
      const existing = prev.find(e => e.w === week)
      if (existing && existing.s === healthScore.score) return prev
      const next = [...prev.filter(e => e.w !== week), { w: week, s: healthScore.score }]
        .sort((a, b) => a.w.localeCompare(b.w))
        .slice(-8)
      try { localStorage.setItem(SCORE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [healthScore?.score])

  function ScoreSparkline({ history, currentColor }) {
    if (history.length < 2) return null
    const vals = history.map(e => e.s)
    const min = Math.min(...vals) - 5
    const max = Math.max(...vals) + 5
    const W = 80, H = 28
    const pts = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * W
      const y = H - ((v - min) / (max - min)) * H
      return `${x},${y}`
    }).join(' ')
    const prev = vals[vals.length - 2]
    const curr = vals[vals.length - 1]
    const diff = curr - prev
    return (
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <svg width={W} height={H} style={{ overflow:'visible' }}>
          <polyline points={pts} fill="none" stroke={currentColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r="3" fill={currentColor} />
        </svg>
        {diff !== 0 && (
          <span style={{ fontSize:10, fontFamily:'var(--mono)', color: diff > 0 ? 'var(--accent)' : 'var(--red)', background: diff > 0 ? 'rgba(0,212,170,.1)' : 'rgba(255,77,106,.1)', borderRadius:4, padding:'1px 5px' }}>
            {diff > 0 ? '↑' : '↓'}{Math.abs(diff)} pts
          </span>
        )}
      </div>
    )
  }

  const SEV_ICON  = { info: '◈', attention: '⚠', warning: '⊗' }
  const SEV_COLOR = { info: 'var(--accent)', attention: 'var(--amb)', warning: 'var(--red)' }

  function DeltaBadge({ d, invert = false }) {
    if (d === null) return null
    const n = Number(d)
    if (Math.abs(n) < 0.5) return null
    const up   = n > 0
    const good = invert ? !up : up
    return (
      <span style={{ fontSize:9, fontFamily:'var(--mono)', color: good ? 'var(--accent)' : 'var(--red)',
                     background: good ? 'rgba(0,212,170,.1)' : 'rgba(255,77,106,.1)',
                     borderRadius:4, padding:'1px 5px', marginLeft:5 }}>
        {up ? '↑' : '↓'}{Math.abs(n)}%
      </span>
    )
  }

  const KPIS = [
    { label:'Ingresos',       value:`${sym}${fmt(kpis.totalInc)}`,  color:'var(--accent)', sub:`${kpis.incCount} registros`,                                                          delta: kpis.delta.inc,  invertDelta: false, raw: kpis.totalInc },
    { label:'Gastos',         value:`${sym}${fmt(kpis.totalExp)}`,  color:'var(--red)',    sub:`${kpis.expCount} registros`,                                                          delta: kpis.delta.exp,  invertDelta: true,  raw: kpis.totalExp },
    { label:'Balance neto',   value:`${sym}${fmt(kpis.balance)}`,   color:kpis.balance >= 0 ? 'var(--accent)' : 'var(--red)', sub:kpis.balance >= 0 ? 'Positivo' : 'Negativo',      delta: kpis.delta.bal,  invertDelta: false, raw: kpis.balance },
    { label:'Tasa de ahorro', value:pct(kpis.savingRate),           color:kpis.savingRate >= 0.2 ? 'var(--accent)' : kpis.savingRate >= 0 ? 'var(--amb)' : 'var(--red)', sub:'del ingreso', delta: kpis.delta.save, invertDelta: false, raw: null },
    { label:'Suscripciones',  value:`${sym}${fmt(subMonthly)}/mes`, color:'var(--amb)',    sub:`${sym}${fmt(subMonthly * 12)}/año estimado`,                                          delta: null,            invertDelta: false, raw: subMonthly },
  ]

  return (
    <div style={{ maxWidth:960, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--grn2)', marginBottom:6 }}>Dashboard</div>
        <h1 style={{ fontSize:22, fontWeight:700, color:'var(--tx)', letterSpacing:'-.5px', marginBottom:2 }}>Tu mes en una mirada</h1>
        <p style={{ fontSize:13, color:'var(--th)', fontFamily:'var(--mono)' }}>// {activeMonth} · sin servidor · privado</p>
      </div>



      {/* Empieza aquí */}
      {setPage && kpis.incCount === 0 && kpis.expCount === 0 && (
        <div style={{ background:'rgba(0,212,170,.06)', border:'.5px solid rgba(0,212,170,.25)', borderRadius:'var(--r)', padding:'18px 20px', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>Empieza aquí</div>
          <p style={{ fontSize:13, color:'var(--th)', fontFamily:'var(--mono)', marginBottom:14 }}>Si es tu primera vez, sigue estos pasos para ordenar tu información.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { n:'1', txt:'Agrega tu primer ingreso.',   btn:'Agregar ingreso',    page:'income',   color:'var(--accent)' },
              { n:'2', txt:'Registra un egreso.',         btn:'Agregar egreso',     page:'movements', color:'var(--red)' },
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
              { label:'+ Egreso',      page:'movements',  color:'var(--red)' },
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
            <div style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:700, color:k.color, marginBottom:3, display:'flex', alignItems:'center', flexWrap:'wrap', gap:2 }}>
              {k.value}
              <DeltaBadge d={k.delta} invert={k.invertDelta} />
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--th)' }}>{k.sub}</div>
            {dualOn && k.raw !== null && (
              <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--th)', marginTop:4, opacity:.7, borderTop:'.5px solid var(--brd)', paddingTop:4 }}>
                {toUSD(k.raw)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ingreso esperado vs recibido */}
      {(() => {
        const expected = Number(settings.estimatedMonthlyIncome) || 0
        if (expected <= 0 || kpis.totalInc <= 0) return null
        const diff = kpis.totalInc - expected
        const pctDiff = ((diff / expected) * 100).toFixed(1)
        const over = diff >= 0
        return (
          <div style={{ background: over ? 'rgba(0,212,170,.06)' : 'rgba(255,77,106,.06)', border: `.5px solid ${over ? 'rgba(0,212,170,.25)' : 'rgba(255,77,106,.25)'}`, borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>Ingreso esperado vs recibido</div>
              <div style={{ fontSize: 13, color: 'var(--tx)' }}>
                Esperado: <strong>{sym}{fmt(expected)}</strong> · Recibido: <strong style={{ color: over ? 'var(--accent)' : 'var(--red)' }}>{sym}{fmt(kpis.totalInc)}</strong>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: over ? 'var(--accent)' : 'var(--red)' }}>
              {over ? '+' : ''}{pctDiff}%
            </div>
          </div>
        )
      })()}

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

      {/* Puntaje de salud financiera */}
      {healthScore && (
        <div style={{ background:'var(--sur)', border:`.5px solid var(--brd)`, borderRadius:'var(--r)', padding:'14px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, flex:1, minWidth:180 }}>
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <div style={{ fontSize:28, fontWeight:700, fontFamily:'var(--mono)', color:healthScore.color, lineHeight:1 }}>{healthScore.score}</div>
              <div style={{ fontSize:9, fontFamily:'var(--mono)', color:'var(--th)', textTransform:'uppercase', letterSpacing:'.5px', marginTop:2 }}>/ 100</div>
            </div>
            <div>
              <div style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--th)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:2 }}>Salud financiera</div>
              <div style={{ fontSize:14, fontWeight:700, color:healthScore.color, marginBottom:4 }}>{healthScore.label}</div>
              <ScoreSparkline history={scoreHistory} currentColor={healthScore.color} />
            </div>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {healthScore.breakdown.map((b, i) => (
              <div key={i} style={{ textAlign:'center', minWidth:56 }}>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color: b.pts >= b.max ? 'var(--accent)' : b.pts > 0 ? 'var(--amb)' : 'var(--red)' }}>{b.pts}</div>
                <div style={{ fontSize:9, fontFamily:'var(--mono)', color:'var(--th)', textTransform:'uppercase', letterSpacing:'.3px' }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Señales del Diagnóstico */}
      {topSignals.length > 0 && (
        <div style={{ background:'var(--sur)', border:`.5px solid var(--brd)`, borderRadius:'var(--r)', padding:'14px 16px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--th)', textTransform:'uppercase', letterSpacing:'.8px' }}>⚕ Diagnóstico — señales activas</div>
            {setPage && (
              <span style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--accent)', cursor:'pointer' }} onClick={() => setPage('coach')}>
                Ver diagnóstico completo →
              </span>
            )}
          </div>
          {topSignals.map((s, i) => (
            <div key={i} style={{ borderLeft:`3px solid ${SEV_COLOR[s.severity]}`, paddingLeft:10, marginBottom: i < topSignals.length - 1 ? 10 : 0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                <span style={{ fontSize:12, color:SEV_COLOR[s.severity] }}>{SEV_ICON[s.severity]}</span>
                <span style={{ fontSize:11, fontWeight:600, color:SEV_COLOR[s.severity], fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'.4px' }}>{s.severity === 'warning' ? 'Revisar' : s.severity === 'attention' ? 'Atención' : 'Info'}</span>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--tx)', marginBottom:2 }}>{s.title}</div>
              <div style={{ fontSize:12, color:'var(--tm)', lineHeight:1.5 }}>{s.msg}</div>
            </div>
          ))}
        </div>
      )}

      {/* Proyección fin de mes */}
      {(kpis.totalInc > 0 || kpis.totalExp > 0) && (() => {
        const now = new Date()
        const [y, mo] = activeMonth.split('-').map(Number)
        const daysInMonth = new Date(y, mo, 0).getDate()
        const today = (now.getFullYear() === y && now.getMonth() + 1 === mo) ? now.getDate() : daysInMonth
        const daysLeft = daysInMonth - today
        const dailyExp = today > 0 ? kpis.totalExp / today : 0
        const projExp  = kpis.totalExp + dailyExp * daysLeft
        const projBal  = kpis.totalInc - projExp
        const pctMonth = (today / daysInMonth * 100).toFixed(0)
        const over     = projBal < 0
        return (
          <div style={{ background:'var(--sur)', border:`.5px solid ${over ? 'rgba(255,77,106,.3)' : 'var(--brd)'}`, borderRadius:'var(--r)', padding:'14px 16px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, flexWrap:'wrap', gap:6 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--th)', textTransform:'uppercase', letterSpacing:'.8px' }}>Proyección fin de mes</div>
              <div style={{ fontSize:10, fontFamily:'var(--mono)', color:'var(--th)' }}>Día {today}/{daysInMonth} · {daysLeft} días restantes</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:10 }}>
              {[
                { label:'Gasto proyectado',   value:`${sym}${fmt(projExp)}`,            color:'var(--red)',                                  rawVal: projExp },
                { label:'Balance proyectado', value:`${sym}${fmt(Math.abs(projBal))}`,  color: over ? 'var(--red)' : 'var(--accent)', prefix: over ? '−' : '+', rawVal: projBal },
                { label:'Ritmo diario',       value:`${sym}${fmt(dailyExp)}/día`,       color:'var(--th)',                                   rawVal: null },
              ].map(k => (
                <div key={k.label}>
                  <div style={{ fontSize:9, fontFamily:'var(--mono)', color:'var(--th)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>{k.label}</div>
                  <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color:k.color }}>{k.prefix || ''}{k.value}</div>
                  {dualOn && k.rawVal != null && (
                    <div style={{ fontSize:9, color:'var(--th)', fontFamily:'var(--mono)', opacity:.7, marginTop:2 }}>{toUSD(k.rawVal)}</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ height:4, borderRadius:2, background:'var(--brd2)', overflow:'hidden', marginBottom:4 }}>
              <div style={{ height:'100%', width:`${pctMonth}%`, background: over ? 'var(--red)' : 'var(--accent)', borderRadius:2, transition:'.3s' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, fontFamily:'var(--mono)', color:'var(--th)' }}>
              <span>{pctMonth}% del mes transcurrido</span>
              {setPage && <span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => setPage('cashflow')}>Ver proyección completa →</span>}
            </div>
          </div>
        )
      })()}

      {/* Gráficos */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16, marginBottom:16 }}>
        <ChartCard title="Flujo de dinero del mes" subtitle="distribución orientativa" minHeight={220}>
          <MoneyFlow incomes={incomes} expenses={monthExpenses} subscriptions={subs} debts={debts} sym={sym}/>
        </ChartCard>
        <ChartCard title="Gastos por categoría" subtitle={activeMonth} minHeight={160}>
          <CategoryDonut records={monthExpenses} sym={sym} maxCategories={6}/>
        </ChartCard>
      </div>
      <ChartCard title="Ingresos vs Gastos" subtitle="últimos 6 meses" minHeight={180}>
        <IncomeExpenseBar incomes={incomes} expenses={expenses} sym={sym} months={6}/>
      </ChartCard>



      {/* Link a Diagnóstico */}
      {setPage && (
        <div style={{ padding:'10px 14px', background:'var(--sur)', border:'.5px solid var(--brd)', borderRadius:'var(--r)', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span style={{ fontSize:12, color:'var(--th)', fontFamily:'var(--mono)' }}>⚕ Análisis orientativo completo de tu situación financiera.</span>
          <button onClick={() => setPage('coach')} style={{ background:'none', border:'.5px solid var(--brd2)', borderRadius:6, padding:'4px 12px', fontSize:11, color:'var(--accent)', cursor:'pointer', fontFamily:'var(--mono)' }}>
            Ver Diagnóstico →
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
