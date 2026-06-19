// src/pages/Coach/index.jsx
// FinanceOS Coach — Motor de señales orientativas local
// Sin IA externa · Sin backend · 100% offline
// Las sugerencias son orientativas y no constituyen asesoría financiera.

import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { evaluateCoach, calcCoachMetrics, COACH_CONFIG } from '../../data/coachRules.js'
import useSubscriptionMetrics from '../../hooks/useSubscriptionMetrics.js'

// ── ICONO POR SEVERIDAD ────────────────────────────────────────────────────
const SEV_ICON  = { info: '◈', attention: '⚠', warning: '⊗' }
const SEV_LABEL = { info: 'Información', attention: 'Atención', warning: 'Revisar' }

// ── TARJETA DE SEÑAL ───────────────────────────────────────────────────────
function SignalCard({ signal }) {
  const color = COACH_CONFIG.severityColors[signal.severity] || 'var(--th)'
  return (
    <div style={{
      background: 'var(--sur)', border: `.5px solid var(--brd)`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ color, fontSize: 13 }}>{SEV_ICON[signal.severity]}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
          {SEV_LABEL[signal.severity]}
        </span>
        <span style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', marginLeft: 'auto' }}>
          {signal.category}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 4 }}>
        {signal.title}
      </div>
      <div style={{ fontSize: 12, color: 'var(--tm)', lineHeight: 1.6 }}>
        {signal.msg}
      </div>
      {signal.action && (
        <div style={{
          marginTop: 8, fontSize: 11, fontFamily: 'var(--mono)',
          color: 'var(--grn2)', background: 'var(--grn-bg)',
          padding: '5px 9px', borderRadius: 6,
          borderLeft: '2px solid var(--grn)',
        }}>
          → {signal.action}
        </div>
      )}
    </div>
  )
}

// ── RESUMEN DE CATEGORÍA ───────────────────────────────────────────────────
function CategorySummary({ signals }) {
  const cats = {}
  signals.forEach(s => {
    if (!cats[s.category]) cats[s.category] = { info: 0, attention: 0, warning: 0 }
    cats[s.category][s.severity]++
  })

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
      {Object.entries(cats).map(([cat, counts]) => {
        const dominant = counts.warning > 0 ? 'warning' : counts.attention > 0 ? 'attention' : 'info'
        const color = COACH_CONFIG.severityColors[dominant]
        return (
          <div key={cat} style={{
            padding: '5px 11px', borderRadius: 20, fontSize: 11,
            background: 'var(--sur2)', border: `.5px solid ${color}40`,
            color: 'var(--tm)', fontFamily: 'var(--mono)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ color, fontSize: 10 }}>{SEV_ICON[dominant]}</span>
            {cat}
          </div>
        )
      })}
    </div>
  )
}

// ── KPI BAR ────────────────────────────────────────────────────────────────
function KpiBar({ label, value, pct, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: 'var(--tm)', fontFamily: 'var(--mono)' }}>{label}</span>
        <span style={{ fontWeight: 600, color: color || 'var(--tx)', fontFamily: 'var(--mono)' }}>{value}</span>
      </div>
      <div style={{ height: 4, background: 'var(--sur2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct * 100, 100)}%`, background: color || 'var(--grn)', borderRadius: 2, transition: 'width .4s' }} />
      </div>
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
export default function Coach() {
  const { incomes, expenses, budgets, debts, goals, settings } = useApp()
  const { subs } = useSubscriptionMetrics()

  const metrics = useMemo(() =>
    calcCoachMetrics({ incomes, expenses, budgets, debts, goals, subs, settings }),
    [incomes, expenses, budgets, debts, goals, subs, settings]
  )

  const signals = useMemo(() => evaluateCoach(metrics), [metrics])

  const warnings    = signals.filter(s => s.severity === 'warning')
  const attentions  = signals.filter(s => s.severity === 'attention')
  const infos       = signals.filter(s => s.severity === 'info')

  const sym = metrics.sym
  const fmtN = n => (n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })
  const fmtP = n => ((n || 0) * 100).toFixed(1) + '%'

  // Score orientativo 0-100
  const score = Math.max(0, 100 - warnings.length * 20 - attentions.length * 8)
  const scoreColor = score >= 80 ? 'var(--grn)' : score >= 60 ? 'var(--amb)' : 'var(--red)'
  const scoreLabel = score >= 80 ? 'Pocas señales activas' : score >= 60 ? 'Algunas señales para revisar' : 'Varias señales activas'

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--grn)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>
          Diagnóstico financiero
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-.5px', marginBottom: 4 }}>
          Señales del mes
        </h1>
        <p style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)', marginBottom: 4 }}>
          Señales orientativas basadas en tus datos · {metrics.activeMonth}
          <span style={{display:'block',fontSize:10,color:'var(--th)',marginTop:4,fontFamily:'var(--mono)'}}>
            Indicadores orientativos. No constituyen asesoría financiera, tributaria ni legal.
          </span>
        </p>
        <p style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', background: 'var(--sur2)', padding: '5px 9px', borderRadius: 6, display: 'inline-block' }}>
          Generado localmente · sin IA externa · sin envío de datos
        </p>
      </div>

      {/* Score + KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '16px', marginBottom: 20, alignItems: 'center' }}>
        {/* Score circle */}
        <div style={{ textAlign: 'center', padding: '0 12px' }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor, fontFamily: 'var(--mono)', lineHeight: 1, letterSpacing: '-2px' }}>
            {score}
          </div>
          <div style={{ fontSize: 9, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 2 }}>/100</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: scoreColor, marginTop: 4 }}>{scoreLabel}</div>
          <div style={{ fontSize: 9, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 3, lineHeight: 1.4, textAlign: 'center' }}>Basado en reglas<br/>configurables · orientativo</div>
        </div>

        {/* KPIs */}
        <div>
          <KpiBar
            label="Tasa de ahorro"
            value={fmtP(metrics.savingsRate)}
            pct={Math.max(0, metrics.savingsRate)}
            color={metrics.savingsRate >= 0.20 ? 'var(--grn)' : metrics.savingsRate >= 0.10 ? 'var(--amb)' : 'var(--red)'}
          />
          <KpiBar
            label="Suscripciones / ingreso"
            value={fmtP(metrics.subscriptionRatio)}
            pct={metrics.subscriptionRatio}
            color={metrics.subscriptionRatio < 0.07 ? 'var(--grn)' : metrics.subscriptionRatio < 0.12 ? 'var(--amb)' : 'var(--red)'}
          />
          <KpiBar
            label="Carga de deuda / ingreso anual"
            value={fmtP(metrics.debtLoad)}
            pct={metrics.debtLoad}
            color={metrics.debtLoad < 0.30 ? 'var(--grn)' : metrics.debtLoad < 0.50 ? 'var(--amb)' : 'var(--red)'}
          />
          {metrics.monthlyExpense > 0 && (
            <KpiBar
              label="Fondo de emergencia"
              value={`${metrics.emergencyFundMonths.toFixed(1)} meses`}
              pct={metrics.emergencyFundMonths / 6}
              color={metrics.emergencyFundMonths >= 3 ? 'var(--grn)' : metrics.emergencyFundMonths >= 1 ? 'var(--amb)' : 'var(--red)'}
            />
          )}
        </div>
      </div>

      {/* Resumen de señales */}
      {signals.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {warnings.length > 0 && (
            <div style={{ padding: '6px 12px', background: 'var(--red-bg, #fdf0ee)', border: '.5px solid var(--red)', borderRadius: 20, fontSize: 11, color: 'var(--red)', fontFamily: 'var(--mono)' }}>
              ⊗ {warnings.length} para revisar
            </div>
          )}
          {attentions.length > 0 && (
            <div style={{ padding: '6px 12px', background: 'var(--amb-bg, #faeeda)', border: '.5px solid var(--amb)', borderRadius: 20, fontSize: 11, color: 'var(--amb)', fontFamily: 'var(--mono)' }}>
              ⚠ {attentions.length} atención
            </div>
          )}
          {infos.length > 0 && (
            <div style={{ padding: '6px 12px', background: 'var(--grn-bg)', border: '.5px solid var(--grn)', borderRadius: 20, fontSize: 11, color: 'var(--grn)', fontFamily: 'var(--mono)' }}>
              ◈ {infos.length} info
            </div>
          )}
        </div>
      )}

      {/* Categorías activas */}
      {signals.length > 0 && <CategorySummary signals={signals} />}

      {/* Señales por prioridad */}
      {signals.length === 0 ? (
        <div style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '28px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>◈</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginBottom: 4 }}>Sin señales activas</div>
          <div style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
            Registrá ingresos, gastos y datos del mes para ver el análisis completo.
          </div>
        </div>
      ) : (
        <>
          {warnings.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                ⊗ Para revisar
              </div>
              {warnings.map(s => <SignalCard key={s.id} signal={s} />)}
            </div>
          )}
          {attentions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--amb)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                ⚠ Atención
              </div>
              {attentions.map(s => <SignalCard key={s.id} signal={s} />)}
            </div>
          )}
          {infos.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--grn)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                ◈ Información
              </div>
              {infos.map(s => <SignalCard key={s.id} signal={s} />)}
            </div>
          )}
        </>
      )}

      {/* Checklist mensual */}
      {signals.length >= 0 && (() => {
        const items = [
          { done: (incomes.filter(r => r?.date?.startsWith(settings?.activeMonth || '')).length > 0), label: 'Registrar ingresos del mes' },
          { done: (expenses.filter(r => r?.date?.startsWith(settings?.activeMonth || '')).length > 0), label: 'Registrar gastos del mes' },
          { done: (budgets.length > 0), label: 'Tener al menos un presupuesto activo' },
          { done: (goals.length > 0), label: 'Tener al menos una meta financiera' },
          { done: (signals.filter(s => s.severity === 'warning').length === 0), label: 'Sin señales críticas activas' },
        ]
        const doneCount = items.filter(i => i.done).length
        return (
          <div style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.8px' }}>Checklist del mes</div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: doneCount === items.length ? 'var(--accent)' : 'var(--th)' }}>{doneCount}/{items.length}</span>
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < items.length - 1 ? '.5px solid var(--brd)' : 'none' }}>
                <span style={{ fontSize: 13, color: it.done ? 'var(--accent)' : 'var(--brd2)', flexShrink: 0 }}>{it.done ? '✓' : '○'}</span>
                <span style={{ fontSize: 12, color: it.done ? 'var(--tx)' : 'var(--th)' }}>{it.label}</span>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Disclaimer completo al pie */}
      <div style={{ padding: '10px 12px', background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, marginTop: 8 }}>
        Este diagnóstico es generado localmente a partir de los datos que ingresaste. No constituye asesoría financiera, tributaria, contable ni de inversión. No reemplaza la consulta con profesionales certificados. Las señales y el score son orientativos y se basan en umbrales configurables. MAXNOVA &amp; LUCI Global LLC no asume responsabilidad por decisiones tomadas con base en este diagnóstico.
      </div>
    </div>
  )
}

// ── EXPORT HOOK PARA INTEGRACIÓN ──────────────────────────────────────────
export function useCoachSignals() {
  const { incomes, expenses, budgets, debts, goals, settings } = useApp()
  const { subs } = useSubscriptionMetrics()
  const metrics = useMemo(() =>
    calcCoachMetrics({ incomes, expenses, budgets, debts, goals, subs, settings }),
    [incomes, expenses, budgets, debts, goals, subs, settings]
  )
  const signals = useMemo(() => evaluateCoach(metrics), [metrics])
  return { signals, metrics }
}
