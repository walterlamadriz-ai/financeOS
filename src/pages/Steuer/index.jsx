// src/pages/Steuer/index.jsx
// Módulo Alemania — herramienta fiscal exclusiva (mismo patrón que APV Chile).
// Solo visible si settings.country === 'DE'. Dos calculadoras:
// 1) Lohnabzüge: bruto → neto (Sozialversicherung + Lohnsteuer + Soli + Kirchensteuer)
// 2) Werbungskosten: gastos deducibles vs Pauschbetrag automático

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, ProgressBar, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { calcDescuentosDE, BUNDESLAENDER } from '../../utils/taxCalcDE.js'
import { getDeduccionesConfig, autofillGastos, calcDeducciones } from '../../utils/deduccionesEngine.js'

const fmtEUR = (n) => `€${(Number(n) || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })}`

export default function Steuer() {
  const { settings, expenses } = useApp()
  const country = (settings.country || 'CL').toUpperCase()

  if (country !== 'DE') {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponible solo para Alemania 🇩🇪
      </div>
    )
  }

  return (
    <ProGate feature="Steuer — herramienta fiscal alemana">
      <div className="stack">
        <PageHeader title="Steuer" sub="Descuentos salariales y deducciones laborales — Alemania 🇩🇪" />
        <Alert type="info">
          ⚠ Estimación educativa, no asesoría tributaria. Para tu Steuererklärung oficial usa Elster o un Steuerberater.
        </Alert>
        <LohnabzuegeCard />
        <WerbungskostenCard expenses={expenses} settings={settings} />
      </div>
    </ProGate>
  )
}

function LohnabzuegeCard() {
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
      <CardHeader title="Lohnabzüge — de bruto a neto" />
      <FormRow>
        <FormGroup label="Bruttogehalt mensual (EUR)">
          <input type="number" inputMode="decimal" min="0" value={brutto} placeholder="0"
            onChange={e => setBrutto(e.target.value)} />
        </FormGroup>
        <FormGroup label="Bundesland">
          <select value={bundesland} onChange={e => setBundesland(e.target.value)}>
            {BUNDESLAENDER.map(bl => <option key={bl.code} value={bl.code}>{bl.label}</option>)}
          </select>
        </FormGroup>
      </FormRow>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tx)', margin: '4px 0 12px', cursor: 'pointer' }}>
        <input type="checkbox" checked={kirche} onChange={e => setKirche(e.target.checked)} style={{ width: 16, height: 16, flexShrink: 0 }} />
        Kirchensteuerpflichtig (pago impuesto eclesiástico)
      </label>

      {result && (
        <>
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
              {fmtEUR(result.netto)}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
              Nettogehalt estimado · tasa efectiva de descuento {Math.round(result.tasaEfectiva * 100)}%
            </div>
          </div>

          <div style={{ marginTop: 4, borderTop: '.5px solid var(--brd)', paddingTop: 12 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
              Sozialversicherung (contribuciones sociales)
            </div>
            {[
              ['Rentenversicherung (pensión)', result.sozialversicherung.rentenversicherung],
              ['Krankenversicherung (salud)', result.sozialversicherung.krankenversicherung],
              ['Arbeitslosenversicherung (desempleo)', result.sozialversicherung.arbeitslosenversicherung],
              ['Pflegeversicherung (dependencia)', result.sozialversicherung.pflegeversicherung],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--tx)' }}>
                <span>{label}</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(val)}</span>
              </div>
            ))}

            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '12px 0 8px' }}>
              Impuestos
            </div>
            {[
              ['Lohnsteuer (retención IRPF)', result.lohnsteuer],
              ['Solidaritätszuschlag', result.soli],
              ...(result.kirchensteuer > 0 ? [['Kirchensteuer', result.kirchensteuer]] : []),
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--tx)' }}>
                <span>{label}</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(val)}</span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, padding: '8px 0 0', marginTop: 8, borderTop: '.5px solid var(--brd)', color: 'var(--tx)' }}>
              <span>Total descuentos</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.totalAbzuege)}</span>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

function WerbungskostenCard({ expenses, settings }) {
  const config = getDeduccionesConfig('DE')
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const year = activeMonth.slice(0, 4)

  const autofilled = useMemo(() => autofillGastos(config, expenses, year), [config, expenses, year])
  const [gastos, setGastos] = useState(autofilled)
  const [ingreso, setIngreso] = useState('')

  function setGasto(key, val) {
    setGastos(p => ({ ...p, [key]: val === '' ? 0 : Number(val) }))
  }

  const result = useMemo(() => {
    return calcDeducciones(config, { gastosPorCat: gastos, ingresoAnual: Number(ingreso) || 0 })
  }, [config, gastos, ingreso])

  return (
    <Card>
      <CardHeader title={config.titulo} right={<span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>{year}</span>} />
      <div style={{ fontSize: 12, color: 'var(--tm)', lineHeight: 1.6, marginBottom: 14 }}>{config.subtitulo}</div>

      <FormRow>
        <FormGroup label={config.ingresoLabel}>
          <input type="number" inputMode="decimal" min="0" value={ingreso} placeholder="0"
            onChange={e => setIngreso(e.target.value)} />
        </FormGroup>
      </FormRow>

      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '12px 0 8px' }}>
        Gastos deducibles (autollenados de tus registros — editables)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {config.categorias.map(c => (
          <FormGroup key={c.key} label={c.label}>
            <input type="number" inputMode="decimal" min="0" value={gastos[c.key] ?? 0}
              onChange={e => setGasto(c.key, e.target.value)} />
          </FormGroup>
        ))}
      </div>

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
              {fmtEUR(result.ahorro)}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
              {result.resumen}
            </div>
          </div>

          <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>
            <span>Aprovechamiento del Pauschbetrag</span>
            <span>{Math.round(result.topePct)}%</span>
          </div>
          <ProgressBar value={result.topePct} max={100} color={result.topePct >= 100 ? 'green' : 'amber'} height={6} />

          <div style={{ marginTop: 16, borderTop: '.5px solid var(--brd)', paddingTop: 12 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Desglose</div>
            {result.desglose.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--tx)' }}>
                <span>{d.label}</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(d.monto)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
