// src/components/charts/CategoryDonut.jsx
// Donut de distribución por categoría — reutilizable

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartEmpty } from './ChartCard.jsx'

const COLORS = [
  'var(--accent)',   // verde
  '#00b8d9',        // azul
  '#f5a623',        // amber
  '#ff4d6a',        // rojo
  '#a78bfa',        // violeta
  '#34d399',        // verde claro
  '#fb923c',        // naranja
  '#60a5fa',        // azul claro
]

function CustomTooltip({ active, payload, sym }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{
      background: 'var(--sur2)', border: '.5px solid var(--brd2)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
      fontFamily: 'var(--mono)', boxShadow: '0 4px 16px rgba(0,0,0,.15)',
    }}>
      <div style={{ color: d.payload.fill, fontWeight: 600, marginBottom: 2 }}>{d.name}</div>
      <div style={{ color: 'var(--tx)' }}>{sym}{d.value?.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</div>
      <div style={{ color: 'var(--th)' }}>{d.payload.pct}%</div>
    </div>
  )
}

function CustomLabel({ cx, cy, total, sym }) {
  const display = total >= 1000000
    ? `${sym}${(total/1000000).toFixed(1)}M`
    : total >= 1000
    ? `${sym}${(total/1000).toFixed(0)}K`
    : `${sym}${total}`
  return (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fill: 'var(--tx)', fontSize: 15, fontWeight: 700, fontFamily: 'var(--mono)' }}>
        {display}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" style={{ fill: 'var(--th)', fontSize: 9, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        total
      </text>
    </>
  )
}

export default function CategoryDonut({ records = [], sym = '$', maxCategories = 6, title }) {
  const { data, total } = useMemo(() => {
    const map = {}
    records.forEach(r => {
      const cat = r.category || r.categoría || 'Sin categoría'
      map[cat] = (map[cat] || 0) + (r.amount || 0)
    })

    let sorted = Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)

    const total = sorted.reduce((s, d) => s + d.value, 0)

    if (sorted.length > maxCategories) {
      const top = sorted.slice(0, maxCategories - 1)
      const otros = sorted.slice(maxCategories - 1).reduce((s, d) => s + d.value, 0)
      if (otros > 0) top.push({ name: 'Otros', value: Math.round(otros) })
      sorted = top
    }

    const withPct = sorted.map(d => ({ ...d, pct: total > 0 ? ((d.value / total) * 100).toFixed(1) : '0' }))
    return { data: withPct, total: Math.round(total) }
  }, [records, maxCategories])

  if (!data.length || total === 0) return <ChartEmpty msg="Agrega gastos con categorías para ver la distribución." />

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {/* Donut */}
      <div style={{ flex: '0 0 160px', height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data} dataKey="value" nameKey="name"
              cx="50%" cy="50%" innerRadius={48} outerRadius={72}
              strokeWidth={0} paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ outline: 'none' }}/>
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip sym={sym}/>}/>
          </PieChart>
        </ResponsiveContainer>
        {/* Label central manual — más compatible */}
        <div style={{ marginTop: -100, textAlign: 'center', pointerEvents: 'none', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)', fontFamily: 'var(--mono)' }}>
            {total >= 1000000 ? `${sym}${(total/1000000).toFixed(1)}M` : total >= 1000 ? `${sym}${(total/1000).toFixed(0)}K` : `${sym}${total}`}
          </div>
          <div style={{ fontSize: 9, color: 'var(--th)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.5px' }}>total</div>
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }}/>
            <div style={{ flex: 1, fontSize: 12, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
            <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{d.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
