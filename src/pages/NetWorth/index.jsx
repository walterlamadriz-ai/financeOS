// src/pages/NetWorth/index.jsx
// Patrimonio neto — vista consolidada de lo que ya registrás en la app:
// activos (ahorro en metas + flujo neto de propiedades) menos pasivos (deudas).
// No agrega datos nuevos: reutiliza Goals, Debts y Projects tal cual existen.

import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, PageHeader, Empty } from '../../components/ui/index.jsx'
import { fmtMoney } from '../../utils/index.js'
import { CURRENCY_SYMBOLS } from '../shared/constants.js'

export default function NetWorth() {
  const { goals, debts, incomes, expenses, settings } = useApp()
  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'

  const savedInGoals = useMemo(() => (goals || []).reduce((s, g) => s + (Number(g.saved) || 0), 0), [goals])
  const pendingDebt  = useMemo(() => (debts || []).reduce((s, d) => s + (Number(d.balance) || 0), 0), [debts])

  // Flujo neto acumulado de propiedades/proyectos (mismo cálculo que la página Propiedades)
  const propertiesNet = useMemo(() => {
    const map = {}
    const push = (r, kind) => {
      const key = (r?.project || '').trim()
      if (!key) return
      const amt = Number(r.amount) || 0
      map[key] = (map[key] || 0) + (kind === 'inc' ? amt : -amt)
    }
    ;(incomes || []).forEach(r => push(r, 'inc'))
    ;(expenses || []).forEach(r => push(r, 'exp'))
    return Object.values(map).reduce((s, n) => s + n, 0)
  }, [incomes, expenses])

  const totalActivos = savedInGoals + Math.max(0, propertiesNet)
  const totalPasivos = pendingDebt + Math.max(0, -propertiesNet)
  const netWorth = totalActivos - totalPasivos

  const hasData = (goals?.length || 0) > 0 || (debts?.length || 0) > 0 || propertiesNet !== 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader title="Patrimonio neto" sub="Lo que ahorraste y generaste, menos lo que debés — según lo que registrás en la app" />

      {!hasData ? (
        <Card>
          <Empty text="Todavía no hay datos para calcular tu patrimonio." />
          <div style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.7, marginTop: 8 }}>
            Se arma solo con lo que ya usás: <strong>ahorro en Metas</strong>, <strong>Deudas</strong> registradas
            y el <strong>flujo neto de Propiedades</strong>. Agregá algo en esas secciones y volvé acá.
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
                Patrimonio neto
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--mono)', color: netWorth >= 0 ? 'var(--grn)' : '#e84142' }}>
                {netWorth >= 0 ? '' : '-'}{fmtMoney(Math.abs(netWorth), sym)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 4 }}>
                Activos {fmtMoney(totalActivos, sym)} − Pasivos {fmtMoney(totalPasivos, sym)}
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            <Card>
              <CardHeader title="💰 Activos" />
              <Row label="Ahorro en Metas" value={savedInGoals} sym={sym} color="var(--grn)" />
              <Row label="Propiedades (flujo neto positivo)" value={Math.max(0, propertiesNet)} sym={sym} color="var(--grn)" />
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTop: '.5px solid var(--brd)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>Total activos</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--grn)' }}>{fmtMoney(totalActivos, sym)}</span>
              </div>
            </Card>

            <Card>
              <CardHeader title="📉 Pasivos" />
              <Row label="Deudas pendientes" value={pendingDebt} sym={sym} color="#e84142" />
              <Row label="Propiedades (flujo neto negativo)" value={Math.max(0, -propertiesNet)} sym={sym} color="#e84142" />
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTop: '.5px solid var(--brd)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>Total pasivos</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: '#e84142' }}>{fmtMoney(totalPasivos, sym)}</span>
              </div>
            </Card>
          </div>

          <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, padding: '0 4px' }}>
            Orientativo — se calcula solo con lo que registrás en FinanceOS (Metas, Deudas, Propiedades). No incluye saldos bancarios, inversiones externas ni otros activos que no hayas cargado en la app.
          </div>
        </>
      )}
    </div>
  )
}

function Row({ label, value, sym, color }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0' }}>
      <span style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', color }}>{fmtMoney(value, sym)}</span>
    </div>
  )
}
