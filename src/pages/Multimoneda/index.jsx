// src/pages/Multimoneda/index.jsx
// Motor 3 — Panel multimoneda (Venezuela). Gated por país (VE).
// Config-driven: src/config/multimoneda/ve.js

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, ProgressBar, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import veConfig from '../../config/multimoneda/ve.js'

const CONFIGS = { VE: veConfig }

export default function Multimoneda() {
  const { settings } = useApp()
  const country = (settings.country || 'CL').toUpperCase()
  const config = CONFIGS[country]

  if (!config) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponible para Venezuela 🇻🇪
      </div>
    )
  }

  const [bs, setBs] = useState('')
  const [usd, setUsd] = useState('')
  const [tasa, setTasa] = useState(config.tasaDefault)

  const result = useMemo(
    () => config.calcular({ saldoBsS: Number(bs) || 0, saldoUSD: Number(usd) || 0, tasa: Number(tasa) || config.tasaDefault }),
    [bs, usd, tasa]
  )

  const fmtUSD = (n) => `$${(Number(n) || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`

  return (
    <ProGate feature="El panel multimoneda">
      <div className="stack">
        <PageHeader title={config.titulo} sub={config.subtitulo} />

        <Alert type="info">
          ⚠ {config.disclaimer} <strong>Tasa ref. {config.vigencia} ({config.fuente}).</strong>
        </Alert>

        <Card>
          <CardHeader title="Tus saldos" />
          <FormRow>
            <FormGroup label="Saldo en bolívares (Bs)">
              <input type="number" inputMode="decimal" min="0" value={bs} placeholder="0" onChange={e => setBs(e.target.value)} />
            </FormGroup>
            <FormGroup label="Saldo en dólares (USD)">
              <input type="number" inputMode="decimal" min="0" value={usd} placeholder="0" onChange={e => setUsd(e.target.value)} />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Tasa Bs/USD (editable)">
              <input type="number" inputMode="decimal" min="0" step="0.01" value={tasa} onChange={e => setTasa(e.target.value)} />
            </FormGroup>
          </FormRow>
        </Card>

        {result && (
          <Card>
            <CardHeader title="Patrimonio total en dólares" />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                {fmtUSD(result.totalUSD)}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
                Bs convertidos: {fmtUSD(result.bsEnUSD)} · USD: {fmtUSD(Number(usd) || 0)}
              </div>
            </div>

            <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>
              <span>Exposición al bolívar</span>
              <span>{Math.round(result.exposicionBsPct)}%</span>
            </div>
            <ProgressBar value={result.exposicionBsPct} max={100} color={result.alerta ? 'red' : 'green'} height={6} />
            {result.alerta ? (
              <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 10, lineHeight: 1.5 }}>
                Alta exposición al bolívar ({Math.round(result.exposicionBsPct)}%). El BsS se devalúa frente al dólar — considera preservar parte de tu valor en USD.
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 10, fontWeight: 600 }}>
                ✓ Exposición al bolívar bajo control.
              </div>
            )}
          </Card>
        )}
      </div>
    </ProGate>
  )
}
