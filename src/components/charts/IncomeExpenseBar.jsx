// src/components/charts/IncomeExpenseBar.jsx
// Barras agrupadas: ingresos vs gastos por mes

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ChartEmpty } from './ChartCard.jsx'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// Tooltip personalizado
function CustomTooltip({ active, payload, label, sym }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--sur2)', border: '.5px solid var(--brd2)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
      fontFamily: 'var(--mono)', boxShadow: '0 4px 16px rgba(0,0,0,.15)',
    }}>
      <div style={{ fontWeight: 600, color: 'var(--tx)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {sym}{p.value?.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
        </div>
      ))}
      {payload.length === 2 && (
        <div style={{ color: 'var(--th)', marginTop: 4, borderTop: '.5px solid var(--brd)', paddingTop: 4 }}>
          Neto: {sym}{(payload[0].value - payload[1].value)?.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
        </div>
      )}
    </div>
  )
}

export default function IncomeExpenseBar({ incomes = [], expenses = [], sym = '$', months = 6 }) {
  const data = useMemo(() => {
    const now = new Date()
    const result = []

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yr = d.getFullYear()
      const mo = d.getMonth()
      const key = `${yr}-${String(mo + 1).padStart(2, '0')}`

      const inc = incomes
        .filter(r => r.date?.startsWith(key))
        .reduce((s, r) => s + (r.amount || 0), 0)

      const exp = expenses
        .filter(r => r.date?.startsWith(key))
        .reduce((s, r) => s + (r.amount || 0), 0)

      result.push({ mes: MONTHS[mo], ingresos: Math.round(inc), gastos: Math.round(exp) })
    }
    return result
  }, [incomes, expenses, months])

  const hasData = data.some(d => d.ingresos > 0 || d.gastos > 0)
  if (!hasData) return <ChartEmpty msg="Agrega ingresos y gastos para ver la comparación mensual." />

  const maxVal = Math.max(...data.flatMap(d => [d.ingresos, d.gastos]))
  const yDomain = [0, Math.ceil(maxVal * 1.15)]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={3} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false}/>
        <XAxis dataKey="mes" tick={{ fill: 'var(--th)', fontSize: 11, fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false}/>
        <YAxis domain={yDomain} tick={{ fill: 'var(--th)', fontSize: 10, fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false}
          tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}/>
        <Tooltip content={<CustomTooltip sym={sym}/>} cursor={{ fill: 'rgba(255,255,255,.03)' }}/>
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', paddingTop: 8 }}/>
        <Bar dataKey="ingresos" name="Ingresos" fill="var(--accent)" radius={[3,3,0,0]} maxBarSize={32}/>
        <Bar dataKey="gastos" name="Gastos" fill="var(--red)" radius={[3,3,0,0]} maxBarSize={32}/>
      </BarChart>
    </ResponsiveContainer>
  )
}
