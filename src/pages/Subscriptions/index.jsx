// src/pages/Subscriptions/index.jsx
// Módulo de suscripciones y gastos recurrentes — FinanceOS v1.4
// Sin backend · Sin scraping · 100% local

import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { dbGetAll, dbAdd, dbDelete } from '../../core/db/index.js'
import { uid } from '../../utils/index.js'

// ── CONSTANTES ─────────────────────────────────────────────────────────────────
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

// ── ALERTAS ORIENTATIVAS ────────────────────────────────────────────────────────
export function generateAlerts(subs, monthlyIncome) {
  const alerts = []
  const active = subs.filter(s => s.status === 'active')
  if (!active.length) return alerts

  // Agrupar por categoría
  const byCat = {}
  active.forEach(s => {
    byCat[s.category] = (byCat[s.category] || [])
    byCat[s.category].push(s)
  })

  // Más de 2 en la misma categoría
  Object.entries(byCat).forEach(([cat, items]) => {
    if (items.length >= 2) {
      alerts.push({
        type: 'duplicate',
        msg: `Tenés ${items.length} suscripciones en "${cat}". Evaluá si todas siguen siendo necesarias.`,
      })
    }
  })

  // Porcentaje del ingreso
  if (monthlyIncome > 0) {
    const totalMonthly = active.reduce((s, sub) => s + toMonthly(sub.amount, sub.frequency), 0)
    const pct = (totalMonthly / monthlyIncome) * 100
    if (pct > 10) {
      alerts.push({
        type: 'income',
        msg: `Tus suscripciones representan el ${pct.toFixed(1)}% de tus ingresos mensuales. Considera revisar si todas se usan realmente.`,
      })
    } else if (pct > 0) {
      alerts.push({
        type: 'info',
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

// ── FORM vacío ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', category: 'Streaming', amount: '', currency: '',
  frequency: 'monthly', nextPaymentDate: '', paymentMethod: '',
  status: 'active', notes: '',
}

// ── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────────
export default function Subscriptions() {
  const { settings, incomes } = useApp()
  const currency = settings.currency || 'CLP'
  const fmt = n => (n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })

  const [subs,    setSubs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [filter,   setFilter]   = useState('all') // all | active | inactive

  // Ingreso mensual estimado del mes activo
  const monthlyIncome = useMemo(() => {
    if (!Array.isArray(incomes)) return 0
    const month = settings.activeMonth || new Date().toISOString().slice(0, 7)
    return incomes
      .filter(r => r.date?.startsWith(month))
      .reduce((s, r) => s + (r.amount || 0), 0)
  }, [incomes, settings.activeMonth])

  // Cargar
  useEffect(() => {
    dbGetAll('subscriptions').then(data => {
      setSubs(data || [])
      setLoading(false)
    })
  }, [])

  // Métricas
  const activeSubs   = subs.filter(s => s.status === 'active')
  const totalMonthly = activeSubs.reduce((s, sub) => s + toMonthly(sub.amount, sub.frequency), 0)
  const totalAnnual  = activeSubs.reduce((s, sub) => s + toAnnual(sub.amount, sub.frequency), 0)
  const mostExpensive = activeSubs.length
    ? activeSubs.reduce((a, b) => toMonthly(a.amount, a.frequency) > toMonthly(b.amount, b.frequency) ? a : b)
    : null
  const nextSub = activeSubs
    .filter(s => s.nextPaymentDate)
    .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate))[0]
  const alerts = useMemo(() => generateAlerts(subs, monthlyIncome), [subs, monthlyIncome])

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
    await dbAdd('subscriptions', item)
    setSubs(prev => editing
      ? prev.map(s => s.id === editing ? item : s)
      : [...prev, item]
    )
    closeForm()
  }

  async function remove(id) {
    if (!confirm('¿Eliminar esta suscripción?')) return
    await dbDelete('subscriptions', id)
    setSubs(prev => prev.filter(s => s.id !== id))
  }

  async function toggleStatus(sub) {
    const updated = { ...sub, status: sub.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString() }
    await dbAdd('subscriptions', updated)
    setSubs(prev => prev.map(s => s.id === updated.id ? updated : s))
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
          Identificá pagos repetidos y calculá su impacto mensual y anual. Las sugerencias son orientativas y no constituyen asesoría financiera.
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-row" style={{ marginBottom: 16 }}>
        {[
          { label: 'Gasto mensual', value: `${currency} ${fmt(totalMonthly)}`, color: 'var(--grn)' },
          { label: 'Gasto anual',   value: `${currency} ${fmt(totalAnnual)}`,  color: 'var(--tx)' },
          { label: 'Activas',       value: activeSubs.length,                  color: 'var(--tx)' },
          { label: 'Más costosa',   value: mostExpensive ? mostExpensive.name : '—', color: 'var(--amb)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.color, fontFamily: 'var(--mono)', letterSpacing: '-.5px' }}>{k.value}</div>
          </div>
        ))}
      </div>

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

      {/* LISTA vacía */}
      {displayed.length === 0 && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--th)', fontSize: 12, fontFamily: 'var(--mono)' }}>
          {subs.length === 0
            ? 'Aún no tenés suscripciones registradas. Agregá tus servicios recurrentes para ver su impacto mensual y anual.'
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
                  const monthly = toMonthly(sub.amount, sub.frequency)
                  const annual  = toAnnual(sub.amount, sub.frequency)
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
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => openEdit(sub)} style={{ background: 'none', border: '.5px solid var(--brd)', borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer', color: 'var(--tm)' }}>Editar</button>
                          <button onClick={() => remove(sub.id)} style={{ background: 'none', border: '.5px solid var(--brd)', borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer', color: 'var(--red)' }}>✕</button>
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

      {/* BARRA DE IMPACTO */}
      {activeSubs.length > 0 && monthlyIncome > 0 && (
        <div style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 8 }}>
            Impacto sobre ingresos del mes — {currency} {fmt(monthlyIncome)} ingreso estimado
          </div>
          <div style={{ height: 6, background: 'var(--sur2)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: Math.min((totalMonthly / monthlyIncome) * 100, 100) + '%', background: totalMonthly / monthlyIncome > 0.1 ? 'var(--amb)' : 'var(--grn)', borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>
            {((totalMonthly / monthlyIncome) * 100).toFixed(1)}% del ingreso mensual · Equivale a {currency} {fmt(totalAnnual)} al año
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--sur)', border: '.5px solid var(--brd)', borderRadius: 12, padding: '22px 20px', width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{editing ? 'Editar suscripción' : 'Nueva suscripción'}</h3>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th)', fontSize: 16 }}>✕</button>
            </div>

            {[
              { label: 'Nombre del servicio *', key: 'name', type: 'text', placeholder: 'ej. Netflix, Spotify, Gimnasio' },
              { label: 'Monto *', key: 'amount', type: 'number', placeholder: '0' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--tx)' }} />
              </div>
            ))}

            {/* Categoría */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', display: 'block', marginBottom: 4 }}>Categoría</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--tx)' }}>
                {SUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Frecuencia */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', display: 'block', marginBottom: 4 }}>Frecuencia de cobro</label>
              <select value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--tx)' }}>
                {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {/* Próximo pago */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', display: 'block', marginBottom: 4 }}>Próximo pago (opcional)</label>
              <input type="date" value={form.nextPaymentDate}
                onChange={e => setForm(p => ({ ...p, nextPaymentDate: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--tx)' }} />
            </div>

            {/* Método de pago y notas */}
            {[
              { label: 'Método de pago (opcional)', key: 'paymentMethod', placeholder: 'ej. Tarjeta Visa, débito' },
              { label: 'Notas (opcional)', key: 'notes', placeholder: 'Observaciones...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type="text" value={form[f.key]} placeholder={f.placeholder}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--tx)' }} />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={closeForm} style={{ flex: 1, padding: '9px', background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', fontSize: 12, cursor: 'pointer', color: 'var(--tm)', fontFamily: 'var(--sans)' }}>Cancelar</button>
              <button onClick={save} disabled={!form.name.trim() || !form.amount} style={{
                flex: 2, padding: '9px', background: 'var(--grn)', border: 'none', borderRadius: 'var(--r)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff', fontFamily: 'var(--sans)',
                opacity: (!form.name.trim() || !form.amount) ? .5 : 1,
              }}>
                {editing ? 'Guardar cambios' : 'Agregar suscripción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
