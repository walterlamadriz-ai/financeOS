// src/pages/CashFlow/index.jsx
// Proyección de flujo de caja — 30/60/90 días
// Basado en transacciones recurrentes detectadas + saldo actual

import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { KPI, Card, CardHeader, Alert, Empty, ProgressBar, PageHeader } from '../../components/ui/index.jsx'
import { fmtMoney, fmtPct } from '../../utils/index.js'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

const CURRENCY_SYMBOLS = { CLP: '$', USD: 'US$', EUR: '€', VES: 'Bs.', MXN: '$', ARS: '$', COP: '$' }

const ChartTooltip = ({ active, payload, label, sym }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--sur)', border: '0.5px solid var(--brd2)', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontFamily: 'var(--mono)', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
      <div style={{ color: 'var(--tm)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{sym}{Math.abs(Math.round(p.value)).toLocaleString('es-CL')}</span>
        </div>
      ))}
    </div>
  )
}

export default function CashFlow() {
  const { incomes, expenses, settings } = useApp()
  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'

  // ── Detectar recurrentes ──────────────────────────────────────────────────
  const recurringInc = useMemo(() =>
    incomes.filter(r => r.recurrence && r.recurrence !== 'Único')
  , [incomes])

  const recurringExp = useMemo(() =>
    expenses.filter(r => r.recurrence && r.recurrence !== 'Único')
  , [expenses])

  // ── Calcular flujo mensual recurrente ─────────────────────────────────────
  const monthlyRecInc = useMemo(() => {
    return recurringInc.reduce((s, r) => {
      const amt = r.recurrence === 'Semanal' ? r.amount * 4.33
                : r.recurrence === 'Quincenal' ? r.amount * 2
                : r.amount
      return s + amt
    }, 0)
  }, [recurringInc])

  const monthlyRecExp = useMemo(() => {
    return recurringExp.reduce((s, r) => {
      const amt = r.recurrence === 'Semanal' ? r.amount * 4.33
                : r.recurrence === 'Quincenal' ? r.amount * 2
                : r.amount
      return s + amt
    }, 0)
  }, [recurringExp])

  // ── Saldo actual del mes activo ───────────────────────────────────────────
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const curInc  = incomes.filter(r => r.date?.startsWith(activeMonth)).reduce((s, r) => s + r.amount, 0)
  const curExp  = expenses.filter(r => r.date?.startsWith(activeMonth)).reduce((s, r) => s + r.amount, 0)
  const curBal  = curInc - curExp

  const monthlyNetFlow = monthlyRecInc - monthlyRecExp

  // ── Proyección 6 meses hacia adelante ────────────────────────────────────
  const projectionData = useMemo(() => {
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const result = []
    let balance = curBal

    for (let i = 0; i < 6; i++) {
      const d = new Date()
      d.setMonth(d.getMonth() + i)
      const label = months[d.getMonth()] + ' ' + d.getFullYear().toString().slice(2)
      if (i === 0) {
        result.push({ mes: label, Balance: balance, Ingresos: monthlyRecInc, Gastos: monthlyRecExp, actual: true })
      } else {
        balance += monthlyNetFlow
        result.push({ mes: label, Balance: balance, Ingresos: monthlyRecInc, Gastos: monthlyRecExp })
      }
    }
    return result
  }, [curBal, monthlyRecInc, monthlyRecExp, monthlyNetFlow])

  // ── Hitos de 30/60/90 días ────────────────────────────────────────────────
  const bal30  = curBal + monthlyNetFlow
  const bal60  = curBal + monthlyNetFlow * 2
  const bal90  = curBal + monthlyNetFlow * 3
  const trend  = monthlyNetFlow > 0 ? 'positivo' : monthlyNetFlow < 0 ? 'negativo' : 'neutro'

  const axisStyle = { fill: 'var(--th)', fontSize: 10 }
  const gridStyle = { stroke: 'rgba(0,0,0,0.05)', strokeDasharray: '3 3' }

  const hasData = recurringInc.length > 0 || recurringExp.length > 0

  return (
    <div className="stack">
      <PageHeader
        title="Proyección de flujo de caja"
        sub="Basado en tus ingresos y gastos recurrentes detectados"
      />

      {!hasData && (
        <Alert type="info">
          Para ver proyecciones, registra ingresos o gastos con recurrencia "Mensual", "Quincenal" o "Semanal".
          La proyección se calcula automáticamente desde esos datos.
        </Alert>
      )}

      {/* KPIs de proyección */}
      <div className="kpi-row">
        <KPI label="Flujo neto mensual"
          value={fmtMoney(monthlyNetFlow, sym)}
          color={monthlyNetFlow > 0 ? 'green' : monthlyNetFlow < 0 ? 'red' : 'default'}
          sub={trend === 'positivo' ? '↑ Tendencia positiva' : trend === 'negativo' ? '↓ Revisar gastos' : 'Sin cambio'} />
        <KPI label="Saldo en 30 días"  value={fmtMoney(bal30, sym)}  color={bal30 > 0 ? 'green' : 'red'} />
        <KPI label="Saldo en 60 días"  value={fmtMoney(bal60, sym)}  color={bal60 > 0 ? 'green' : 'red'} />
        <KPI label="Saldo en 90 días"  value={fmtMoney(bal90, sym)}  color={bal90 > 0 ? 'green' : 'red'} />
      </div>

      {/* Gráfico de proyección */}
      <Card>
        <CardHeader title="Balance proyectado — próximos 6 meses" />
        {!hasData
          ? <Empty text="Sin datos recurrentes para proyectar" />
          : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--grn)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--grn)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="balGradNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--red)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v} />
                <Tooltip content={<ChartTooltip sym={sym} />} />
                <ReferenceLine y={0} stroke="var(--red)" strokeDasharray="4 2" strokeWidth={1.5} />
                <Area type="monotone" dataKey="Balance" name="Balance proyectado"
                  stroke={monthlyNetFlow >= 0 ? 'var(--grn)' : 'var(--red)'}
                  strokeWidth={2}
                  fill={monthlyNetFlow >= 0 ? 'url(#balGrad)' : 'url(#balGradNeg)'} />
              </AreaChart>
            </ResponsiveContainer>
          )
        }
      </Card>

      {/* Detalle de recurrentes */}
      <div className="grid2">

        <Card>
          <CardHeader title={`Ingresos recurrentes detectados (${recurringInc.length})`} />
          {recurringInc.length === 0
            ? <Empty text="Sin ingresos recurrentes" />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {recurringInc.map(r => {
                  const mensual = r.recurrence === 'Semanal' ? r.amount * 4.33
                                : r.recurrence === 'Quincenal' ? r.amount * 2
                                : r.amount
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '0.5px solid var(--brd)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx)' }}>{r.source}</div>
                        <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{r.recurrence} · {r.category}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--grn)' }}>+{fmtMoney(mensual, sym)}/mes</div>
                        <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{fmtMoney(r.amount, sym)} original</div>
                      </div>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 12, fontWeight: 600, borderTop: '0.5px solid var(--brd2)', marginTop: 2 }}>
                  <span>Total mensual</span>
                  <span style={{ color: 'var(--grn)', fontFamily: 'var(--mono)' }}>+{fmtMoney(monthlyRecInc, sym)}</span>
                </div>
              </div>
            )
          }
        </Card>

        <Card>
          <CardHeader title={`Gastos recurrentes detectados (${recurringExp.length})`} />
          {recurringExp.length === 0
            ? <Empty text="Sin gastos recurrentes" />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {recurringExp.map(r => {
                  const mensual = r.recurrence === 'Semanal' ? r.amount * 4.33
                                : r.recurrence === 'Quincenal' ? r.amount * 2
                                : r.amount
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '0.5px solid var(--brd)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx)' }}>{r.description}</div>
                        <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{r.recurrence} · {r.category}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--red)' }}>-{fmtMoney(mensual, sym)}/mes</div>
                        <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{fmtMoney(r.amount, sym)} original</div>
                      </div>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 12, fontWeight: 600, borderTop: '0.5px solid var(--brd2)', marginTop: 2 }}>
                  <span>Total mensual</span>
                  <span style={{ color: 'var(--red)', fontFamily: 'var(--mono)' }}>-{fmtMoney(monthlyRecExp, sym)}</span>
                </div>
              </div>
            )
          }
        </Card>

      </div>

      {/* Análisis del flujo */}
      {hasData && (
        <Card>
          <CardHeader title="Análisis del flujo" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {monthlyNetFlow > 0 && (
              <Alert type="ok">
                ✓ Tu flujo neto mensual recurrente es +{fmtMoney(monthlyNetFlow, sym)}. A este ritmo, en 3 meses tendrás {fmtMoney(bal90, sym)}.
              </Alert>
            )}
            {monthlyNetFlow < 0 && (
              <Alert type="danger">
                ⚠ Tus gastos recurrentes superan tus ingresos recurrentes en {fmtMoney(-monthlyNetFlow, sym)}/mes.
                En 90 días el saldo sería {fmtMoney(bal90, sym)}. Revisa qué suscripciones o gastos fijos puedes reducir.
              </Alert>
            )}
            {monthlyNetFlow === 0 && (
              <Alert type="warn">
                → Tu flujo neto recurrente es cero. Tus ingresos y gastos fijos se equilibran exactamente.
              </Alert>
            )}
            {recurringExp.length > 0 && (
              <Alert type="info">
                → Suscripciones y gastos recurrentes detectados: {recurringExp.length} ítems sumando {fmtMoney(monthlyRecExp, sym)}/mes
                ({fmtPct(monthlyRecInc > 0 ? monthlyRecExp / monthlyRecInc : 0)} de tus ingresos recurrentes).
              </Alert>
            )}
          </div>
        </Card>
      )}

      <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', padding: '4px 0', lineHeight: 1.5 }}>
        * Proyección calculada sobre ingresos y gastos marcados como recurrentes. No incluye
        gastos únicos futuros ni eventos imprevistos. Atención: no usar en modo incógnito —
        los datos se borran al cerrar esa sesión. Orientación general — no constituye
        asesoría financiera, tributaria ni de inversión.
      </div>
    </div>
  )
}
