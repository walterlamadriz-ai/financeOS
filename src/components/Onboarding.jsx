// src/components/Onboarding.jsx
// Pantalla de bienvenida guiada para nuevos usuarios — 3 pasos
// Se muestra solo en el primer uso (settings.onboardingDone !== true)

import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { SEED_INCOMES, SEED_EXPENSES, SEED_BUDGETS, SEED_DEBTS, SEED_GOALS, uid } from '../utils/index.js'
import { dbAdd } from '../core/db/index.js'

const CURRENCIES = [
  { code: 'CLP', label: 'Peso chileno', symbol: '$', flag: '🇨🇱' },
  { code: 'USD', label: 'Dólar',        symbol: 'US$', flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro',         symbol: '€',  flag: '🇪🇺' },
  { code: 'VES', label: 'Bolívar',      symbol: 'Bs.', flag: '🇻🇪' },
  { code: 'MXN', label: 'Peso mexicano', symbol: '$', flag: '🇲🇽' },
  { code: 'ARS', label: 'Peso argentino', symbol: '$', flag: '🇦🇷' },
]

const SAVING_GOALS = [15, 20, 25, 30, 35, 40]

export default function Onboarding({ onComplete }) {
  const { settings, updateSettings } = useApp()
  const [step, setStep]         = useState(0) // 0=welcome, 1=currency, 2=goal, 3=done
  const [currency, setCurrency] = useState(settings.currency || 'CLP')
  const [savingGoal, setSaving] = useState(25)
  const [loading, setLoading]   = useState(false)

  async function loadDemo() {
    setLoading(true)
    try {
      const seeds = {
        incomes:  SEED_INCOMES.map(r  => ({ ...r, id: uid() })),
        expenses: SEED_EXPENSES.map(r => ({ ...r, id: uid() })),
        budgets:  SEED_BUDGETS.map(r  => ({ ...r, id: uid() })),
        debts:    SEED_DEBTS.map(r    => ({ ...r, id: uid() })),
        goals:    SEED_GOALS.map(r    => ({ ...r, id: uid() })),
      }
      await Promise.all([
        ...seeds.incomes.map(r  => dbAdd('incomes',  r)),
        ...seeds.expenses.map(r => dbAdd('expenses', r)),
        ...seeds.budgets.map(r  => dbAdd('budgets',  r)),
        ...seeds.debts.map(r    => dbAdd('debts',    r)),
        ...seeds.goals.map(r    => dbAdd('goals',    r)),
      ])
      await finalize(true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function finalize(withDemo = false) {
    await updateSettings({
      ...settings,
      currency,
      savingGoalPct: savingGoal,
      onboardingDone: true,
      activeMonth: new Date().toISOString().slice(0, 7),
    })
    onComplete(withDemo)
  }

  // ── Shared layout ──────────────────────────────────────────────────────────
  const wrap = {
    position: 'fixed', inset: 0, background: 'var(--bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 999, padding: 20,
  }
  const box = {
    background: 'var(--sur)', border: '0.5px solid var(--brd)',
    borderRadius: 16, padding: '32px 28px', maxWidth: 420, width: '100%',
    boxShadow: '0 24px 60px rgba(0,0,0,0.08)',
  }
  const prog = { display: 'flex', gap: 6, marginBottom: 28, justifyContent: 'center' }
  const progDot = (active, done) => ({
    width: done ? 18 : active ? 24 : 8, height: 8, borderRadius: 20,
    background: done || active ? 'var(--grn)' : 'var(--brd2)',
    transition: 'all .3s',
  })

  // ── STEP 0: Welcome ────────────────────────────────────────────────────────
  if (step === 0) return (
    <div style={wrap}>
      <div style={box}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◈</div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.5px', color: 'var(--tx)', marginBottom: 8 }}>
            Bienvenido a FinanceOS
          </div>
          <div style={{ fontSize: 13, color: 'var(--tm)', lineHeight: 1.6, fontFamily: 'var(--mono)' }}>
            Tus datos se guardan solo en este dispositivo.<br/>
            Sin servidores. Sin cuentas. Sin suscripciones.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => setStep(1)} style={{
            padding: '13px 20px', background: 'var(--grn)', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--sans)',
          }}>
            Empezar configuración →
          </button>
          <button onClick={loadDemo} disabled={loading} style={{
            padding: '12px 20px', background: 'transparent', color: 'var(--tm)',
            border: '0.5px solid var(--brd2)', borderRadius: 8, fontSize: 13,
            cursor: 'pointer', fontFamily: 'var(--sans)',
          }}>
            {loading ? 'Cargando...' : '▶ Explorar con datos demo'}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
          Los datos demo se pueden borrar en Ajustes
        </div>
      </div>
    </div>
  )

  // ── STEP 1: Currency ───────────────────────────────────────────────────────
  if (step === 1) return (
    <div style={wrap}>
      <div style={box}>
        <div style={prog}>
          <div style={progDot(true, false)}/>
          <div style={progDot(false, false)}/>
          <div style={progDot(false, false)}/>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px', marginBottom: 4 }}>¿Con qué moneda trabajas?</div>
          <div style={{ fontSize: 12, color: 'var(--tm)', fontFamily: 'var(--mono)' }}>Paso 1 de 3 — puedes cambiarlo en Ajustes después</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {CURRENCIES.map(c => (
            <button key={c.code} onClick={() => setCurrency(c.code)} style={{
              padding: '11px 14px', borderRadius: 8, border: `0.5px solid ${currency === c.code ? 'var(--grn)' : 'var(--brd2)'}`,
              background: currency === c.code ? 'var(--grn-bg)' : 'var(--sur2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all .15s', fontFamily: 'var(--sans)',
            }}>
              <span style={{ fontSize: 18 }}>{c.flag}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: currency === c.code ? 'var(--grn)' : 'var(--tx)' }}>{c.label}</div>
                <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{c.code} · {c.symbol}</div>
              </div>
              {currency === c.code && <span style={{ color: 'var(--grn)', fontSize: 14 }}>✓</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setStep(2)} style={{
          width: '100%', padding: '12px', background: 'var(--grn)', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--sans)',
        }}>
          Continuar →
        </button>
      </div>
    </div>
  )

  // ── STEP 2: Saving Goal ────────────────────────────────────────────────────
  if (step === 2) return (
    <div style={wrap}>
      <div style={box}>
        <div style={prog}>
          <div style={progDot(false, true)}/>
          <div style={progDot(true, false)}/>
          <div style={progDot(false, false)}/>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px', marginBottom: 4 }}>¿Cuánto quieres ahorrar?</div>
          <div style={{ fontSize: 12, color: 'var(--tm)', fontFamily: 'var(--mono)' }}>Paso 2 de 3 — tu meta mensual de ahorro sobre el ingreso</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {SAVING_GOALS.map(g => (
            <button key={g} onClick={() => setSaving(g)} style={{
              padding: '14px 8px', borderRadius: 8,
              border: `0.5px solid ${savingGoal === g ? 'var(--grn)' : 'var(--brd2)'}`,
              background: savingGoal === g ? 'var(--grn-bg)' : 'var(--sur2)',
              cursor: 'pointer', fontFamily: 'var(--mono)',
              fontSize: 16, fontWeight: 600,
              color: savingGoal === g ? 'var(--grn)' : 'var(--tx)',
              transition: 'all .15s',
            }}>
              {g}%
            </button>
          ))}
        </div>
        <div style={{
          background: 'var(--grn-bg)', borderRadius: 8, padding: '10px 14px',
          fontSize: 12, color: 'var(--grn)', fontFamily: 'var(--mono)',
          marginBottom: 20, lineHeight: 1.5,
        }}>
          {savingGoal < 20
            ? '→ Conservador. Buen punto de partida si empiezas desde cero.'
            : savingGoal <= 25
            ? '→ Recomendado. La regla 50/30/20 sugiere al menos 20%.'
            : savingGoal <= 35
            ? '→ Ambicioso. Excelente para acelerar metas financieras.'
            : '→ Agresivo. Asegúrate de que sea sostenible a largo plazo.'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setStep(1)} style={{
            padding: '12px 16px', background: 'transparent', color: 'var(--tm)',
            border: '0.5px solid var(--brd2)', borderRadius: 8, fontSize: 13,
            cursor: 'pointer', fontFamily: 'var(--sans)',
          }}>← Atrás</button>
          <button onClick={() => setStep(3)} style={{
            flex: 1, padding: '12px', background: 'var(--grn)', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--sans)',
          }}>Continuar →</button>
        </div>
      </div>
    </div>
  )

  // ── STEP 3: Ready ──────────────────────────────────────────────────────────
  if (step === 3) return (
    <div style={wrap}>
      <div style={box}>
        <div style={prog}>
          <div style={progDot(false, true)}/>
          <div style={progDot(false, true)}/>
          <div style={progDot(true, false)}/>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px', marginBottom: 8 }}>¡Todo listo!</div>
          <div style={{ fontSize: 13, color: 'var(--tm)', lineHeight: 1.6, fontFamily: 'var(--mono)' }}>
            Tu configuración está guardada.<br/>
            Empieza registrando tu primer ingreso.
          </div>
        </div>
        <div style={{
          background: 'var(--sur2)', border: '0.5px solid var(--brd)', borderRadius: 8,
          padding: '12px 14px', marginBottom: 24,
        }}>
          {[
            ['Moneda', CURRENCIES.find(c => c.code === currency)?.flag + ' ' + currency],
            ['Meta ahorro', savingGoal + '% del ingreso mensual'],
            ['Almacenamiento', '100% local · solo en este dispositivo'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: k !== 'Almacenamiento' ? '0.5px solid var(--brd)' : 'none', fontSize: 12 }}>
              <span style={{ color: 'var(--tm)', fontFamily: 'var(--mono)' }}>{k}</span>
              <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => finalize(false)} style={{
          width: '100%', padding: '13px', background: 'var(--grn)', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'var(--sans)', letterSpacing: '-0.2px',
        }}>
          Ir al Dashboard →
        </button>
      </div>
    </div>
  )

  return null
}
