// src/components/charts/CategoryDonut.jsx
import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartEmpty } from './ChartCard.jsx'

const COLORS = ['var(--accent)','#00b8d9','#f5a623','#ff4d6a','#a78bfa','#34d399','#fb923c','#60a5fa']

function CustomTooltip({ active, payload, sym }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  if (!d) return null
  return (
    <div style={{ background:'var(--sur2)', border:'.5px solid var(--brd2)', borderRadius:8, padding:'8px 12px', fontSize:12, fontFamily:'var(--mono)' }}>
      <div style={{ color: d.payload?.fill || 'var(--accent)', fontWeight:600, marginBottom:2 }}>{d.name}</div>
      <div style={{ color:'var(--tx)' }}>{sym}{(d.value || 0).toLocaleString('es-CL', { maximumFractionDigits:0 })}</div>
      <div style={{ color:'var(--th)' }}>{d.payload?.pct || 0}%</div>
    </div>
  )
}

export default function CategoryDonut({ records, sym = '$', maxCategories = 6 }) {
  const safeRecords = Array.isArray(records) ? records : []

  const { data, total } = useMemo(() => {
    const map = {}
    safeRecords.forEach(r => {
      if (!r) return
      const cat = r.category || r.categoría || 'Sin categoría'
      map[cat] = (map[cat] || 0) + (Number(r.amount) || 0)
    })

    let sorted = Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)

    const total = sorted.reduce((s, d) => s + d.value, 0)
    if (total === 0) return { data: [], total: 0 }

    if (sorted.length > maxCategories) {
      const top   = sorted.slice(0, maxCategories - 1)
      const otros = sorted.slice(maxCategories - 1).reduce((s, d) => s + d.value, 0)
      if (otros > 0) top.push({ name:'Otros', value: Math.round(otros) })
      sorted = top
    }

    const withPct = sorted.map(d => ({ ...d, pct: ((d.value / total) * 100).toFixed(1) }))
    return { data: withPct, total: Math.round(total) }
  }, [safeRecords, maxCategories])

  if (!data.length || total === 0) return <ChartEmpty msg="Agrega gastos con categorías para ver la distribución." />

  const fmtTotal = total >= 1000000 ? `${sym}${(total/1000000).toFixed(1)}M` : total >= 1000 ? `${sym}${(total/1000).toFixed(0)}K` : `${sym}${total}`

  return (
    <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
      <div style={{ position:'relative', flex:'0 0 auto', width:'48%', minWidth:160, maxWidth:280 }}>
        <ResponsiveContainer width="100%" aspect={1}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={64} outerRadius={96} strokeWidth={0} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ outline:'none' }}/>)}
            </Pie>
            <Tooltip content={<CustomTooltip sym={sym}/>}/>
          </PieChart>
        </ResponsiveContainer>
        {/* Label central */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--tx)', fontFamily:'var(--mono)' }}>{fmtTotal}</div>
          <div style={{ fontSize:9, color:'var(--th)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'.5px' }}>total</div>
        </div>
      </div>
      <div style={{ flex:1, minWidth:140, display:'flex', flexDirection:'column', gap:6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:COLORS[i % COLORS.length], flexShrink:0 }}/>
            <div style={{ flex:1, fontSize:13, color:'var(--tx)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
            <div style={{ fontSize:12, color:'var(--th)', fontFamily:'var(--mono)' }}>{d.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
