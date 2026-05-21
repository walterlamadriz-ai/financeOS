// src/pages/Dashboard/index.jsx
// Dashboard con Visual Insights — FinanceOS v1.0

import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import ChartCard, { ChartEmpty } from '../../components/charts/ChartCard.jsx'
import IncomeExpenseBar from '../../components/charts/IncomeExpenseBar.jsx'
import CategoryDonut from '../../components/charts/CategoryDonut.jsx'
import { useCoachSignals } from '../Coach/index.jsx'
import useSubscriptionMetrics from '../../hooks/useSubscriptionMetrics.js'

const fmt = (n) => (n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })
const pct = (n) => ((n || 0) * 100).toFixed(1) + '%'

export default function Dashboard({ setPage }) {
  const { incomes, expenses, settings } = useApp()
  const sym = { CLP:'$', USD:'US$', EUR:'€', VES:'Bs.', MXN:'$', ARS:'$', COP:'$' }[settings?.currency] || '$'

  const signals    = useCoachSignals()
  const subMetrics = useSubscriptionMetrics()

  const activeMonth = settings?.activeMonth || new Date().toISOString().slice(0, 7)

  const kpis = useMemo(() => {
    const inc = (incomes  || []).filter(r => r.date?.startsWith(activeMonth))
    const exp = (expenses || []).filter(r => r.date?.startsWith(activeMonth))
    const totalInc = inc.reduce((s, r) => s + (r.amount || 0), 0)
    const totalExp = exp.reduce((s, r) => s + (r.amount || 0), 0)
    const balance  = totalInc - totalExp
    const savingRate = totalInc > 0 ? balance / totalInc : 0
    return { totalInc, totalExp, balance, savingRate, incCount: inc.length, expCount: exp.length }
  }, [incomes, expenses, activeMonth])

  const monthExpenses = useMemo(() =>
    (expenses || []).filter(r => r.date?.startsWith(activeMonth)),
    [expenses, activeMonth]
  )

  const subMonthly = subMetrics?.totalMonthly || 0
  const subAnnual  = subMonthly * 12
  const subCount   = subMetrics?.activeCount  || 0

  const topSignals = useMemo(() =>
    (signals || []).filter(s => s.severity === 'warning' || s.severity === 'alert').slice(0, 3),
    [signals]
  )

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--grn2)', marginBottom: 6 }}>Dashboard</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-.5px', marginBottom: 2 }}>Resumen financiero</h1>
        <p style={{ fontSize: 13, color: 'var(--th)', fontFamily: 'var(--mono)' }}>// {activeMonth} · datos locales</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Ingresos',      value: `${sym}${fmt(kpis.totalInc)}`,  color: 'var(--accent)', sub: `${kpis.incCount} registros` },
          { label: 'Gastos',        value: `${sym}${fmt(kpis.totalExp)}`,  color: 'var(--red)',    sub: `${kpis.expCount} registros` },
          { label: 'Balance neto',  value: `${sym}${fmt(kpis.balance)}`,   color: kpis.balance >= 0 ? 'var(--accent)' : 'var(--red)', sub: kpis.balance >= 0 ? 'Positivo' : 'Negativo' },
          { label: 'Tasa de ahorro',value: pct(kpis.savingRate),           color: kpis.savingRate >= 0.2 ? 'var(--accent)' : kpis.savingRate >= 0 ? 'var(--amb)' : 'var(--red)', sub: 'del ingreso' },
          { label: 'Suscripciones', value: `${sym}${fmt(subMonthly)}/mes`, color: 'var(--amb)',    sub: `${subCount} activas · ${sym}${fmt(subAnnual)}/año` },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: k.color, marginBottom: 3 }}>{k.value}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--th)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Señales Coach */}
      {topSignals.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {topSignals.map((sig, i) => (
            <div key={i} style={{
              background: sig.severity === 'alert' ? 'rgba(255,77,106,.07)' : 'rgba(245,166,35,.07)',
              border: `.5px solid ${sig.severity === 'alert' ? 'rgba(255,77,106,.25)' : 'rgba(245,166,35,.25)'}`,
              borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{sig.severity === 'alert' ? '⚠' : '◑'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 2 }}>{sig.title}</div>
                <div style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{sig.msg}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gráficos — 2 columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Ingresos vs Gastos" subtitle="últimos 6 meses" minHeight={220}>
          <IncomeExpenseBar incomes={incomes || []} expenses={expenses || []} sym={sym} months={6}/>
        </ChartCard>
        <ChartCard title="Gastos por categoría" subtitle={activeMonth} minHeight={160}>
          <CategoryDonut records={monthExpenses} sym={sym} maxCategories={6}/>
        </ChartCard>
      </div>

      {/* Link al Coach */}
      {signals?.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
            ◈ Coach tiene {signals.length} señal{signals.length !== 1 ? 'es' : ''} orientativa{signals.length !== 1 ? 's' : ''} para revisar.
          </span>
          {setPage && (
            <button onClick={() => setPage('coach')} style={{ background: 'none', border: '.5px solid var(--brd2)', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--mono)' }}>
              Ver señales →
            </button>
          )}
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
        Los gráficos reflejan los datos registrados en FinanceOS. No constituyen asesoría financiera, tributaria, legal ni de inversión.
      </div>
    </div>
  )
}
