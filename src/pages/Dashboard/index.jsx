// src/pages/Dashboard/index.jsx
import { useMemo, useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { dbGetAll } from '../../core/db/index.js'
import useSubscriptionMetrics from '../../hooks/useSubscriptionMetrics.js'
import { useCoachSignals } from '../Coach/index.jsx'
import { KPI, Card, CardHeader, TxRow, BarRow, ProgressBar, Badge, Alert } from '../../components/ui/index.jsx'
import { fmtMoney, fmtPct, CAT_COLORS } from '../../utils/index.js'

// FIX: mapa de símbolos por código de moneda
const CURRENCY_SYMBOLS = { CLP: '$', USD: 'US$', EUR: '€', VES: 'Bs.' }

export default function Dashboard({ setPage }) {
  const { incomes, expenses, debts, goals, settings, loading, updateSettings } = useApp()
  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'

  const totalIncome  = useMemo(() => incomes.reduce((s, r) => s + r.amount, 0), [incomes])
  const totalExpense = useMemo(() => expenses.reduce((s, r) => s + r.amount, 0), [expenses])
  const balance      = totalIncome - totalExpense
  const savingRate   = totalIncome > 0 ? balance / totalIncome : 0
  const totalDebt    = useMemo(() => debts.reduce((s, d) => s + d.balance, 0), [debts])

  const expByCat = useMemo(() => {
    const m = {}
    expenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount })
    return m
  }, [expenses])

  const topCats = Object.entries(expByCat).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat  = topCats[0]?.[1] || 1

  const recent = useMemo(() => [
    ...incomes.map(r => ({ ...r, _t: 'income' })),
    ...expenses.map(r => ({ ...r, _t: 'expense' })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7), [incomes, expenses])

  // FIX: filtro por mes activo
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const monthIncomes  = useMemo(() => incomes.filter(r => r.date?.startsWith(activeMonth)),  [incomes,  activeMonth])
  const monthExpenses = useMemo(() => expenses.filter(r => r.date?.startsWith(activeMonth)), [expenses, activeMonth])

  const totalIncomeFull  = totalIncome
  const totalExpenseFull = totalExpense

  // Recalcular con datos filtrados por mes
  const mIncome  = useMemo(() => monthIncomes.reduce((s, r)  => s + r.amount, 0), [monthIncomes])
  const mExpense = useMemo(() => monthExpenses.reduce((s, r) => s + r.amount, 0), [monthExpenses])
  const mBalance = mIncome - mExpense
  const mRate    = mIncome > 0 ? mBalance / mIncome : 0

  const mExpByCat = useMemo(() => {
    const m = {}
    monthExpenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount })
    return m
  }, [monthExpenses])

  const mTopCats = Object.entries(mExpByCat).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const mMaxCat  = mTopCats[0]?.[1] || 1

  const mRecent = useMemo(() => [
    ...monthIncomes.map(r  => ({ ...r, _t: 'income' })),
    ...monthExpenses.map(r => ({ ...r, _t: 'expense' })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7), [monthIncomes, monthExpenses])

  // Suscripciones — hook compartido
  const { signals: coachSignals } = useCoachSignals()
  const topSignals = coachSignals.slice(0, 3)

  const { monthly: subMonthly, annual: subAnnual, count: subCount,
          pct: subPct, status: subStatus, alerts: subAlerts,
          nextPayment: subNext, activeSubs } = useSubscriptionMetrics()

  // Meses disponibles para el selector
  const allDates  = [...incomes.map(r => r.date), ...expenses.map(r => r.date)].filter(Boolean)
  const months    = [...new Set(allDates.map(d => d.slice(0, 7)))].sort().reverse()
  const monthLabel = (m) => { const [y, mo] = m.split('-'); return `${['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+mo]} ${y}` }

  if (loading) return <div style={{ padding: 24, color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 12 }}>Cargando datos…</div>

  return (
    <div className="stack">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px', marginBottom: 2 }}>Dashboard financiero</h1>
          <p style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)' }}>datos en tiempo real · {monthLabel(activeMonth)}</p>
        </div>
        {/* FIX: selector de mes */}
        <select
          value={activeMonth}
          onChange={e => updateSettings({ ...settings, activeMonth: e.target.value })}
          style={{ width: 'auto', fontSize: 11, padding: '5px 8px' }}
        >
          {(months.length > 0 ? months : [activeMonth]).map(m => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
      </div>

      <div className="kpi-row">
        <KPI label="Balance neto"  value={fmtMoney(mBalance, sym)}  color={mBalance >= 0 ? 'green' : 'red'} sub={mBalance >= 0 ? 'Superávit' : 'Déficit'} />
        <KPI label="Ingresos mes"  value={fmtMoney(mIncome, sym)}   sub={`${monthIncomes.length} registros`} />
        <KPI label="Gastos mes"    value={fmtMoney(mExpense, sym)}  color="red" sub={`${monthExpenses.length} registros`} />
        <KPI label="Tasa ahorro"   value={fmtPct(mRate)}            color={mRate >= 0.25 ? 'green' : mRate >= 0.1 ? 'amber' : 'red'} sub="Meta: 25%" />
      </div>

      {mRate < 0.1 && mIncome > 0 && (
        <Alert type="warn">Tasa de ahorro baja este mes ({fmtPct(mRate)}). Revisa los gastos.</Alert>
      )}

      <div className="grid2">
        <Card>
          <CardHeader title="Movimientos recientes" />
          {mRecent.length === 0
            ? <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--th)', fontSize: 12, fontFamily: 'var(--mono)' }}>Sin registros en {monthLabel(activeMonth)}</div>
            : mRecent.map(r => (
                <TxRow
                  key={r.id}
                  dot={CAT_COLORS[r.category] || '#888'}
                  name={r._t === 'income' ? r.source : r.description}
                  meta={`${r.category} · ${r.date.slice(5).replace('-', '/')}`}
                  amount={fmtMoney(r.amount, sym)}
                  isIncome={r._t === 'income'}
                />
              ))
          }
        </Card>

        <Card>
          <CardHeader title="Gastos por categoría" />
          {mTopCats.length === 0
            ? <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--th)', fontSize: 12, fontFamily: 'var(--mono)' }}>Sin gastos en {monthLabel(activeMonth)}</div>
            : mTopCats.map(([cat, val]) => (
                <BarRow
                  key={cat}
                  label={cat}
                  valueLabel={`${fmtMoney(val, sym)} · ${fmtPct(val / mExpense)}`}
                  value={val}
                  max={mMaxCat}
                  color={CAT_COLORS[cat] || '#888'}
                />
              ))
          }
        </Card>
      </div>

      {/* ── TARJETA COACH — top señales ── */}
      {topSignals.length > 0 && (
        <div style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '13px 15px', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>◈ Señales del mes</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--grn2)', cursor: 'pointer' }}
              onClick={() => setPage('coach')}>Ver todo →</div>
          </div>
          {topSignals.map(s => {
            const color = { warning: 'var(--red)', attention: 'var(--amb)', info: 'var(--grn)' }[s.severity]
            return (
              <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0', borderBottom: '.5px solid var(--brd)' }}>
                <span style={{ color, fontSize: 11, flexShrink: 0, marginTop: 1 }}>
                  {{ warning: '⊗', attention: '⚠', info: '◈' }[s.severity]}
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.5 }}>{s.msg}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TARJETA SUSCRIPCIONES MEJORADA ── */}
      {subCount > 0 && (
        <div style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>↻ Suscripciones activas</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: subStatus.color, background: 'var(--sur2)', padding: '2px 8px', borderRadius: 20, border: '.5px solid var(--brd)' }}>
              {subStatus.label}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: subAlerts.length > 0 ? 10 : 0 }}>
            {[
              { lb: 'Gasto mensual estimado', v: fmtMoney(subMonthly, sym), c: subPct > 0.07 ? 'var(--amb)' : 'var(--tx)' },
              { lb: 'Gasto anual estimado',   v: fmtMoney(subAnnual,  sym), c: 'var(--tx)' },
              { lb: 'Servicios activos',      v: `${subCount}`,              c: 'var(--tx)' },
              ...(mIncome > 0 ? [{ lb: '% del ingreso', v: `${(subPct*100).toFixed(1)}%`, c: subPct > 0.07 ? 'var(--amb)' : 'var(--grn)' }] : []),
            ].map(m => (
              <div key={m.lb} style={{ flex: '1 1 90px', background: 'var(--sur2)', borderRadius: 6, padding: '7px 10px', border: '.5px solid var(--brd)' }}>
                <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>{m.lb}</div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: m.c }}>{m.v}</div>
              </div>
            ))}
          </div>
          {subAlerts.length > 0 && (
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--amb)', lineHeight: 1.5 }}>
              {subAlerts[0].msg}
            </div>
          )}
          <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 8, paddingTop: 8, borderTop: '.5px solid var(--brd)' }}>
            Gasto estimado · no incluido en los gastos registrados del mes
          </div>
        </div>
      )}

      <div className="grid2">
        <Card>
          <CardHeader title="Metas activas" />
          {goals.length === 0
            ? <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--th)', fontSize: 12, fontFamily: 'var(--mono)' }}>Sin metas creadas</div>
            : goals.slice(0, 3).map(g => {
                const p = g.target > 0 ? g.saved / g.target : 0
                return (
                  <div key={g.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{g.name}</span>
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)' }}>{fmtPct(p)}</span>
                    </div>
                    <ProgressBar value={g.saved} max={g.target} color={p >= 1 ? 'green' : p >= 0.6 ? 'amber' : 'blue'} height={5} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)' }}>{fmtMoney(g.saved, sym)}</span>
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)' }}>{fmtMoney(g.target, sym)}</span>
                    </div>
                  </div>
                )
              })
          }
        </Card>

        <Card>
          <CardHeader title="Resumen rápido" />
          <div style={{ textAlign: 'center', padding: 14, background: 'var(--grn-bg)', borderRadius: 'var(--r)', border: '0.5px solid var(--grn-lt)', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--tm)', marginBottom: 3 }}>Libre este mes</div>
            <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--mono)', color: mBalance >= 0 ? 'var(--grn)' : 'var(--red)', letterSpacing: '-1px' }}>{fmtMoney(mBalance, sym)}</div>
          </div>
          {[
            { lb: 'Deuda total',     v: fmtMoney(totalDebt, sym),                       c: 'var(--red)' },
            { lb: 'Gasto / Ingreso', v: mIncome > 0 ? fmtPct(mExpense / mIncome) : '-', c: 'var(--amb)' },
            { lb: 'Ahorro efectivo', v: fmtMoney(Math.max(0, mBalance), sym),            c: 'var(--grn)' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '0.5px solid var(--brd)' : 'none' }}>
              <span style={{ fontSize: 12, color: 'var(--tm)' }}>{r.lb}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 500, color: r.c }}>{r.v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
