// src/pages/Steuer/index.jsx
// Módulo Alemania — herramienta fiscal exclusiva (mismo patrón que APV Chile).
// Solo visible si settings.country === 'DE'. Dos calculadoras:
// 1) Lohnabzüge: bruto → neto (Sozialversicherung + Lohnsteuer + Soli + Kirchensteuer)
// 2) Werbungskosten: gastos deducibles vs Pauschbetrag automático
//
// Todo el texto pasa por i18n. Las etiquetas de config (deducciones/de.js) también
// se resuelven vía t() usando claves 'steuer.werbungskosten.cat.<key>'.

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useT } from '../../i18n/useT.js'
import { Card, CardHeader, FormRow, FormGroup, ProgressBar, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { calcDescuentosDE, BUNDESLAENDER } from '../../utils/taxCalcDE.js'
import { getDeduccionesConfig, autofillGastos } from '../../utils/deduccionesEngine.js'

const fmtEUR = (n) => `€${(Number(n) || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}`

export default function Steuer() {
  const { settings, expenses } = useApp()
  const { t } = useT()
  const country = (settings.country || 'CL').toUpperCase()

  if (country !== 'DE') {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        {t('steuer.onlyDE')}
      </div>
    )
  }

  return (
    <ProGate feature={t('steuer.proFeature')}>
      <div className="stack">
        <PageHeader title={t('steuer.title')} sub={t('steuer.sub')} />
        <Alert type="info">⚠ {t('steuer.disclaimer')}</Alert>
        <LohnabzuegeCard />
        <WerbungskostenCard expenses={expenses} settings={settings} />
      </div>
    </ProGate>
  )
}

function LohnabzuegeCard() {
  const { t } = useT()
  const [brutto, setBrutto] = useState('')
  const [kirche, setKirche] = useState(false)
  const [bundesland, setBundesland] = useState('NW')

  const result = useMemo(() => {
    const b = Number(brutto) || 0
    if (b <= 0) return null
    return calcDescuentosDE(b, { kirchensteuerpflichtig: kirche, bundesland })
  }, [brutto, kirche, bundesland])

  return (
    <Card>
      <CardHeader title={t('steuer.lohn.title')} />
      <FormRow>
        <FormGroup label={t('steuer.lohn.brutto')}>
          <input type="number" inputMode="decimal" min="0" value={brutto} placeholder="0"
            onChange={e => setBrutto(e.target.value)} />
        </FormGroup>
        <FormGroup label={t('steuer.lohn.bundesland')}>
          <select value={bundesland} onChange={e => setBundesland(e.target.value)}>
            {BUNDESLAENDER.map(bl => <option key={bl.code} value={bl.code}>{bl.label}</option>)}
          </select>
        </FormGroup>
      </FormRow>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tx)', margin: '4px 0 12px', cursor: 'pointer' }}>
        <input type="checkbox" checked={kirche} onChange={e => setKirche(e.target.checked)} style={{ width: 16, height: 16, flexShrink: 0 }} />
        {t('steuer.lohn.kircheLabel')}
      </label>

      {result && (
        <>
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
              {fmtEUR(result.netto)}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
              {t('steuer.lohn.nettoSub', { pct: Math.round(result.tasaEfectiva * 100) })}
            </div>
          </div>

          <div style={{ marginTop: 4, borderTop: '.5px solid var(--brd)', paddingTop: 12 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
              {t('steuer.lohn.sozialTitle')}
            </div>
            {[
              [t('steuer.lohn.rente'), result.sozialversicherung.rentenversicherung],
              [t('steuer.lohn.kv'), result.sozialversicherung.krankenversicherung],
              [t('steuer.lohn.alv'), result.sozialversicherung.arbeitslosenversicherung],
              [t('steuer.lohn.pv'), result.sozialversicherung.pflegeversicherung],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--tx)' }}>
                <span>{label}</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(val)}</span>
              </div>
            ))}

            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '12px 0 8px' }}>
              {t('steuer.lohn.taxesTitle')}
            </div>
            {[
              [t('steuer.lohn.lohnsteuer'), result.lohnsteuer],
              [t('steuer.lohn.soli'), result.soli],
              ...(result.kirchensteuer > 0 ? [[t('steuer.lohn.kirche'), result.kirchensteuer]] : []),
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--tx)' }}>
                <span>{label}</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(val)}</span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, padding: '8px 0 0', marginTop: 8, borderTop: '.5px solid var(--brd)', color: 'var(--tx)' }}>
              <span>{t('steuer.lohn.totalAbzuege')}</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.totalAbzuege)}</span>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

function WerbungskostenCard({ expenses, settings }) {
  const { t } = useT()
  const config = getDeduccionesConfig('DE')
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const year = activeMonth.slice(0, 4)

  // Autofill gastos desde registros del año actual
  const autofilled = useMemo(() => autofillGastos(config, expenses, year), [config, expenses, year])
  const [gastos, setGastos] = useState(autofilled)
  const [ingreso, setIngreso] = useState('')

  function setGasto(key, val) {
    setGastos(p => ({ ...p, [key]: val === '' ? 0 : Number(val) }))
  }

  // Recalculamos aquí en vez de en el config para poder usar i18n en textos.
  const result = useMemo(() => {
    const homeofficeCap = Math.min(Number(gastos.homeoffice) || 0, 1260)
    const totalGastos =
      (Number(gastos.pendler) || 0) +
      homeofficeCap +
      (Number(gastos.fortbildung) || 0) +
      (Number(gastos.arbeitsmittel) || 0) +
      (Number(gastos.bewerbung) || 0)
    const PAUSCH = 1230
    const superaPauschale = totalGastos > PAUSCH
    const excedente = Math.max(0, totalGastos - PAUSCH)
    const ing = Number(ingreso) || 0
    let tasa
    if (ing <= 20000) tasa = 0.14
    else if (ing <= 40000) tasa = 0.24
    else if (ing <= 62800) tasa = 0.30
    else if (ing <= 100000) tasa = 0.35
    else if (ing <= 277825) tasa = 0.42
    else tasa = 0.45
    return {
      ahorro: Math.round(excedente * tasa),
      pausch: PAUSCH,
      totalGastos: Math.round(totalGastos),
      topePct: totalGastos > 0 ? Math.min(100, (totalGastos / PAUSCH) * 100) : 0,
      superaPauschale,
      tasa,
      desglose: [
        { key: 'pendler', monto: Math.round(Number(gastos.pendler) || 0) },
        { key: 'homeoffice', monto: Math.round(homeofficeCap) },
        { key: 'fortbildung', monto: Math.round(Number(gastos.fortbildung) || 0) },
        { key: 'arbeitsmittel', monto: Math.round(Number(gastos.arbeitsmittel) || 0) },
        { key: 'bewerbung', monto: Math.round(Number(gastos.bewerbung) || 0) },
      ],
    }
  }, [gastos, ingreso])

  return (
    <Card>
      <CardHeader title={t('steuer.werb.title')} right={<span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>{year}</span>} />
      <div style={{ fontSize: 12, color: 'var(--tm)', lineHeight: 1.6, marginBottom: 14 }}>{t('steuer.werb.sub')}</div>

      <FormRow>
        <FormGroup label={t('steuer.werb.ingresoLabel')}>
          <input type="number" inputMode="decimal" min="0" value={ingreso} placeholder="0"
            onChange={e => setIngreso(e.target.value)} />
        </FormGroup>
      </FormRow>

      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '12px 0 8px' }}>
        {t('steuer.werb.gastosLabel')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {config.categorias.map(c => (
          <FormGroup key={c.key} label={t('steuer.werb.cat.' + c.key)}>
            <input type="number" inputMode="decimal" min="0" value={gastos[c.key] ?? 0}
              onChange={e => setGasto(c.key, e.target.value)} />
          </FormGroup>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
            {fmtEUR(result.ahorro)}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
            {result.superaPauschale
              ? t('steuer.werb.resumenSupera', { gastos: result.totalGastos.toLocaleString('de-DE'), pausch: result.pausch.toLocaleString('de-DE'), pct: Math.round(result.tasa * 100) })
              : t('steuer.werb.resumenBaja', { pausch: result.pausch.toLocaleString('de-DE') })}
          </div>
        </div>

        <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>
          <span>{t('steuer.werb.aprovechamiento')}</span>
          <span>{Math.round(result.topePct)}%</span>
        </div>
        <ProgressBar value={result.topePct} max={100} color={result.topePct >= 100 ? 'green' : 'amber'} height={6} />

        <div style={{ marginTop: 16, borderTop: '.5px solid var(--brd)', paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{t('steuer.werb.desglose')}</div>
          {result.desglose.map(d => (
            <div key={d.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--tx)' }}>
              <span>{t('steuer.werb.cat.' + d.key)}</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(d.monto)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
