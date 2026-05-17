// src/pages/Advisor/index.jsx
// Modo Asesor — FinanceOS v1.3
// Vista profesional para diagnóstico, seguimiento y preparación de reuniones
// AVISO: Las alertas y señales son orientativas. No constituyen asesoría financiera certificada.

import { useState, useMemo } from 'react'
import useSubscriptionMetrics from '../../hooks/useSubscriptionMetrics.js'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, Alert } from '../../components/ui/index.jsx'
import { fmtMoney, fmtPct } from '../../utils/index.js'
import { FinancialDisclaimer } from '../../components/legal/MicroCopy.jsx'
import { downloadReportePDF } from './ReportePDF.jsx'
import TemplateSelector from '../../components/templates/TemplateSelector.jsx'
import config from '../../config.js'

const CURRENCY_SYMBOLS = { CLP: '$', USD: 'US$', EUR: '€', VES: 'Bs.', MXN: '$', ARS: '$' }

// ── SEMÁFORO — reglas de cálculo ─────────────────────────────────────────────
// Verde:    condición saludable
// Amarillo: atención recomendada
// Rojo:     riesgo detectado
function calcTrafficLight(metrics) {
  const signals = []

  // 1. Tasa de ahorro
  if (metrics.savingRate >= 0.20) {
    signals.push({ id: 'saving', label: 'Tasa de ahorro', status: 'green',  value: fmtPct(metrics.savingRate), note: `${fmtPct(metrics.savingRate)} — supera el mínimo recomendado (20%)` })
  } else if (metrics.savingRate >= 0.10) {
    signals.push({ id: 'saving', label: 'Tasa de ahorro', status: 'yellow', value: fmtPct(metrics.savingRate), note: `${fmtPct(metrics.savingRate)} — por debajo del 20% recomendado` })
  } else {
    signals.push({ id: 'saving', label: 'Tasa de ahorro', status: 'red',    value: fmtPct(metrics.savingRate), note: `${fmtPct(metrics.savingRate)} — nivel crítico` })
  }

  // 2. Ratio deuda / ingreso mensual
  const debtRatio = metrics.mIncome > 0 ? metrics.totalDebt / (metrics.mIncome * 12) : 0
  if (debtRatio <= 0.30) {
    signals.push({ id: 'debt', label: 'Carga de deuda', status: 'green',  value: fmtPct(debtRatio), note: `Deuda equivale al ${fmtPct(debtRatio)} del ingreso anual` })
  } else if (debtRatio <= 0.60) {
    signals.push({ id: 'debt', label: 'Carga de deuda', status: 'yellow', value: fmtPct(debtRatio), note: `Deuda equivale al ${fmtPct(debtRatio)} del ingreso anual — revisar` })
  } else {
    signals.push({ id: 'debt', label: 'Carga de deuda', status: 'red',    value: fmtPct(debtRatio), note: `Deuda equivale al ${fmtPct(debtRatio)} del ingreso anual — nivel elevado` })
  }

  // 3. Flujo neto del mes
  if (metrics.mBalance > 0) {
    signals.push({ id: 'flow', label: 'Flujo neto mensual', status: 'green',  value: fmtMoney(metrics.mBalance, metrics.sym), note: 'Flujo positivo este mes' })
  } else if (metrics.mBalance === 0) {
    signals.push({ id: 'flow', label: 'Flujo neto mensual', status: 'yellow', value: fmtMoney(0, metrics.sym), note: 'Ingresos y gastos equilibrados exactamente' })
  } else {
    signals.push({ id: 'flow', label: 'Flujo neto mensual', status: 'red',    value: fmtMoney(metrics.mBalance, metrics.sym), note: 'Flujo negativo — gastos superan ingresos' })
  }

  // 4. Metas con progreso
  const goalsOk = metrics.goals.filter(g => g.saved / g.target >= 0.25).length
  const goalsTotal = metrics.goals.length
  if (goalsTotal === 0) {
    signals.push({ id: 'goals', label: 'Metas de ahorro', status: 'yellow', value: '0 metas', note: 'No hay metas definidas — recomendar establecer prioridades' })
  } else if (goalsOk >= goalsTotal * 0.5) {
    signals.push({ id: 'goals', label: 'Metas de ahorro', status: 'green',  value: `${goalsOk}/${goalsTotal}`, note: `${goalsOk} de ${goalsTotal} metas con avance adecuado` })
  } else {
    signals.push({ id: 'goals', label: 'Metas de ahorro', status: 'yellow', value: `${goalsOk}/${goalsTotal}`, note: `Solo ${goalsOk} de ${goalsTotal} metas tienen avance suficiente` })
  }

  // 5. Presupuestos excedidos
  const overBudget = metrics.overBudgetCount
  if (overBudget === 0 && metrics.budgets.length > 0) {
    signals.push({ id: 'budgets', label: 'Presupuestos', status: 'green',  value: 'Al día', note: 'Ningún presupuesto excedido este mes' })
  } else if (overBudget > 0) {
    signals.push({ id: 'budgets', label: 'Presupuestos', status: overBudget >= 2 ? 'red' : 'yellow', value: `${overBudget} excedidos`, note: `${overBudget} categoría(s) superaron el límite mensual` })
  }

  return signals
}

// ── ALERTAS AUTOMÁTICAS ──────────────────────────────────────────────────────
function calcAlerts(metrics) {
  const alerts = []

  if (metrics.savingRate < 0.10 && metrics.mIncome > 0)
    alerts.push({ type: 'danger', text: `Tasa de ahorro crítica (${fmtPct(metrics.savingRate)}). Revisar gastos fijos y discrecionales con el cliente.` })

  if (metrics.mBalance < 0)
    alerts.push({ type: 'danger', text: `Flujo neto negativo este mes: ${fmtMoney(metrics.mBalance, metrics.sym)}. El cliente está gastando más de lo que ingresa.` })

  const highRateDebt = metrics.debts.filter(d => d.rate > 15)
  if (highRateDebt.length > 0)
    alerts.push({ type: 'warn', text: `${highRateDebt.length} deuda(s) con tasa superior al 15% (${highRateDebt.map(d => d.creditor).join(', ')}). Evaluar refinanciamiento o prepago.` })

  if (metrics.overBudgetCount >= 2)
    alerts.push({ type: 'warn', text: `${metrics.overBudgetCount} presupuestos excedidos. Patrón de gasto por encima de los límites establecidos.` })

  const deseos = metrics.monthExpenses.filter(e => e.type === 'Deseo').reduce((s, e) => s + e.amount, 0)
  const deseosRatio = metrics.mIncome > 0 ? deseos / metrics.mIncome : 0
  if (deseosRatio > 0.35 && metrics.mIncome > 0)
    alerts.push({ type: 'warn', text: `Gastos discrecionales (deseos) representan el ${fmtPct(deseosRatio)} del ingreso. La regla 50/30/20 sugiere máximo 30%.` })

  const urgentDebts = metrics.debts.filter(d => {
    if (!d.dueDate) return false
    const days = (new Date(d.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
    return days >= 0 && days <= 10
  })
  if (urgentDebts.length > 0)
    alerts.push({ type: 'warn', text: `${urgentDebts.length} pago(s) de deuda vencen en los próximos 10 días: ${urgentDebts.map(d => d.creditor).join(', ')}.` })

  const emergencyGoal = metrics.goals.find(g => g.name?.toLowerCase().includes('emergencia') || g.name?.toLowerCase().includes('emergency'))
  if (!emergencyGoal)
    alerts.push({ type: 'info', text: 'No hay meta de fondo de emergencia definida. Se recomienda establecer como prioridad alta (3-6 meses de gastos fijos).' })
  else if (emergencyGoal.saved / emergencyGoal.target < 0.5)
    alerts.push({ type: 'info', text: `Fondo de emergencia al ${fmtPct(emergencyGoal.saved / emergencyGoal.target)}. Meta recomendada: completar al menos el 50% antes de avanzar con otras metas.` })

  if (metrics.goals.length === 0)
    alerts.push({ type: 'info', text: 'No hay metas de ahorro definidas. Trabajar con el cliente en definir al menos 2 prioridades concretas.' })

  return alerts
}

// ── SEMÁFORO VISUAL ──────────────────────────────────────────────────────────
function TrafficLight({ signals }) {
  const colors = { green: '#1aa368', yellow: '#d4982a', red: '#e05a4a' }
  const bg     = { green: '#e4f5ec', yellow: '#faeeda', red: '#fdf0ee' }
  const labels = { green: 'Saludable', yellow: 'Atención', red: 'Riesgo' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {signals.map(s => (
        <div key={s.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 8,
          background: bg[s.status], border: `0.5px solid ${colors[s.status]}22`,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: colors[s.status], flexShrink: 0,
            boxShadow: `0 0 6px ${colors[s.status]}66`,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)', marginBottom: 1 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--tm)', fontFamily: 'var(--mono)' }}>{s.note}</div>
          </div>
          <div style={{
            fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600,
            color: colors[s.status], flexShrink: 0,
            background: `${colors[s.status]}18`, padding: '2px 8px', borderRadius: 20,
          }}>
            {labels[s.status]}
          </div>
        </div>
      ))}
      <p style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 4, lineHeight: 1.5 }}>
        * Señales orientativas basadas en los datos registrados. No constituyen diagnóstico financiero certificado.
      </p>
    </div>
  )
}

// ── KPI CARD SIMPLE ──────────────────────────────────────────────────────────
function AdvisorKPI({ label, value, sub, color = 'var(--tx)' }) {
  return (
    <div style={{
      background: 'var(--sur2)', border: '0.5px solid var(--brd)',
      borderRadius: 8, padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'var(--mono)', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

// ── ADVISOR NOTES — comentarios y próximos pasos ─────────────────────────────
function AdvisorNotes({ notes, onSave }) {
  const [comments, setComments] = useState(notes.comments || '')
  const [nextSteps, setNextSteps] = useState(notes.nextSteps || '')
  const [meetingDate, setMeetingDate] = useState(notes.meetingDate || '')
  const [clientName, setClientName] = useState(notes.clientName || '')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    onSave({ comments, nextSteps, meetingDate, clientName, updatedAt: new Date().toISOString() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const ta = {
    width: '100%', minHeight: 80, resize: 'vertical',
    background: 'var(--sur)', border: '0.5px solid var(--brd2)',
    borderRadius: 6, padding: '10px 12px', fontSize: 12,
    color: 'var(--tx)', fontFamily: 'var(--syne, sans-serif)',
    lineHeight: 1.6,
  }
  const inp = {
    width: '100%', background: 'var(--sur)', border: '0.5px solid var(--brd2)',
    borderRadius: 6, padding: '8px 12px', fontSize: 12,
    color: 'var(--tx)', fontFamily: 'var(--syne, sans-serif)',
  }
  const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--tx)', marginBottom: 5, display: 'block' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={lbl}>Nombre del cliente</label>
          <input style={inp} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ej: María González" />
        </div>
        <div>
          <label style={lbl}>Próxima reunión</label>
          <input style={{ ...inp }} type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label style={lbl}>Observaciones del asesor</label>
        <textarea
          style={ta}
          value={comments}
          onChange={e => setComments(e.target.value)}
          placeholder="Notas sobre la situación financiera del cliente, patrones observados, contexto relevante para la reunión..."
        />
      </div>

      <div>
        <label style={lbl}>Próximos pasos recomendados</label>
        <textarea
          style={{ ...ta, minHeight: 70 }}
          value={nextSteps}
          onChange={e => setNextSteps(e.target.value)}
          placeholder="1. Revisar gastos de entretenimiento&#10;2. Definir meta de fondo de emergencia&#10;3. Evaluar refinanciamiento tarjeta BancoEstado"
        />
        <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 4 }}>
          Sugerencia: usa numeración para ordenar por prioridad.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={handleSave}
          style={{
            background: 'var(--grn)', color: '#fff', border: 'none',
            borderRadius: 6, padding: '9px 20px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--syne, sans-serif)',
          }}
        >
          {saved ? '✓ Guardado' : 'Guardar notas'}
        </button>
        {notes.updatedAt && (
          <span style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
            Última actualización: {new Date(notes.updatedAt).toLocaleDateString('es-CL')}
          </span>
        )}
      </div>

      <div style={{
        fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)',
        padding: '8px 10px', background: 'var(--sur2)',
        borderRadius: 6, borderLeft: '2px solid var(--brd2)', lineHeight: 1.5,
      }}>
        🔒 Las notas se guardan localmente en este dispositivo. No se transmiten a ningún servidor.
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Advisor() {
  const { incomes, expenses, budgets, debts, goals, settings, updateSettings } = useApp()
  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'

  // Leer y guardar notas del asesor en settings (local)
  const advisorNotes = settings.advisorNotes || {}
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError]     = useState(null)

  function saveNotes(notes) {
    updateSettings({ ...settings, advisorNotes: notes })
  }

  async function handleExportPDF() {
    setPdfLoading(true)
    setPdfError(null)
    try {
      const expByCat = {}
      monthExpenses.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount })
      await downloadReportePDF({
        brandName:        config.app.name,
        clientName:       advisorNotes.clientName || 'Cliente',
        activeMonth,
        sym,
        mIncome, mExpense, mBalance, savingRate,
        totalDebt, totalMinPayments,
        signals, alerts, goals, debts,
        overBudgetCount, score, scoreLabel, scoreColor,
        advisorNotes,
        expByCategory:    expByCat,
        subMonthly, subAnnual, subCount,
        subAlerts:        subAlerts.slice(0, 3),
        subByCategory:    subMetrics?.byCategory || [],
      })
    } catch (e) {
      console.error('PDF error:', e)
      setPdfError('Error al generar el PDF. Intenta de nuevo.')
    } finally {
      setPdfLoading(false)
    }
  }

  // Mes activo
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const monthLabel = (m) => {
    const [y, mo] = m.split('-')
    return `${['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+mo]} ${y}`
  }

  // Métricas del mes activo
  const monthIncomes  = useMemo(() => incomes.filter(r => r.date?.startsWith(activeMonth)),  [incomes,  activeMonth])
  const monthExpenses = useMemo(() => expenses.filter(r => r.date?.startsWith(activeMonth)), [expenses, activeMonth])
  const mIncome  = monthIncomes.reduce((s, r) => s + r.amount, 0)
  const mExpense = monthExpenses.reduce((s, r) => s + r.amount, 0)
  const mBalance = mIncome - mExpense
  const savingRate = mIncome > 0 ? mBalance / mIncome : 0
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const totalMinPayments = debts.reduce((s, d) => s + (d.minPayment || 0), 0)

  // Presupuestos excedidos
  const expByCat = useMemo(() => {
    const m = {}
    monthExpenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount })
    return m
  }, [monthExpenses])

  const overBudgetCount = budgets.filter(b => (expByCat[b.category] || 0) > b.limit).length

  // Metas
  const goalsProgress = goals.map(g => ({ ...g, pct: g.target > 0 ? g.saved / g.target : 0 }))
  const avgGoalPct = goalsProgress.length > 0 ? goalsProgress.reduce((s, g) => s + g.pct, 0) / goalsProgress.length : 0

  const metrics = { savingRate, mIncome, mExpense, mBalance, totalDebt, goals, budgets, overBudgetCount, monthExpenses, debts, sym }
  const signals = useMemo(() => calcTrafficLight(metrics), [savingRate, mIncome, mBalance, totalDebt, overBudgetCount, goals.length])
  const alerts  = useMemo(() => calcAlerts(metrics),       [savingRate, mIncome, mBalance, debts, monthExpenses, goals, overBudgetCount])

  // Score general (0-100) basado en semáforos
  const scoreMap = { green: 100, yellow: 50, red: 0 }
  const score = signals.length > 0 ? Math.round(signals.reduce((s, sig) => s + scoreMap[sig.status], 0) / signals.length) : 0
  const scoreColor = score >= 70 ? '#1aa368' : score >= 40 ? '#d4982a' : '#e05a4a'
  const scoreLabel = score >= 70 ? 'Situación saludable' : score >= 40 ? 'Requiere atención' : 'Situación de riesgo'

  const noData = mIncome === 0 && mExpense === 0 && debts.length === 0

  // Suscripciones — hook compartido
  const subMetrics = useSubscriptionMetrics()
  const { monthly: subMonthly, annual: subAnnual, pct: subPct,
          count: subCount, alerts: subAlerts, activeSubs } = subMetrics

  return (
    <div className="stack">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <h1 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>Modo Asesor</h1>
            <div style={{
              fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 600,
              background: 'var(--grn-bg)', color: 'var(--grn)',
              padding: '2px 8px', borderRadius: 20, letterSpacing: '0.5px',
            }}>
              VISTA PROFESIONAL
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
            Diagnóstico · Alertas · Notas · Preparación de reunión · {monthLabel(activeMonth)}
          </p>
        </div>
        <select
          value={activeMonth}
          onChange={e => updateSettings({ ...settings, activeMonth: e.target.value })}
          style={{ width: 'auto', fontSize: 11, padding: '5px 8px' }}
        >
          {[...new Set([
            ...incomes.map(r => r.date?.slice(0,7)),
            ...expenses.map(r => r.date?.slice(0,7)),
          ].filter(Boolean))].sort().reverse().map(m => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
      </div>

      {noData && (
        <div style={{
          padding: '20px 24px', background: 'var(--sur2)',
          border: '0.5px solid var(--brd)', borderRadius: 8,
          fontSize: 13, color: 'var(--tm)', lineHeight: 1.6, textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>◈</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Sin datos para analizar</div>
          <div style={{ fontSize: 12, color: 'var(--th)' }}>
            Registra ingresos, gastos y deudas para ver el diagnóstico completo del cliente.
          </div>
        </div>
      )}

      {!noData && (
        <>
          {/* Score general */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                border: `4px solid ${scoreColor}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor, fontFamily: 'var(--mono)', lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 8, color: 'var(--th)', fontFamily: 'var(--mono)' }}>/ 100</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: scoreColor, marginBottom: 3 }}>{scoreLabel}</div>
                <div style={{ fontSize: 12, color: 'var(--tm)', lineHeight: 1.5 }}>
                  {advisorNotes.clientName ? `Cliente: ${advisorNotes.clientName} · ` : ''}
                  {signals.filter(s => s.status === 'green').length} indicadores saludables,{' '}
                  {signals.filter(s => s.status === 'yellow').length} requieren atención,{' '}
                  {signals.filter(s => s.status === 'red').length} en riesgo.
                </div>
                {advisorNotes.meetingDate && (
                  <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 4 }}>
                    Próxima reunión: {new Date(advisorNotes.meetingDate + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {[
                  { c: '#1aa368', l: 'Saludable' },
                  { c: '#d4982a', l: 'Atención' },
                  { c: '#e05a4a', l: 'Riesgo' },
                ].map(i => (
                  <div key={i.l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: i.c }} />
                    {i.l}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            <AdvisorKPI label="Ingreso mes" value={fmtMoney(mIncome, sym)} color="var(--grn)" />
            <AdvisorKPI label="Gasto mes" value={fmtMoney(mExpense, sym)} color={mExpense > mIncome ? '#e05a4a' : 'var(--tx)'} />
            <AdvisorKPI label="Flujo neto" value={fmtMoney(mBalance, sym)} color={mBalance >= 0 ? 'var(--grn)' : '#e05a4a'} />
            <AdvisorKPI label="Tasa ahorro" value={fmtPct(savingRate)} color={savingRate >= 0.2 ? 'var(--grn)' : savingRate >= 0.1 ? '#d4982a' : '#e05a4a'} sub="Meta: 20%+" />
            <AdvisorKPI label="Deuda total" value={fmtMoney(totalDebt, sym)} color={totalDebt > 0 ? '#d4982a' : 'var(--grn)'} sub={totalDebt > 0 ? `Min: ${fmtMoney(totalMinPayments, sym)}/mes` : 'Sin deudas'} />
            <AdvisorKPI label="Metas activas" value={goals.length} sub={`Avance prom: ${fmtPct(avgGoalPct)}`} />
            <AdvisorKPI label="Presupuestos" value={overBudgetCount > 0 ? `${overBudgetCount} excedidos` : 'Al día'} color={overBudgetCount > 0 ? '#e05a4a' : 'var(--grn)'} />
          </div>

          {/* Semáforo */}
          <Card>
            <CardHeader title="Semáforo financiero" />
            <TrafficLight signals={signals} />
          </Card>

          {/* Alertas automáticas */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader title={`Alertas automáticas (${alerts.length})`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {alerts.map((a, i) => (
                  <Alert key={i} type={a.type}>{a.text}</Alert>
                ))}
              </div>
              <p style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 8, lineHeight: 1.5 }}>
                * Alertas generadas automáticamente a partir de los datos registrados. Son señales orientativas —
                no constituyen diagnóstico financiero certificado ni recomendaciones de inversión.
              </p>
            </Card>
          )}

          {/* Desglose deudas */}
          {debts.length > 0 && (
            <Card>
              <CardHeader title="Deudas activas" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {debts.map(d => {
                  const pct = d.initial > 0 ? (d.initial - d.balance) / d.initial : 0
                  return (
                    <div key={d.id} style={{
                      padding: '10px 12px', background: 'var(--sur2)',
                      borderRadius: 8, border: '0.5px solid var(--brd)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>{d.creditor}</div>
                          <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
                            TAE: {d.rate}% · Pago mínimo: {fmtMoney(d.minPayment || 0, sym)}/mes
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#d4982a', fontFamily: 'var(--mono)' }}>{fmtMoney(d.balance, sym)}</div>
                          <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>pendiente</div>
                        </div>
                      </div>
                      <div style={{ height: 4, background: 'var(--brd)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(pct * 100, 100)}%`, background: 'var(--grn)', borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 3 }}>
                        {fmtPct(pct)} pagado · Vence: {d.dueDate || '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Metas */}
          {goals.length > 0 && (
            <Card>
              <CardHeader title="Avance de metas" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {goals.map(g => {
                  const pct = g.target > 0 ? Math.min(g.saved / g.target, 1) : 0
                  return (
                    <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx)' }}>{g.name}</span>
                        <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>
                          {fmtMoney(g.saved, sym)} / {fmtMoney(g.target, sym)}
                        </span>
                      </div>
                      <div style={{ height: 5, background: 'var(--brd)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct * 100}%`, background: g.color || 'var(--grn)', borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
                        {fmtPct(pct)} completado · Fecha objetivo: {g.targetDate || '—'} · Prioridad: {g.priority || '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Notas del asesor — siempre visible */}
      <Card>
        <CardHeader title="Notas del asesor y próximos pasos" />
        <AdvisorNotes notes={advisorNotes} onSave={saveNotes} />
      </Card>

      {/* Plantilla del cliente */}
      <Card>
        <CardHeader title="Perfil del cliente" />
        <TemplateSelector compact onApplied={(t) => showToast(`Plantilla "${t.name}" aplicada.`, 'ok')} />
      </Card>

      {/* CTA reporte PDF */}
      <div style={{
        padding: '16px 20px', background: 'var(--grn-bg)',
        border: '0.5px solid rgba(26,163,104,.2)', borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 2 }}>
            Exportar reporte PDF profesional
          </div>
          <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
            Genera un PDF con métricas, semáforo, alertas y notas del asesor. Listo para compartir con el cliente.
          </div>
          {pdfError && (
            <div style={{ fontSize: 11, color: '#e05a4a', fontFamily: 'var(--mono)', marginTop: 4 }}>
              {pdfError}
            </div>
          )}
        </div>
        <button
          onClick={handleExportPDF}
          disabled={pdfLoading || noData}
          style={{
            background: pdfLoading ? 'var(--sur)' : 'var(--grn)',
            color: pdfLoading ? 'var(--th)' : '#fff',
            border: 'none', borderRadius: 6, padding: '10px 20px',
            fontSize: 12, fontWeight: 600, cursor: pdfLoading || noData ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--syne, sans-serif)', flexShrink: 0, opacity: noData ? 0.5 : 1,
            transition: 'all .15s',
          }}
        >
          {pdfLoading ? 'Generando PDF…' : '↓ Exportar PDF'}
        </button>
      </div>

      {/* ── SECCIÓN SUSCRIPCIONES EN MODO ASESOR ── */}
      {subCount > 0 && (
        <div style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '16px', marginBottom: 0 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 2 }}>
            Gastos recurrentes estimados
          </div>
          <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 10 }}>
            Gasto proyectado · no incluido en gastos registrados · orientativo
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Gasto mensual', value: `${sym}${subMonthly.toLocaleString('es-CL', {maximumFractionDigits:0})}` },
              { label: 'Gasto anual',   value: `${sym}${subAnnual.toLocaleString('es-CL', {maximumFractionDigits:0})}` },
              { label: 'Activas',       value: `${activeSubs.length}` },
              { label: '% del ingreso', value: mIncome > 0 ? `${(subPct*100).toFixed(1)}%` : '—' },
            ].map(m => (
              <div key={m.label} style={{ background: 'var(--sur2)', borderRadius: 6, padding: '8px 10px', border: '.5px solid var(--brd)' }}>
                <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.5px' }}>{m.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--tx)' }}>{m.value}</div>
              </div>
            ))}
          </div>
          {/* Alertas de suscripciones */}
          {subAlerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {subAlerts.map((a, i) => (
                <div key={i} style={{ fontSize: 11, fontFamily: 'var(--mono)', color: a.type === 'duplicate' ? 'var(--amb)' : a.type === 'income' ? 'var(--amb)' : 'var(--th)', background: 'var(--sur2)', padding: '6px 10px', borderRadius: 6, borderLeft: `2px solid ${a.type === 'duplicate' || a.type === 'income' ? 'var(--amb)' : 'var(--brd)'}` }}>
                  {a.msg}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 10 }}>
            Las sugerencias son orientativas y no constituyen asesoría financiera.
          </div>
        </div>
      )}

      <FinancialDisclaimer />
    </div>
  )
}
