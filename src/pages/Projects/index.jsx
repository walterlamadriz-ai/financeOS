// src/pages/Projects/index.jsx
// Propiedades / proyectos — flujo NETO por unidad (renta − hipoteca − gastos).
// Agrupa ingresos y egresos que tengan un `project` asignado. NO depende del flag
// de inversión: muestra el panorama económico de cada propiedad/proyecto por separado.

import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, PageHeader, Empty } from '../../components/ui/index.jsx'
import { fmtMoney } from '../../utils/index.js'
import { CURRENCY_SYMBOLS } from '../shared/constants.js'

export default function Projects() {
  const { incomes, expenses, settings } = useApp()
  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'

  const groups = useMemo(() => {
    const map = {}
    const push = (r, kind) => {
      const key = (r?.project || '').trim()
      if (!key) return
      if (!map[key]) map[key] = { name: key, ingresos: 0, egresos: 0, count: 0 }
      const amt = Number(r.amount) || 0
      if (kind === 'inc') map[key].ingresos += amt
      else map[key].egresos += amt
      map[key].count += 1
    }
    ;(incomes || []).forEach(r => push(r, 'inc'))
    ;(expenses || []).forEach(r => push(r, 'exp'))
    return Object.values(map)
      .map(g => ({ ...g, neto: g.ingresos - g.egresos }))
      .sort((a, b) => b.neto - a.neto)
  }, [incomes, expenses])

  const totalNeto = groups.reduce((s, g) => s + g.neto, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader title="Propiedades / proyectos" sub="Flujo neto por unidad (ingresos − egresos) · asigná una propiedad al registrar movimientos" />

      {groups.length === 0 ? (
        <Card>
          <Empty text="Todavía no asignaste ninguna propiedad o proyecto." />
          <div style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.7, marginTop: 8 }}>
            Al registrar un <strong>ingreso</strong> o <strong>egreso</strong>, completá el campo
            <em> "Propiedad / proyecto"</em> (ej. <em>Depto Bogotá</em>). Acá vas a ver el flujo neto de cada uno:
            renta cobrada, hipoteca y gastos, y el resultado del mes.
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                Flujo neto total ({groups.length} {groups.length === 1 ? 'unidad' : 'unidades'})
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: totalNeto >= 0 ? 'var(--grn)' : '#e84142' }}>
                {totalNeto >= 0 ? '+' : ''}{fmtMoney(totalNeto, sym)}
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            {groups.map(g => (
              <Card key={g.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{g.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{g.count} mov.</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  <Row label="Ingresos (renta)" value={`+${fmtMoney(g.ingresos, sym)}`} color="var(--grn)" />
                  <Row label="Egresos (hipoteca, gastos)" value={`-${fmtMoney(g.egresos, sym)}`} color="#e84142" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, borderTop: '.5px solid var(--brd)' }}>
                  <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Flujo neto</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: g.neto >= 0 ? 'var(--grn)' : '#e84142' }}>
                    {g.neto >= 0 ? '+' : ''}{fmtMoney(g.neto, sym)}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, padding: '0 4px' }}>
            Suma histórica de todos los movimientos asignados a cada propiedad/proyecto. Los movimientos marcados como inversión 💼 no afectan tu presupuesto personal, pero sí aparecen acá.
          </div>
        </>
      )}
    </div>
  )
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)', color }}>{value}</span>
    </div>
  )
}
