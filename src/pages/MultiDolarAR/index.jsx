// src/pages/MultiDolarAR/index.jsx
// Multi-dólar en vivo + comparador de rendimientos — Argentina. Sustituye al
// ajuste por IPC como tarjeta protagonista (el pain real no es "cuánto vale
// mi plata de hace 6 meses", es "a qué dólar la paso hoy y en qué la dejo
// mientras tanto"). Solo visible si settings.country === 'AR'.

import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { loadTasaAR } from '../../utils/tasaAR.js'
import { calcRendimiento, TNA_DEFAULTS } from '../../utils/rendimientosAR.js'

const fmtARS = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`
const fmtUSD = (n) => `US$${(Number(n) || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`

const DOLARES = [
  { key: 'blue', label: 'Blue' },
  { key: 'mep', label: 'MEP (Bolsa)' },
  { key: 'ccl', label: 'CCL' },
  { key: 'oficial', label: 'Oficial' },
  { key: 'cripto', label: 'Cripto (USDT)' },
  { key: 'tarjeta', label: 'Tarjeta' },
  { key: 'mayorista', label: 'Mayorista' },
]

export default function MultiDolarAR() {
  const { settings } = useApp()
  const country = (settings.country || 'CL').toUpperCase()

  if (country !== 'AR') {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponible solo para Argentina 🇦🇷
      </div>
    )
  }

  const [live, setLive] = useState(null)
  useEffect(() => { loadTasaAR().then(setLive) }, [])

  return (
    <ProGate feature="El panel multi-dólar">
      <div className="stack">
        <PageHeader title="Dólar y rendimientos" sub="A qué dólar convertís hoy, y en qué la dejás mientras tanto" />

        <Alert type="info">⚠ Estimación educativa, no asesoría financiera. Cotizaciones de referencia — el precio real varía por operador.</Alert>

        <Card>
          <CardHeader title="Cotizaciones de hoy" right={
            live && (
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: live.source === 'api' ? 'var(--accent)' : 'var(--th)' }}>
                {live.source === 'api' ? '● en vivo' : '○ referencial (sin conexión)'}
              </span>
            )
          } />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            {DOLARES.map(d => (
              <div key={d.key} style={{ background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 4 }}>{d.label}</div>
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
      { key: 'plazoFijo', label: 'Plazo fijo tradicional', ...calcRendimiento(c, tnas.plazoFijo, d) },
      { key: 'cuentaRemunerada', label: 'Cuenta remunerada / billetera', ...calcRendimiento(c, tnas.cuentaRemunerada, d) },
      { key: 'fciMoneyMarket', label: 'FCI money market', ...calcRendimiento(c, tnas.fciMoneyMarket, d) },
    ]
  }, [capital, dias, tnas])

  return (
    <Card>
      <CardHeader title="¿Dónde rinde más tu plata?" />
      <FormRow>
        <FormGroup label="Monto en pesos">
          <input type="number" inputMode="decimal" min="0" value={capital} placeholder="0"
            onChange={e => setCapital(e.target.value)} />
        </FormGroup>
        <FormGroup label="Plazo (días)">
          <input type="number" inputMode="decimal" min="1" max="365" value={dias}
            onChange={e => setDias(e.target.value)} />
        </FormGroup>
      </FormRow>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
        {instrumentos.map(inst => (
          <div key={inst.key} style={{ background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)', marginBottom: 8 }}>{inst.label}</div>
            <FormGroup label="TNA (%) — ajustá con la tasa real">
              <input type="number" inputMode="decimal" min="0" step="0.1" value={tnas[inst.key]}
                onChange={e => setTna(inst.key, e.target.value)} />
            </FormGroup>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)', marginTop: 10, lineHeight: 1 }}>
              {fmtARS(inst.final)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--tm)', marginTop: 4 }}>
              +{fmtARS(inst.interes)} de interés · {blue ? fmtUSD(inst.final / blue) : '—'} al blue de hoy
            </div>
            <div style={{ fontSize: 11, color: 'var(--th)', marginTop: 6, paddingTop: 6, borderTop: '.5px solid var(--brd)' }}>
              TEA <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{(inst.tea * 100).toFixed(1)}%</span> si renovás cada 30 días
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--th)', lineHeight: 1.6, marginTop: 14, padding: '10px 12px', background: 'var(--sur2)', borderRadius: 8, border: '.5px solid var(--brd)' }}>
        El monto final usa <strong>interés simple</strong> sobre el plazo que ingresaste, sin renovar: es lo que cobrás si retirás al vencimiento. La TEA de cada tarjeta muestra el rendimiento compuesto equivalente si renovás cada 30 días durante un año — ese es el número comparable entre instrumentos.
        <br /><br />
        El equivalente en dólares asume que el blue no se mueve durante el plazo. Si el dólar sube más rápido que tu tasa, perdés poder de compra en dólares aunque ganaste en pesos.
      </div>
    </Card>
  )
}
