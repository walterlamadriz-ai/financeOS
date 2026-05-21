// src/pages/Subscriptions/index.jsx
// Módulo de suscripciones y gastos recurrentes — FinanceOS v1.4
// Sin backend · Sin scraping · 100% local

import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { dbGetAll, dbAdd, dbDelete } from '../../core/db/index.js'
import { uid } from '../../utils/index.js'
import ChartCard from '../../components/charts/ChartCard.jsx'
import HorizontalBars from '../../components/charts/HorizontalBars.jsx'
import CategoryDonut from '../../components/charts/CategoryDonut.jsx'

// ── CONSTANTES ──────────────────────────────────────────────────────────────────
export const SUB_CATEGORIES = [
  'Streaming', 'Música', 'Productividad', 'Almacenamiento',
  'Software', 'Educación', 'Salud / Gimnasio', 'Seguros',
  'Telefonía / Internet', 'Otros',
]

export const FREQ_LABELS = {
  weekly:    'Semanal',
  monthly:   'Mensual',
  quarterly: 'Trimestral',
  annual:    'Anual',
}

// ── CÁLCULOS ────────────────────────────────────────────────────────────────────
export function toMonthly(amount, frequency) {
  switch (frequency) {
    case 'weekly':    return amount * 4.33
    case 'monthly':   return amount
    case 'quarterly': return amount / 3
    case 'annual':    return amount / 12
    default:          return amount
  }
}

export function toAnnual(amount, frequency) {
  switch (frequency) {
    case 'weekly':    return amount * 52
    case 'monthly':   return amount * 12
    case 'quarterly': return amount * 4
    case 'annual':    return amount
    default:          return amount * 12
  }
}

export function generateAlerts(subs, monthlyIncome) {
  const alerts = []
  const active = Array.isArray(subs) ? subs.filter(s => s.status === 'active') : []

  // Duplicados por categoría
  const byCat = {}
  active.forEach(s => {
    byCat[s.category] = (byCat[s.category] || [])
    byCat[s.category].push(s)
  })
  Object.entries(byCat).forEach(([cat, items]) => {
    if (items.length >= 2) {
      alerts.push({
        type: 'duplicate',
        msg: `Tienes ${items.length} suscripciones en "${cat}". Revisa si todas son necesarias.`,
      })
    }
  })

  // % del ingreso
  if (monthlyIncome > 0) {
    const totalMonthly = active.reduce((s, sub) => s + toMonthly(sub.amount, sub.frequency), 0)
    const pct = (totalMonthly / monthlyIncome) * 100
    if (pct > 15) {
      alerts.push({
        type: 'income',
        msg: `Tus suscripciones representan el ${pct.toFixed(1)}% de tus ingresos mensuales.`,
      })
    }
  }

  // Sin fecha de próximo pago
  const noDate = active.filter(s => !s.nextPaymentDate)
  if (noDate.length > 0) {
    alerts.push({
      type: 'missing',
      msg: `${noDate.length} suscripción${noDate.length > 1 ? 'es' : ''} sin fecha de próximo pago registrada.`,
    })
  }

  // Próximo pago en los próximos 7 días
  const today = new Date()
  const in7   = new Date(today); in7.setDate(today.getDate() + 7)
  const upcoming = active.filter(s => {
    if (!s.nextPaymentDate) return false
    const d = new Date(s.nextPaymentDate)
    return d >= today && d <= in7
  })
  upcoming.forEach(s => {
    alerts.push({
      type: 'upcoming',
      msg: `"${s.name}" tiene un pago próximo el ${new Date(s.nextPaymentDate).toLocaleDateString('es-CL')}.`,
    })
  })

  return alerts
}

// ── FORM vacío ──────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', category: 'Streaming', amount: '', currency: '',
  frequency: 'monthly', nextPaymentDate: '', paymentMethod: '',
  status: 'active', notes: '',
}

// ── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────────
export default function Subscriptions() {
  const { settings, incomes, subscriptions: ctxSubs } = useApp()
  const currency = settings.currency || 'CLP'
  const fmt = n => (n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })
  const isDemo = !!settings.isDemo

  const [dbSubs,   setDbSubs]  = useState([])
  const [loading,  setLoading] = useState(!isDemo)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [filter,   setFilter]   = useState('all')

  const subs = isDemo ? (ctxSubs || []) : dbSubs

  const monthlyIncome = useMemo(() => {
    if (!Array.isArray(incomes)) return 0
    const month = settings.activeMonth || new Date().toISOString().slice(0, 7)
    return incomes
      .filter(r => r.date?.startsWith(month))
      .reduce((s, r) => s + (r.amount || 0), 0)
  }, [incomes, settings.activeMonth])

  useEffect(() => {
    if (isDemo) return
    dbGetAll('subscriptions').then(data => {
      setDbSubs(data || [])
      setLoading(false)
    })
  }, [isDemo])

  const activeSubs    = subs.filter(s => s.status === 'active')
  const totalMonthly  = activeSubs.reduce((s, sub) => s + toMonthly(sub.amount, sub.frequency), 0)
  const totalAnnual   = activeSubs.reduce((s, sub) => s + toAnnual(sub.amount, sub.frequency), 0)
  const mostExpensive = activeSubs.length
    ? activeSubs.reduce((a, b) => toMonthly(a.amount, a.frequency) > toMonthly(b.amount, b.frequency) ? a : b)
    : null
  const nextSub = activeSubs
    .filter(s => s.nextPaymentDate)
    .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate))[0]
  const alerts = useMemo(() => generateAlerts(subs, monthlyIncome), [subs, monthlyIncome])

  // Datos para gráficos
  const topRecords = useMemo(() =>
    activeSubs.map(s => ({
      category: s.name,
      amount: toMonthly(s.amount, s.frequency),
    })),
    [activeSubs]
  )

  const catRecords = useMemo(() =>
    activeSubs.map(s => ({
      category: s.category || 'Sin categoría',
      amount: toMonthly(s.amount, s.frequency),
    })),
    [activeSubs]
  )

  // CRUD
  async function save() {
    if (!form.name.trim() || !form.amount) return
    const now  = new Date().toISOString()
    const item = {
      ...form,
      id:        editing || uid(),
      amount:    parseFloat(form.amount) || 0,
      currency:  form.currency || currency,
      createdAt: editing ? (subs.find(s => s.id === editing)?.createdAt || now) : now,
      updatedAt: now,
    }
    if (!isDemo) await dbAdd('subscriptions', item)
    setDbSubs(prev => editing
      ? prev.map(s => s.id === editing ? item : s)
      : [...prev, item]
    )
    closeForm()
  }

  async function remove(id) {
    if (!confirm('¿Eliminar esta suscripción?')) return
    if (!isDemo) await dbDelete('subscriptions', id)
    setDbSubs(prev => prev.filter(s => s.id !== id))
  }

  async function toggleStatus(sub) {
    const updated = { ...sub, status: sub.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString() }
    if (!isDemo) await dbAdd('subscriptions', updated)
    setDbSubs(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  function openEdit(sub) {
    setEditing(sub.id)
    setForm({ ...sub, amount: String(sub.amount) })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const displayed = filter === 'all' ? subs
    : filter === 'active' ? activeSubs
    : subs.filter(s => s.status === 'inactive')

  if (loading) return <div style={{ padding: 24, color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 12 }}>Cargando...</div>

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.3px', color: 'var(--tx)', marginBottom: 3 }}>
          Suscripciones y gastos recurrentes
        </h2>
        <p style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)' }}>
          Identifica pagos repetidos y calcula su impacto mensual y anual. Las sugerencias son orientativas y no constituyen asesoría financiera.
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-row" style={{ marginBottom: 16 }}>
        {[
          { label: 'Gasto mensual', value: `${currency} ${fmt(totalMonthly)}`,  color: 'var(--grn)' },
          { label: 'Gasto anual',   value: `${currency} ${fmt(totalAnnual)}`,   color: 'var(--tx)' },
          { label: 'Activas',       value: activeSubs.length,                   color: 'var(--tx)' },
          { label: 'Más costosa',   value: mostExpensive ? mostExpensive.name : '—', color: 'var(--amb)' },
          { label: 'Próximo pago',  value: nextSub ? new Date(nextSub.nextPaymentDate).toLocaleDateString('es-CL') : '—', color: 'var(--tx)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: k.color, fontFamily: 'var(--mono)', letterSpacing: '-.5px' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* VISUAL INSIGHTS */}
      {activeSubs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <ChartCard title="Top suscripciones por costo mensual" minHeight={160}>
            <HorizontalBars records={topRecords} sym={`${currency} `} maxItems={6} />
          </ChartCard>
          <ChartCard title="Distribución por categoría" minHeight={160}>
            <CategoryDonut records={catRecords} sym={`${currency} `} maxCategories={6} />
          </ChartCard>
        </div>
      )}

      {/* ALERTAS */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              padding: '9px 12px', borderRadius: 'var(--r)', fontSize: 11,
              fontFamily: 'var(--mono)', lineHeight: 1.5,
              background: a.type === 'duplicate' ? 'var(--amb-bg)' : a.type === 'upcoming' ? 'var(--grn-bg)' : 'var(--sur2)',
              border: `.5px solid ${a.type === 'duplicate' ? 'var(--amb)' : a.type === 'upcoming' ? 'var(--grn)' : 'var(--brd)'}`,
              color: a.type === 'duplicate' ? 'var(--amb)' : a.type === 'upcoming' ? 'var(--grn)' : 'var(--tm)',
            }}>
              {a.type === 'duplicate' ? '⚠ ' : a.type === 'upcoming' ? '📅 ' : 'ℹ '}{a.msg}
            </div>
          ))}
        </div>
      )}

      {/* ACCIONES */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setShowForm(true)} style={{
          background: 'var(--grn)', color: '#fff', border: 'none', borderRadius: 'var(--r)',
          padding: '7px 14px', fontSize: 12, fontFamily: 'var(--sans)', fontWeight: 600, cursor: 'pointer',
        }}>+ Agregar suscripción</button>
        {['all', 'active', 'inactive'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? 'var(--sur2)' : 'transparent',
            border: `.5px solid ${filter === f ? 'var(--brd2)' : 'var(--brd)'}`,
            borderRadius: 'var(--r)', padding: '6px 12px', fontSize: 11,
            fontFamily: 'var(--mono)', cursor: 'pointer', color: filter === f ? 'var(--tx)' : 'var(--tm)',
          }}>{f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Inactivas'}</button>
        ))}
      </div>

      {/* FORM */}
      {showForm && (
        <div style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 12 }}>
            {editing ? 'Editar suscripción' : 'Nueva suscripción'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {[
              { label: 'Nombre', key: 'name', type: 'text', placeholder: 'Netflix, Spotify…' },
              { label: 'Monto', key: 'amount', type: 'number', placeholder: '0' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{label}</div>
                <input type={type} value={form[key]} placeholder={placeholder}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width: '100%', background: 'var(--sur2)', border: '.5px solid var(--brd2)', borderRadius: 6, padding: '7px 10px', color: 'var(--tx)', fontSize: 13, fontFamily: 'var(--mono)' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Categoría</div>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', background: 'var(--sur2)', border: '.5px solid var(--brd2)', borderRadius: 6, padding: '7px 10px', color: 'var(--tx)', fontSize: 13, fontFamily: 'var(--mono)' }}>
                {SUB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Frecuencia</div>
              <select value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                style={{ width: '100%', background: 'var(--sur2)', border: '.5px solid var(--brd2)', borderRadius: 6, padding: '7px 10px', color: 'var(--tx)', fontSize: 13, fontFamily: 'var(--mono)' }}>
                {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Próximo pago</div>
              <input type="date" value={form.nextPaymentDate} onChange={e => setForm(p => ({ ...p, nextPaymentDate: e.target.value }))}
                style={{ width: '100%', background: 'var(--sur2)', border: '.5px solid var(--brd2)', borderRadius: 6, padding: '7px 10px', color: 'var(--tx)', fontSize: 13, fontFamily: 'var(--mono)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} style={{ background: 'var(--grn)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {editing ? 'Guardar cambios' : '+ Registrar'}
            </button>
            <button onClick={closeForm} style={{ background: 'var(--sur2)', color: 'var(--tx)', border: '.5px solid var(--brd2)', borderRadius: 'var(--r)', padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* LISTA vacía */}
      {displayed.length === 0 && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--th)', fontSize: 12, fontFamily: 'var(--mono)' }}>
          {subs.length === 0
            ? 'Aún no tienes suscripciones registradas. Agrega tus servicios recurrentes para ver su impacto mensual y anual.'
            : 'No hay suscripciones en esta categoría.'}
        </div>
      )}

      {/* TABLA */}
      {displayed.length > 0 && (
        <div style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--sur2)', borderBottom: '.5px solid var(--brd)' }}>
                  {['Servicio', 'Categoría', '/mes', '/año', 'Frecuencia', 'Próx. pago', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.8px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((sub, i) => {
                  const monthly  = toMonthly(sub.amount, sub.frequency)
                  const annual   = toAnnual(sub.amount, sub.frequency)
                  const isActive = sub.status === 'active'
                  return (
                    <tr key={sub.id} style={{ borderBottom: i < displayed.length - 1 ? '.5px solid var(--brd)' : 'none', opacity: isActive ? 1 : 0.5 }}>
                      <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>{sub.name}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontSize: 10, fontFamily: 'var(--mono)', background: 'var(--sur2)', padding: '2px 7px', borderRadius: 20, color: 'var(--tm)', border: '.5px solid var(--brd)' }}>{sub.category}</span>
                      </td>
                      <td style={{ padding: '9px 12px', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--tx)' }}>{(sub.currency || currency)} {fmt(monthly)}</td>
                      <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>{(sub.currency || currency)} {fmt(annual)}</td>
                      <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>{FREQ_LABELS[sub.frequency] || sub.frequency}</td>
                      <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', whiteSpace: 'nowrap' }}>
                        {sub.nextPaymentDate ? new Date(sub.nextPaymentDate).toLocaleDateString('es-CL') : '—'}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <button onClick={() => toggleStatus(sub)} style={{
                          fontSize: 10, fontFamily: 'var(--mono)', padding: '2px 8px', borderRadius: 20, cursor: 'pointer',
                          background: isActive ? 'var(--grn-bg)' : 'var(--sur2)',
                          color: isActive ? 'var(--grn)' : 'var(--th)',
                          border: `.5px solid ${isActive ? 'var(--grn)' : 'var(--brd)'}`,
                        }}>{isActive ? 'Activa' : 'Inactiva'}</button>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openEdit(sub)} style={{ background: 'none', border: 'none', color: 'var(--th)', fontSize: 11, cursor: 'pointer' }}>✎</button>
                          <button onClick={() => remove(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--th)', fontSize: 11, cursor: 'pointer' }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
        Las visualizaciones muestran el costo mensual equivalente de cada suscripción. No constituyen asesoría financiera, tributaria, legal ni de inversión.
      </div>
    </div>
  )
}
