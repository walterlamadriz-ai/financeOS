// src/components/QuickAdd.jsx
// Captura en un toque: hoja inferior global con monto grande primero, chips de
// las categorías más usadas, y toggle Ingreso/Egreso. Reemplaza el flujo de
// 5 taps (FAB → navegar → Agregar → tipo → formulario de 10 campos).
import { useState, useMemo, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/useT.js'
import config from '../config.js'

const SYM = { CLP:'$', USD:'US$', EUR:'€', VES:'Bs.', MXN:'$', ARS:'$', COP:'$', PEN:'S/', BRL:'R$', UYU:'$U' }
const todayStr = () => new Date().toISOString().slice(0, 10)

export default function QuickAdd({ open, defaultType = 'expense', onClose }) {
  const { addExpense, addIncome, expenses, incomes, settings, showToast } = useApp() || {}
  const { t } = useT()
  const [type, setType] = useState(defaultType)
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('')
  const [saving, setSaving] = useState(false)
  const amountRef = useRef(null)

  const sym = SYM[settings?.currency] || '$'

  // Al abrir: resetea y enfoca el monto
  useEffect(() => {
    if (!open) return
    setType(defaultType); setAmount(''); setDesc(''); setCat(''); setSaving(false)
    const id = setTimeout(() => amountRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [open, defaultType])

  // Categorías más usadas del historial + fallback a las de config
  const chips = useMemo(() => {
    const src = (type === 'expense' ? expenses : incomes) || []
    const counts = {}
    src.slice(-120).forEach(r => { if (r?.category && !r?.inv) counts[r.category] = (counts[r.category] || 0) + 1 })
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(e => e[0])
    const fallback = type === 'expense' ? config.categoriesExpense : config.categoriesIncome
    return [...new Set([...ranked, ...fallback])].slice(0, 6)
  }, [type, expenses, incomes])

  // Fija la primera categoría al abrir / cambiar de tipo
  useEffect(() => { if (open) setCat(c => (chips.includes(c) ? c : chips[0] || '')) }, [open, chips])

  if (!open) return null

  const amt = parseFloat(String(amount).replace(',', '.')) || 0
  const canSave = amt > 0 && !saving
  const accent = type === 'expense' ? 'var(--neg)' : 'var(--pos)'

  async function save() {
    if (!canSave) return
    setSaving(true)
    const base = { description: desc.trim() || cat, amount: amt, date: todayStr(), category: cat || 'Otro' }
    try {
      if (type === 'expense') await addExpense?.({ ...base, subcategory: '', method: 'Débito', type: 'Necesidad', notes: '', project: '' })
      else await addIncome?.({ ...base })
      showToast?.(type === 'expense' ? t('qa.savedExpense') : t('qa.savedIncome'), 'ok')
      onClose?.()
    } catch {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-label={t('qa.title')}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'qaFade .18s ease' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, background: 'var(--sur)', borderTopLeftRadius: 20, borderTopRightRadius: 20,
          borderRadius: window.innerWidth > 520 ? 20 : '20px 20px 0 0',
          marginBottom: window.innerWidth > 520 ? 'auto' : 0, marginTop: window.innerWidth > 520 ? 'auto' : 0,
          padding: `20px 20px calc(20px + env(safe-area-inset-bottom))`, boxShadow: 'var(--sh-3)', animation: 'qaUp .22s cubic-bezier(.22,.61,.36,1)',
        }}
      >
        {/* Asa */}
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--brd2)', margin: '0 auto 16px' }} />

        {/* Toggle tipo */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--sur3)', borderRadius: 10, padding: 4, marginBottom: 18 }}>
          {[['expense', t('qa.expense')], ['income', t('qa.income')]].map(([k, lb]) => (
            <button key={k} type="button" onClick={() => setType(k)}
              style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'var(--sans)',
                background: type === k ? 'var(--sur)' : 'transparent', color: type === k ? (k === 'expense' ? 'var(--neg)' : 'var(--pos)') : 'var(--tm)',
                boxShadow: type === k ? 'var(--sh-1)' : 'none' }}>
              {lb}
            </button>
          ))}
        </div>

        {/* Monto grande */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 700, color: 'var(--th)' }}>{sym}</span>
          <input
            ref={amountRef} type="text" inputMode="decimal" enterKeyHint="done" value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="0"
            aria-label={t('qa.amount')}
            style={{ width: 'auto', minWidth: 60, maxWidth: '70%', border: 'none', background: 'transparent', textAlign: 'center',
              fontFamily: 'var(--display)', fontSize: 44, fontWeight: 700, color: accent, padding: 0, letterSpacing: '-0.02em' }}
          />
        </div>

        {/* Descripción */}
        <input
          type="text" value={desc} onChange={e => setDesc(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder={t('qa.descPh')}
          aria-label={t('qa.desc')}
          style={{ marginBottom: 14, textAlign: 'center' }}
        />

        {/* Chips de categoría */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {chips.map(c => (
            <button key={c} type="button" onClick={() => setCat(c)}
              style={{ padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--sans)', fontWeight: 500,
                border: `1px solid ${cat === c ? accent : 'var(--brd2)'}`,
                background: cat === c ? `color-mix(in srgb, ${accent} 12%, transparent)` : 'var(--sur)',
                color: cat === c ? accent : 'var(--tm)' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Guardar */}
        <button type="button" onClick={save} disabled={!canSave}
          style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: canSave ? 'pointer' : 'not-allowed',
            background: canSave ? accent : 'var(--brd2)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--sans)', opacity: canSave ? 1 : .7, boxShadow: canSave ? 'var(--sh-1)' : 'none' }}>
          {saving ? '…' : t('qa.save')}
        </button>

        <style>{`
          @keyframes qaFade { from { opacity:0 } to { opacity:1 } }
          @keyframes qaUp { from { transform: translateY(14px); opacity:.6 } to { transform: none; opacity:1 } }
          @media (prefers-reduced-motion: reduce) { [role="dialog"] > div { animation: none !important } }
        `}</style>
      </div>
    </div>
  )
}
