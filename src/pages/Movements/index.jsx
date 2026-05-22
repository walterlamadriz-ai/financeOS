// src/pages/Movements/index.jsx
// Hub de Movimientos — FinanceOS v1.2

import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'

const fmt  = (n) => (Number(n) || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })

export default function Movements({ setPage }) {
  const ctx      = useApp() || {}
  const incomes  = Array.isArray(ctx.incomes)  ? ctx.incomes  : []
  const expenses = Array.isArray(ctx.expenses) ? ctx.expenses : []
  const settings = (ctx.settings && typeof ctx.settings === 'object') ? ctx.settings : {}
  const subs     = Array.isArray(ctx.subscriptions) ? ctx.subscriptions : []

  const sym         = { CLP:'$', USD:'US$', EUR:'€', VES:'Bs.', MXN:'$', ARS:'$', COP:'$' }[settings.currency] || '$'
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)

  const kpis = useMemo(() => {
    const inc    = incomes.filter(r  => r?.date?.startsWith(activeMonth))
    const exp    = expenses.filter(r => r?.date?.startsWith(activeMonth))
    const totalInc = inc.reduce((s, r)  => s + (Number(r?.amount) || 0), 0)
    const totalExp = exp.reduce((s, r)  => s + (Number(r?.amount) || 0), 0)
    return { totalInc, totalExp, balance: totalInc - totalExp, incCount: inc.length, expCount: exp.length }
  }, [incomes, expenses, activeMonth])

  const activeSubs = subs.filter(s => s?.status === 'active')

  // Último lote importado
  const lastBatch = useMemo(() => {
    try {
      const raw = localStorage.getItem('fos_recent_import')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }, [])

  const CARDS = [
    { id:'income',        ic:'↑', label:'Ingresos',            color:'var(--accent)', desc:`${kpis.incCount} registros este mes` },
    { id:'expenses',      ic:'↓', label:'Gastos',              color:'var(--red)',    desc:`${kpis.expCount} registros este mes` },
    { id:'subscriptions', ic:'↻', label:'Suscripciones',       color:'var(--amb)',    desc:`${activeSubs.length} activas` },
    { id:'import',        ic:'↑', label:'Importar movimientos', color:'var(--accent2, #00b8d9)', desc:'Desde archivo CSV' },
  ]

  return (
    <div style={{ maxWidth:860, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--grn2)', marginBottom:6 }}>Movimientos</div>
        <h1 style={{ fontSize:22, fontWeight:700, color:'var(--tx)', letterSpacing:'-.5px', marginBottom:2 }}>Entradas y salidas</h1>
        <p style={{ fontSize:13, color:'var(--th)', fontFamily:'var(--mono)' }}>// {activeMonth} · datos locales</p>
      </div>

      {/* KPIs del mes */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Ingresos',  value:`${sym}${fmt(kpis.totalInc)}`,  color:'var(--accent)' },
          { label:'Gastos',    value:`${sym}${fmt(kpis.totalExp)}`,  color:'var(--red)' },
          { label:'Balance',   value:`${sym}${fmt(kpis.balance)}`,   color: kpis.balance >= 0 ? 'var(--accent)' : 'var(--red)' },
        ].map((k,i) => (
          <div key={i} style={{ background:'var(--sur)', border:'.5px solid var(--brd)', borderRadius:'var(--r)', padding:'14px 16px' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--th)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:6 }}>{k.label}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:700, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Acceso rápido */}
      <div style={{ fontFamily:'var(--mono)', fontSize:11, letterSpacing:'1px', textTransform:'uppercase', color:'var(--th)', marginBottom:12 }}>Acceso rápido</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }}>
        {CARDS.map((c,i) => (
          <button key={i} onClick={() => setPage?.(c.id)} style={{
            background:'var(--sur)', border:'.5px solid var(--brd)', borderRadius:'var(--r)',
            padding:'18px 20px', cursor:'pointer', textAlign:'left', transition:'.15s',
            display:'flex', alignItems:'flex-start', gap:14,
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = c.color}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--brd)'}
          >
            <span style={{ fontSize:22, color:c.color, flexShrink:0, lineHeight:1, marginTop:2 }}>{c.ic}</span>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--tx)', marginBottom:3 }}>{c.label}</div>
              <div style={{ fontSize:11, color:'var(--th)', fontFamily:'var(--mono)' }}>{c.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Último lote importado */}
      {lastBatch && (
        <div style={{ background:'rgba(0,212,170,.06)', border:'.5px solid rgba(0,212,170,.2)', borderRadius:'var(--r)', padding:'14px 16px', marginBottom:16 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--th)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:8 }}>Última importación CSV</div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {[
              { label:'Archivo',    value: lastBatch.fileName || '—' },
              { label:'Importados', value: lastBatch.importedRows || 0 },
              { label:'Ingresos',   value: `${sym}${fmt(lastBatch.totalIncome)}` },
              { label:'Gastos',     value: `${sym}${fmt(lastBatch.totalExpense)}` },
              { label:'Fecha',      value: lastBatch.importedAt?.slice(0,10) || '—' },
            ].map((d,i) => (
              <div key={i}>
                <div style={{ fontSize:9, color:'var(--th)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:2 }}>{d.label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--tx)', fontFamily:'var(--mono)' }}>{d.value}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setPage?.('import')} style={{ marginTop:10, background:'none', border:'.5px solid rgba(0,212,170,.3)', borderRadius:6, padding:'4px 12px', fontSize:11, color:'var(--accent)', cursor:'pointer', fontFamily:'var(--mono)' }}>
            Importar otro archivo →
          </button>
        </div>
      )}

      <div style={{ fontSize:10, color:'var(--th)', fontFamily:'var(--mono)', lineHeight:1.6 }}>
        Los datos reflejan los registros del mes activo en FinanceOS. No constituyen asesoría financiera, tributaria, legal ni de inversión.
      </div>
    </div>
  )
}
