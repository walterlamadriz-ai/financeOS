// src/pages/NetWorth/index.jsx
// Patrimonio neto — vista consolidada de lo que ya registrás en la app:
// activos (ahorro en metas + flujo neto de propiedades) menos pasivos (deudas).
// No agrega datos nuevos: reutiliza Goals, Debts y Projects tal cual existen.

import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useT } from '../../i18n/useT.js'
import { Card, CardHeader, PageHeader, Empty } from '../../components/ui/index.jsx'
import { fmtMoney } from '../../utils/index.js'
import { CURRENCY_SYMBOLS } from '../shared/constants.js'

export default function NetWorth() {
  const { goals, debts, incomes, expenses, settings } = useApp()
  const { t } = useT()
  const sym = CURRENCY_SYMBOLS[settings.currency] || '$'

  const savedInGoals = useMemo(() => (goals || []).reduce((s, g) => s + (Number(g.saved) || 0), 0), [goals])
  const pendingDebt  = useMemo(() => (debts || []).reduce((s, d) => s + (Number(d.balance) || 0), 0), [debts])

  // Valor estimado por propiedad (se declara en la página Propiedades). Las propiedades
  // CON valor declarado entran como activo por su valor (stock) y su hipoteca ya está en
  // Deudas (pasivo). Las que NO tienen valor declarado siguen entrando por su flujo neto.
  const propertyValues = settings.propertyValues || {}
  const propsValueTotal = useMemo(
    () => Object.values(propertyValues).reduce((s, v) => s + (Number(v) || 0), 0),
    [propertyValues]
  )

  // Flujo neto acumulado SOLO de propiedades sin valor declarado (mismo cálculo que Propiedades)
  const valuedNames = useMemo(
    () => new Set(Object.keys(propertyValues).filter(k => Number(propertyValues[k]) > 0).map(k => k.trim().toLowerCase())),
    [propertyValues]
  )
  const propertiesNet = useMemo(() => {
    const map = {}
    const push = (r, kind) => {
      const key = (r?.project || '').trim()
      if (!key) return
      if (valuedNames.has(key.toLowerCase())) return // ya cuenta por valor, no por flujo
      const amt = Number(r.amount) || 0
      map[key] = (map[key] || 0) + (kind === 'inc' ? amt : -amt)
    }
    ;(incomes || []).forEach(r => push(r, 'inc'))
    ;(expenses || []).forEach(r => push(r, 'exp'))
    return Object.values(map).reduce((s, n) => s + n, 0)
  }, [incomes, expenses, valuedNames])

  const totalActivos = savedInGoals + propsValueTotal + Math.max(0, propertiesNet)
  const totalPasivos = pendingDebt + Math.max(0, -propertiesNet)
  const netWorth = totalActivos - totalPasivos

  const hasData = (goals?.length || 0) > 0 || (debts?.length || 0) > 0 || propertiesNet !== 0 || propsValueTotal > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PageHeader title={t('networth.title')} sub={t('networth.sub')} />

      {!hasData ? (
        <Card>
          <Empty text={t('networth.empty')} />
          <div style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.7, marginTop: 8 }}>
            {t('networth.emptyHint')}
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
                {t('networth.headline')}
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--mono)', color: netWorth >= 0 ? 'var(--grn)' : '#e84142' }}>
                {netWorth >= 0 ? '' : '-'}{fmtMoney(Math.abs(netWorth), sym)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: 4 }}>
                {t('networth.formula', { a: fmtMoney(totalActivos, sym), p: fmtMoney(totalPasivos, sym) })}
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            <Card>
              <CardHeader title={t('networth.assets')} />
              <Row label={t('networth.savedInGoals')} value={savedInGoals} sym={sym} color="var(--grn)" />
              <Row label={t('networth.propsValue')} value={propsValueTotal} sym={sym} color="var(--grn)" />
              <Row label={t('networth.propsPositive')} value={Math.max(0, propertiesNet)} sym={sym} color="var(--grn)" />
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTop: '.5px solid var(--brd)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>{t('networth.totalAssets')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--grn)' }}>{fmtMoney(totalActivos, sym)}</span>
              </div>
            </Card>

            <Card>
              <CardHeader title={t('networth.liabilities')} />
              <Row label={t('networth.pendingDebts')} value={pendingDebt} sym={sym} color="#e84142" />
              <Row label={t('networth.propsNegative')} value={Math.max(0, -propertiesNet)} sym={sym} color="#e84142" />
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTop: '.5px solid var(--brd)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>{t('networth.totalLiabilities')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: '#e84142' }}>{fmtMoney(totalPasivos, sym)}</span>
              </div>
            </Card>
          </div>

          <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, padding: '0 4px' }}>
            {t('networth.disclaimer')}{propsValueTotal > 0 ? ' ' + t('networth.propsValueNote') : ''}
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
