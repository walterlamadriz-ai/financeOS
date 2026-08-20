// src/pages/MultiDolarAR/index.jsx
// Multi-dólar en vivo + comparador de rendimientos — Argentina. Sustituye al
// ajuste por IPC como tarjeta protagonista (el pain real no es "cuánto vale
// mi plata de hace 6 meses", es "a qué dólar la paso hoy y en qué la dejo
// mientras tanto"). Solo visible si settings.country === 'AR'.

import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useT } from '../../i18n/useT.js'
import { Card, CardHeader, FormRow, FormGroup, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { loadTasaAR } from '../../utils/tasaAR.js'
import { calcRendimiento, TNA_DEFAULTS } from '../../utils/rendimientosAR.js'

const fmtARS = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`
const fmtUSD = (n) => `US$${(Number(n) || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`

const DOLARES = [
  { key: 'blue', labelKey: 'multiDolarAR.dolar.blue' },
  { key: 'mep', labelKey: 'multiDolarAR.dolar.mep' },
  { key: 'ccl', labelKey: 'multiDolarAR.dolar.ccl' },
  { key: 'oficial', labelKey: 'multiDolarAR.dolar.oficial' },
  { key: 'cripto', labelKey: 'multiDolarAR.dolar.cripto' },
  { key: 'tarjeta', labelKey: 'multiDolarAR.dolar.tarjeta' },
  { key: 'mayorista', labelKey: 'multiDolarAR.dolar.mayorista' },
]

export default function MultiDolarAR() {
  const { settings } = useApp()
  const { t } = useT()
  const country = (settings.country || 'CL').toUpperCase()

  if (country !== 'AR') {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        {t('multiDolarAR.onlyAR')}
      </div>
    )
  }

  const [live, setLive] = useState(null)
  useEffect(() => { loadTasaAR().then(setLive) }, [])

  return (
    <ProGate feature={t('multiDolarAR.proFeature')}>
      <div className="stack">
        <PageHeader title={t('multiDolarAR.title')} sub={t('multiDolarAR.sub')} />

        <Alert type="info">⚠ {t('multiDolarAR.disclaimer')}</Alert>

        <Card>
          <CardHeader title={t('multiDolarAR.cotizaciones.title')} right={
            live && (
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: live.source === 'api' ? 'var(--accent)' : 'var(--th)' }}>
                {live.source === 'api' ? `● ${t('multiDolarAR.live.on')}` : `○ ${t('multiDolarAR.live.off')}`}
              </span>
            )
          } />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            {DOLARES.map(d => (
              <div key={d.key} style={{ background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 4 }}>{t(d.labelKey)}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>
                  {live ? fmtARS(live[d.key]) : '—'}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {live && <RendimientosCard blue={live.blue} />}
      </div>
    </ProGate>
  )
}

function RendimientosCard({ blue }) {
  const { t } = useT()
  const [capital, setCapital] = useState('')
  const [dias, setDias] = useState('30')
  const [tnas, setTnas] = useState(TNA_DEFAULTS)

  function setTna(key, val) {
    setTnas(p => ({ ...p, [key]: val === '' ? 0 : Number(val) }))
  }

  const instrumentos = useMemo(() => {
    const c = Number(capital) || 0
    const d = Number(dias) || 0
    return [
      { key: 'plazoFijo', ...calcRendimiento(c, tnas.plazoFijo, d) },
      { key: 'cuentaRemunerada', ...calcRendimiento(c, tnas.cuentaRemunerada, d) },
      { key: 'fciMoneyMarket', ...calcRendimiento(c, tnas.fciMoneyMarket, d) },
    ]
  }, [capital, dias, tnas])

  return (
    <Card>
      <CardHeader title={t('multiDolarAR.rendimiento.title')} />
      <FormRow>
        <FormGroup label={t('multiDolarAR.rendimiento.montoLabel')}>
          <input type="number" inputMode="decimal" min="0" value={capital} placeholder="0"
            onChange={e => setCapital(e.target.value)} />
        </FormGroup>
        <FormGroup label={t('multiDolarAR.rendimiento.plazoLabel')}>
          <input type="number" inputMode="decimal" min="1" max="365" value={dias}
            onChange={e => setDias(e.target.value)} />
        </FormGroup>
      </FormRow>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
        {instrumentos.map(inst => (
          <div key={inst.key} style={{ background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)', marginBottom: 8 }}>{t('multiDolarAR.instrumento.' + inst.key)}</div>
            <FormGroup label={t('multiDolarAR.instrumento.tnaLabel')}>
              <input type="number" inputMode="decimal" min="0" step="0.1" value={tnas[inst.key]}
                onChange={e => setTna(inst.key, e.target.value)} />
            </FormGroup>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)', marginTop: 10, lineHeight: 1 }}>
              {fmtARS(inst.final)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--tm)', marginTop: 4 }}>
              {t('multiDolarAR.instrumento.interesSub', { interes: fmtARS(inst.interes), usd: blue ? fmtUSD(inst.final / blue) : '—' })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--th)', marginTop: 6, paddingTop: 6, borderTop: '.5px solid var(--brd)' }}>
              {t('multiDolarAR.instrumento.teaPre')}<span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{(inst.tea * 100).toFixed(1)}%</span>{t('multiDolarAR.instrumento.teaPost')}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--th)', lineHeight: 1.6, marginTop: 14, padding: '10px 12px', background: 'var(--sur2)', borderRadius: 8, border: '.5px solid var(--brd)' }}>
        {t('multiDolarAR.footNote.pre1')}<strong>{t('multiDolarAR.footNote.strong1')}</strong>{t('multiDolarAR.footNote.post1')}
        <br /><br />
        {t('multiDolarAR.footNote.line2')}
      </div>
    </Card>
  )
}
