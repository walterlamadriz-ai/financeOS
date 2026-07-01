// src/components/Onboarding.jsx
// Onboarding inicial — FinanceOS Fase 8 (reescrito completo)
// 6 pasos: Bienvenida → Uso → Perfil → Configuración → Plantilla → Resumen

import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import TEMPLATES from '../data/templates.js'
import { SEED_INCOMES, SEED_EXPENSES, SEED_BUDGETS, SEED_DEBTS, SEED_GOALS, uid } from '../utils/index.js'
import { dbAdd } from '../core/db/index.js'

const CURRENCIES = [
  { code: 'CLP', label: 'Peso chileno',    flag: '🇨🇱' },
  { code: 'USD', label: 'Dólar',           flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro',            flag: '🇪🇺' },
  { code: 'VES', label: 'Bolívar',         flag: '🇻🇪' },
  { code: 'MXN', label: 'Peso mexicano',   flag: '🇲🇽' },
  { code: 'ARS', label: 'Peso argentino',  flag: '🇦🇷' },
  { code: 'PEN', label: 'Sol peruano',      flag: '🇵🇪' },
  { code: 'COP', label: 'Peso colombiano', flag: '🇨🇴' },
]
const USE_TYPES = [
  { id: 'personal', icon: '◈', label: 'Uso personal',  desc: 'Voy a registrar mis propias finanzas' },
  { id: 'advisor',  icon: '◑', label: 'Con clientes',   desc: 'Soy asesor, coach o contador' },
  { id: 'demo',     icon: '⟶', label: 'Solo explorar',  desc: 'Quiero ver cómo funciona antes de usarlo' },
]
const MAIN_GOALS = [
  { id: 'control', icon: '◈', label: 'Orden financiero',    desc: 'Saber en qué gasto mi dinero' },
  { id: 'save',    icon: '◎', label: 'Ahorrar más',          desc: 'Tengo una meta de ahorro específica' },
  { id: 'debt',    icon: '⊖', label: 'Salir de deudas',      desc: 'Quiero pagar mis deudas ordenadamente' },
  { id: 'plan',    icon: '▤', label: 'Planificar el futuro',  desc: 'Quiero planificar a mediano y largo plazo' },
]
const EXPERIENCE_LEVELS = [
  { id: 'beginner',     label: 'Principiante',  desc: 'Nunca llevé un presupuesto' },
  { id: 'intermediate', label: 'Intermedio',     desc: 'Llevo algo de control' },
  { id: 'advanced',     label: 'Avanzado',       desc: 'Manejo presupuestos y metas' },
]

function recommendTemplate({ profileId, useType, mainGoal, hasDebts }) {
  if (profileId) return profileId
  if (useType === 'advisor') return 'educador'
  if (mainGoal === 'debt' || hasDebts === 'yes') return 'deudas'
  if (mainGoal === 'save') return 'ahorro'
  return 'personal'
}

function ProgressBar({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 28, justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, borderRadius: 20, transition: 'all .3s',
          width: i < step ? 28 : i === step ? 20 : 8,
          background: i <= step ? 'var(--grn)' : 'var(--brd2)',
        }} />
      ))}
    </div>
  )
}

function OptionCard({ icon, label, desc, selected, onClick, color = 'var(--grn)' }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '11px 13px',
      borderRadius: 10, cursor: 'pointer', transition: 'all .15s',
      border: selected ? `1.5px solid ${color}` : '0.5px solid var(--brd2)',
      background: selected ? `${color}0d` : 'var(--sur2)',
      display: 'flex', alignItems: 'center', gap: 11, marginBottom: 6,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: selected ? `${color}18` : 'var(--sur)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, color: selected ? color : 'var(--th)',
        border: `0.5px solid ${selected ? color + '30' : 'var(--brd)'}`,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)', marginBottom: 1 }}>{label}</div>
        {desc && <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{desc}</div>}
      </div>
      {selected && <div style={{ color, fontSize: 14, flexShrink: 0 }}>✓</div>}
    </button>
  )
}

const wrap = {
  position: 'fixed', inset: 0, background: 'var(--bg)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 999, padding: 20, overflowY: 'auto',
}
const box = {
  background: 'var(--sur)', border: '0.5px solid var(--brd)',
  borderRadius: 16, padding: '26px 22px', maxWidth: 430, width: '100%',
  boxShadow: '0 24px 60px rgba(0,0,0,.08)', margin: 'auto',
}
const h1s = { fontSize: 18, fontWeight: 700, color: 'var(--tx)', marginBottom: 5, letterSpacing: '-0.3px' }
const subs = { fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.5, marginBottom: 18 }
const btnP = (disabled = false) => ({
  width: '100%', padding: '10px', borderRadius: 8, border: 'none',
  background: disabled ? 'var(--brd2)' : 'var(--grn)', color: '#fff',
  fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'var(--syne, sans-serif)', marginTop: 7, transition: 'all .15s',
})
const btnG = {
  width: '100%', padding: '8px', borderRadius: 8,
  border: '0.5px solid var(--brd2)', background: 'transparent',
  color: 'var(--th)', fontSize: 11, cursor: 'pointer',
  fontFamily: 'var(--syne, sans-serif)', marginTop: 5,
}

export default function Onboarding({ onComplete }) {
  const { settings, updateSettings } = useApp()
  const TOTAL = 8
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({
    useType: '', profileId: '',
    country: settings.country || 'CL',
    currency: settings.currency || 'CLP',
    savingGoal: 20, hasDebts: '', mainGoal: '', experience: '',
    estimatedMonthlyIncome: '',
  })
  const set = (k, v) => setAnswers(a => ({ ...a, [k]: v }))

  const recommendedId = useMemo(() => recommendTemplate(answers), [answers])
  const activeTemplate = TEMPLATES.find(t => t.id === (answers.profileId || recommendedId)) || TEMPLATES[0]

  const next = () => setStep(s => Math.min(s + 1, TOTAL))
  const back = () => setStep(s => Math.max(s - 1, 0))

  async function loadDemoData() {
    setLoading(true)
    try {
      const s = {
        incomes:  SEED_INCOMES.map(r  => ({ ...r, id: uid() })),
        expenses: SEED_EXPENSES.map(r => ({ ...r, id: uid() })),
        budgets:  SEED_BUDGETS.map(r  => ({ ...r, id: uid() })),
        debts:    SEED_DEBTS.map(r    => ({ ...r, id: uid() })),
        goals:    SEED_GOALS.map(r    => ({ ...r, id: uid() })),
      }
      await Promise.all([
        ...s.incomes.map(r  => dbAdd('incomes',  r)),
        ...s.expenses.map(r => dbAdd('expenses', r)),
        ...s.budgets.map(r  => dbAdd('budgets',  r)),
        ...s.debts.map(r    => dbAdd('debts',    r)),
        ...s.goals.map(r    => dbAdd('goals',    r)),
      ])
      await finalize(true)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function finalize(withDemo = false) {
    const t = activeTemplate
    await updateSettings({
      ...settings,
      currency: answers.currency, savingGoalPct: answers.savingGoal,
      country: answers.country,
      onboardingDone: true, onboardingUseType: answers.useType,
      onboardingExperience: answers.experience, onboardingMainGoal: answers.mainGoal,
      estimatedMonthlyIncome: Number(answers.estimatedMonthlyIncome) || 0,
      activeMonth: new Date().toISOString().slice(0, 7),
      activeTemplateId: t.id, activeTemplateName: t.name,
      categoriesIncome: t.categoriesIncome, categoriesExpense: t.categoriesExpense,
      templateSuggestedBudgets: t.suggestedBudgets,
      templateAdvisorTip: t.advisorTip, templateAlerts: t.alerts,
    })
    onComplete(withDemo)
  }

  // Step 0 — Bienvenida
  if (step === 0) return (
    <div style={wrap}><div style={box}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ width: 52, height: 52, borderRadius: 13, margin: '0 auto 12px', background: 'var(--grn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--grn)' }}>◈</div>
        <h1 style={{ ...h1s, textAlign: 'center' }}>Bienvenido a FinanceOS</h1>
        <p style={{ ...subs, textAlign: 'center' }}>Configuración inicial en 2 minutos. FinanceOS se adapta a ti desde el primer día.</p>
      </div>
      <div style={{ padding: '10px 13px', background: 'var(--grn-bg)', borderRadius: 8, border: '0.5px solid rgba(26,163,104,.2)', fontSize: 11, color: 'var(--grn)', fontFamily: 'var(--mono)', lineHeight: 1.6, marginBottom: 18 }}>
        🔒 Tus datos se guardan solo en este dispositivo. Sin servidores, sin cuentas, sin suscripciones.
      </div>
      <button style={btnP()} onClick={next}>Empezar configuración →</button>
      <button style={btnG} onClick={() => finalize()}>Saltar y entrar directamente</button>
      <button style={{ ...btnG, color: 'var(--grn)' }} onClick={loadDemoData} disabled={loading}>
        {loading ? 'Cargando…' : '⟶ Explorar con datos de ejemplo'}
      </button>
    </div></div>
  )

  // Step 1 — Tipo de uso
  if (step === 1) return (
    <div style={wrap}><div style={box}>
      <ProgressBar step={1} total={TOTAL} />
      <h2 style={h1s}>¿Cómo vas a usar FinanceOS?</h2>
      <p style={subs}>Esto nos ayuda a mostrarte las funciones más relevantes.</p>
      {USE_TYPES.map(u => <OptionCard key={u.id} {...u} selected={answers.useType === u.id} onClick={() => set('useType', u.id)} />)}
      <div style={{ display: 'flex', gap: 7, marginTop: 7 }}>
        <button style={{ ...btnG, width: 'auto', padding: '8px 14px', marginTop: 0 }} onClick={back}>← Atrás</button>
        <button style={{ ...btnP(answers.useType === ''), flex: 1, marginTop: 0 }} disabled={answers.useType === ''} onClick={next}>Continuar →</button>
      </div>
    </div></div>
  )

  // Step 2 — Perfil
  if (step === 2) return (
    <div style={wrap}><div style={{ ...box, maxWidth: 490 }}>
      <ProgressBar step={2} total={TOTAL} />
      <h2 style={h1s}>¿Qué perfil describe mejor la situación?</h2>
      <p style={subs}>{answers.useType === 'advisor' ? 'El perfil del cliente — podés cambiarlo desde el Modo Asesor.' : 'Elegí el que más se acerca — podés cambiarlo después.'}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {TEMPLATES.map(t => (
          <button key={t.id} onClick={() => set('profileId', t.id)} style={{
            padding: '10px 11px', borderRadius: 10, cursor: 'pointer',
            border: answers.profileId === t.id ? `1.5px solid ${t.color}` : '0.5px solid var(--brd2)',
            background: answers.profileId === t.id ? `${t.color}0d` : 'var(--sur2)',
            textAlign: 'left', transition: 'all .15s',
          }}>
            <div style={{ fontSize: 15, color: t.color, marginBottom: 3 }}>{t.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx)' }}>{t.name}</div>
            <div style={{ fontSize: 9, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 1 }}>{t.categoriesExpense.length} categorías</div>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
        <button style={{ ...btnG, width: 'auto', padding: '8px 14px', marginTop: 0 }} onClick={back}>← Atrás</button>
        <button style={{ ...btnP(false), flex: 1, marginTop: 0 }} onClick={next}>{answers.profileId ? 'Continuar →' : 'Saltar →'}</button>
      </div>
    </div></div>
  )


  // Step 3 — País (NUEVO v1.3)
  const COUNTRIES = [
    { code: 'CL', flag: '🇨🇱', label: 'Chile',     currency: 'CLP' },
    { code: 'MX', flag: '🇲🇽', label: 'México',    currency: 'MXN' },
    { code: 'AR', flag: '🇦🇷', label: 'Argentina', currency: 'ARS' },
    { code: 'CO', flag: '🇨🇴', label: 'Colombia',  currency: 'COP' },
    { code: 'EC',    flag: '🇪🇨', label: 'Ecuador',        currency: 'USD' },
    { code: 'PE',    flag: '🇵🇪', label: 'Perú',           currency: 'PEN' },
    { code: 'VE',    flag: '🇻🇪', label: 'Venezuela',      currency: 'VES' },
    { code: 'US',    flag: '🇺🇸', label: 'Estados Unidos', currency: 'USD' },
    { code: 'ES',    flag: '🇪🇸', label: 'España',          currency: 'EUR' },
    { code: 'OTHER', flag: '🌎', label: 'Otro',            currency: 'USD' },
  ]
  if (step === 3) return (
    <div style={wrap}><div style={box}>
      <ProgressBar step={3} total={TOTAL} />
      <h2 style={h1s}>¿De qué país sos?</h2>
      <p style={subs}>Activa funciones regionales — podés cambiarlo en Ajustes.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginBottom: 14 }}>
        {COUNTRIES.map(c => (
          <button key={c.code} onClick={() => {
            set('country', c.code)
            set('currency', c.currency)
          }} style={{
            padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
            border: answers.country === c.code ? '1.5px solid var(--grn)' : '0.5px solid var(--brd2)',
            background: answers.country === c.code ? 'var(--grn-bg)' : 'var(--sur2)',
            textAlign: 'center', transition: 'all .15s',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{c.flag}</div>
            <div style={{ fontSize: 11, fontWeight: answers.country === c.code ? 600 : 400, color: answers.country === c.code ? 'var(--grn)' : 'var(--tx)' }}>{c.label}</div>
          </button>
        ))}
      </div>
      {answers.country === 'CL' && (
        <div style={{ padding: '8px 10px', background: 'var(--grn-bg)', borderRadius: 8, border: '0.5px solid rgba(26,163,104,.2)', fontSize: 10, color: 'var(--grn)', fontFamily: 'var(--mono)', marginBottom: 10 }}>
          🇨🇱 Chile: activa el simulador APV / Jubilación en Metas.
        </div>
      )}
      <div style={{ display: 'flex', gap: 7, marginTop: 4 }}>
        <button style={{ ...btnG, width: 'auto', padding: '8px 14px', marginTop: 0 }} onClick={back}>← Atrás</button>
        <button style={{ ...btnP(false), flex: 1, marginTop: 0 }} onClick={next}>Continuar →</button>
      </div>
    </div></div>
  )

  // Step 4 — Configuración básica
  if (step === 4) return (
    <div style={wrap}><div style={box}>
      <ProgressBar step={4} total={TOTAL} />
      <h2 style={h1s}>Configuración básica</h2>
      <p style={subs}>Ajustá la moneda y tu meta de ahorro inicial.</p>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx)', marginBottom: 7 }}>Moneda</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {CURRENCIES.map(c => (
            <button key={c.code} onClick={() => set('currency', c.code)} style={{
              padding: '5px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
              border: answers.currency === c.code ? '1.5px solid var(--grn)' : '0.5px solid var(--brd2)',
              background: answers.currency === c.code ? 'var(--grn-bg)' : 'var(--sur2)',
              color: answers.currency === c.code ? 'var(--grn)' : 'var(--tm)',
              fontFamily: 'var(--mono)', fontWeight: answers.currency === c.code ? 600 : 400,
            }}>{c.flag} {c.code}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx)', marginBottom: 6 }}>
          Meta de ahorro mensual: <span style={{ color: 'var(--grn)' }}>{answers.savingGoal}%</span>
        </div>
        <input type="range" min={5} max={50} step={5} value={answers.savingGoal}
          onChange={e => set('savingGoal', Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--grn)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
          <span>5%</span><span>25% recomendado</span><span>50%</span>
        </div>
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx)', marginBottom: 6 }}>¿Hay deudas activas?</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ id: 'yes', label: 'Sí' }, { id: 'no', label: 'No' }].map(o => (
            <button key={o.id} onClick={() => set('hasDebts', o.id)} style={{
              flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              border: answers.hasDebts === o.id ? '1.5px solid var(--grn)' : '0.5px solid var(--brd2)',
              background: answers.hasDebts === o.id ? 'var(--grn-bg)' : 'var(--sur2)',
              color: answers.hasDebts === o.id ? 'var(--grn)' : 'var(--tm)',
              fontFamily: 'var(--syne, sans-serif)', fontWeight: answers.hasDebts === o.id ? 600 : 400,
            }}>{o.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
        <button style={{ ...btnG, width: 'auto', padding: '8px 14px', marginTop: 0 }} onClick={back}>← Atrás</button>
        <button style={{ ...btnP(false), flex: 1, marginTop: 0 }} onClick={next}>Continuar →</button>
      </div>
    </div></div>
  )

  // Step 5 — Ingreso mensual estimado (nuevo)
  if (step === 5) return (
    <div style={wrap}><div style={box}>
      <ProgressBar step={5} total={TOTAL} />
      <h2 style={h1s}>¿Cuánto ganás aproximadamente este mes?</h2>
      <p style={subs}>Solo para activar tu diagnóstico desde el primer día. Podés cambiarlo cuando quieras en Ajustes.</p>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', marginBottom: 6 }}>
          Ingreso mensual en {answers.currency || 'tu moneda'}
        </div>
        <input
          type="number"
          min="0"
          value={answers.estimatedMonthlyIncome}
          placeholder="ej. 3.000.000"
          onChange={e => set('estimatedMonthlyIncome', e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
            border: '0.5px solid var(--brd2)', background: 'var(--sur2)', color: 'var(--tx)',
            fontFamily: 'var(--mono)', boxSizing: 'border-box',
          }}
          autoFocus
        />
        <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 5, lineHeight: 1.5 }}>
          Aproximado está bien — el sistema lo usa para calcular tu tasa de ahorro y presupuestos sugeridos.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 7 }}>
        <button style={{ ...btnG, width: 'auto', padding: '8px 14px', marginTop: 0 }} onClick={back}>← Atrás</button>
        <button style={{ ...btnP(false), flex: 1, marginTop: 0 }} onClick={next}>Continuar →</button>
      </div>
      <button style={{ ...btnG, fontSize: 10, marginTop: 2 }} onClick={next}>Prefiero no indicarlo ahora →</button>
    </div></div>
  )

  // Step 6 — Objetivo y experiencia
  if (step === 6) return (
    <div style={wrap}><div style={box}>
      <ProgressBar step={6} total={TOTAL} />
      <h2 style={h1s}>Objetivo y experiencia</h2>
      <p style={subs}>Orientativo — podés cambiarlo en cualquier momento.</p>
      {MAIN_GOALS.map(g => <OptionCard key={g.id} {...g} selected={answers.mainGoal === g.id} onClick={() => set('mainGoal', g.id)} />)}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx)', marginTop: 12, marginBottom: 6 }}>Experiencia con finanzas</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {EXPERIENCE_LEVELS.map(e => (
          <button key={e.id} onClick={() => set('experience', e.id)} style={{
            flex: 1, padding: '8px 5px', borderRadius: 8, fontSize: 10, cursor: 'pointer',
            border: answers.experience === e.id ? '1.5px solid var(--grn)' : '0.5px solid var(--brd2)',
            background: answers.experience === e.id ? 'var(--grn-bg)' : 'var(--sur2)',
            color: answers.experience === e.id ? 'var(--grn)' : 'var(--tm)',
            fontFamily: 'var(--syne, sans-serif)', fontWeight: answers.experience === e.id ? 600 : 400,
            textAlign: 'center',
          }}>{e.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
        <button style={{ ...btnG, width: 'auto', padding: '8px 14px', marginTop: 0 }} onClick={back}>← Atrás</button>
        <button style={{ ...btnP(false), flex: 1, marginTop: 0 }} onClick={next}>Ver plantilla recomendada →</button>
      </div>
    </div></div>
  )

  // Step 7 — Plantilla recomendada
  if (step === 7) return (
    <div style={wrap}><div style={box}>
      <ProgressBar step={7} total={TOTAL} />
      <h2 style={h1s}>Plantilla recomendada</h2>
      <p style={subs}>Basado en tus respuestas, esta configuración se adapta mejor.</p>
      <div style={{ padding: '13px', borderRadius: 10, border: `1.5px solid ${activeTemplate.color}`, background: `${activeTemplate.color}08`, marginBottom: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: `${activeTemplate.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: activeTemplate.color, flexShrink: 0 }}>{activeTemplate.icon}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{activeTemplate.name}</div>
            <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{activeTemplate.tagline}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 7px', borderRadius: 20, background: `${activeTemplate.color}18`, color: activeTemplate.color, fontFamily: 'var(--mono)', fontWeight: 600 }}>Recomendada</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[`${activeTemplate.categoriesIncome.length} ingresos`, `${activeTemplate.categoriesExpense.length} gastos`, `${activeTemplate.suggestedBudgets.length} presupuestos`].map(s => (
            <span key={s} style={{ fontSize: 9, fontFamily: 'var(--mono)', padding: '2px 7px', borderRadius: 20, background: 'var(--sur)', color: 'var(--th)', border: '0.5px solid var(--brd)' }}>{s}</span>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx)', marginBottom: 7 }}>O elegí otra:</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
        {TEMPLATES.map(t => (
          <button key={t.id} onClick={() => set('profileId', t.id === answers.profileId ? '' : t.id)} style={{
            padding: '4px 9px', borderRadius: 20, fontSize: 10, cursor: 'pointer',
            border: `0.5px solid ${activeTemplate.id === t.id ? t.color + '60' : 'var(--brd)'}`,
            background: activeTemplate.id === t.id ? `${t.color}14` : 'var(--sur2)',
            color: activeTemplate.id === t.id ? t.color : 'var(--th)',
            fontFamily: 'var(--mono)', fontWeight: activeTemplate.id === t.id ? 600 : 400,
          }}>{t.icon} {t.name}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 7 }}>
        <button style={{ ...btnG, width: 'auto', padding: '8px 14px', marginTop: 0 }} onClick={back}>← Atrás</button>
        <button style={{ ...btnP(false), flex: 1, marginTop: 0 }} onClick={next}>Ver resumen →</button>
      </div>
    </div></div>
  )

  // Step 8 — Resumen y finalizar
  return (
    <div style={wrap}><div style={box}>
      <ProgressBar step={TOTAL} total={TOTAL} />
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, margin: '0 auto 10px', background: 'var(--grn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--grn)' }}>✓</div>
        <h2 style={{ ...h1s, textAlign: 'center' }}>Todo listo</h2>
        <p style={{ ...subs, textAlign: 'center' }}>Tu configuración inicial</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 14 }}>
        {[
          { label: 'País', value: COUNTRIES.find(c => c.code === answers.country)?.label || answers.country },
          { label: 'Moneda', value: CURRENCIES.find(c => c.code === answers.currency)?.label || answers.currency },
          { label: 'Meta de ahorro', value: `${answers.savingGoal}% del ingreso` },
          { label: 'Plantilla activa', value: activeTemplate.name },
          { label: 'Tipo de uso', value: USE_TYPES.find(u => u.id === answers.useType)?.label || '—' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid var(--brd)' }}>
            <span style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{row.label}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx)' }}>{row.value}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '9px 11px', background: '#faeeda', border: '0.5px solid rgba(133,79,11,.2)', borderRadius: 8, fontSize: 10, color: '#854f0b', fontFamily: 'var(--mono)', lineHeight: 1.5, marginBottom: 10 }}>
        ⚠ Creá un respaldo desde Ajustes después de registrar tus primeros datos.
      </div>
      {answers.useType === 'advisor' && (
        <div style={{ padding: '9px 11px', background: 'var(--grn-bg)', border: '0.5px solid rgba(26,163,104,.2)', borderRadius: 8, fontSize: 10, color: 'var(--grn)', fontFamily: 'var(--mono)', lineHeight: 1.5, marginBottom: 10 }}>
          💡 El Modo Asesor está en el sidebar — semáforo, alertas y exportación PDF incluidos.
        </div>
      )}
      <button style={btnP(loading)} onClick={() => finalize()} disabled={loading}>
        {loading ? 'Configurando…' : 'Entrar a FinanceOS →'}
      </button>
      <button style={btnG} onClick={back}>← Atrás</button>
    </div></div>
  )
}
