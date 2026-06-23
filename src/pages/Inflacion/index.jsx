// src/pages/Inflacion/index.jsx
// Motor 3 — Ajuste por inflación (Argentina). Gated por país (AR).
// Config-driven: serie IPC en src/config/inflacion/ar.js

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import arConfig from '../../config/inflacion/ar.js'

const CONFIGS = { AR: arConfig }

export default function Inflacion() {
  const { settings } = useApp()
  const country = (settings.country || 'CL').toUpperCase()
  const config = CONFIGS[country]

  if (!config) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponible para Argentina 🇦🇷
      </div>
    )
  }

  const sym = config.sym
  const [monto, setMonto] = useState('')
  const [desde, setDesde] = useState(config.primero)
  const [hasta, setHasta] = useState(config.ultimo)

  const result = useMemo(
    () => calc(),
    [monto, desde, hasta]
  )
  function calc() {
    if (desde > hasta) return null
    return config.calcular({ monto: Number(monto) || 0, desde, hasta })
  }

  const fmt = (n) => `${sym}${(Number(n) || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
  const fmtMes = (ym) => {
    const [y, m] = ym.split('-')
    const N = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    return `${N[Number(m)]}-${y}`
  }

  return (
    <ProGate feature="El ajuste por inflación">
      <div className="stack" style={{ maxWidth: 760, margin: '0 auto' }}>
        <PageHeader title={config.titulo} sub={config.subtitulo} />

        <Alert type="info">
          ⚠ {config.disclaimer} <strong>Datos hasta {config.vigencia} ({config.fuente}).</strong>
        </Alert>

        <Card>
          <CardHeader title="¿Cuánto vale hoy el dinero de antes?" />
          <FormRow>
            <FormGroup label="Monto (ARS)">
              <input type="number" min="0" value={monto} placeholder="0" onChange={e => setMonto(e.target.value)} />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Desde">
              <select value={desde} onChange={e => setDesde(e.target.value)}>
                {config.meses.map(m => <option key={m} value={m}>{fmtMes(m)}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Hasta">
              <select value={hasta} onChange={e => setHasta(e.target.value)}>
                {config.meses.map(m => <option key={m} value={m}>{fmtMes(m)}</option>)}
              </select>
            </FormGroup>
          </FormRow>
          {desde > hasta && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>El mes "desde" debe ser anterior a "hasta".</div>
          )}
        </Card>

        {result && Number(monto) > 0 && (
          <Card>
            <CardHeader title={`Equivalencia ${fmtMes(desde)} → ${fmtMes(hasta)}`} />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 30, fontWeight: 700, color: 'var(--accent)', lineHeight: 1.1 }}>
                {fmt(result.valorAjustado)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--tm)', marginTop: 8, lineHeight: 1.5 }}>
                {fmt(monto)} de {fmtMes(desde)} equivalen a <strong>{fmt(result.valorAjustado)}</strong> de {fmtMes(hasta)}.
              </div>
            </div>
            <div style={{ borderTop: '.5px solid var(--brd)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Row label="Inflación acumulada del período" value={`${result.inflacionAcumPct.toFixed(1)}%`} color="var(--red)" />
              <Row label="Poder de compra perdido (si lo tuviste en efectivo)" value={`−${result.poderPerdidoPct.toFixed(1)}%`} color="var(--red)" />
              <Row label="Tu efectivo hoy compra como" value={`${fmt(result.poderHoy)} de ${fmtMes(desde)}`} color="var(--th)" />
            </div>
          </Card>
        )}
      </div>
    </ProGate>
  )
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
      <span>{label}</span>
      <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color }}>{value}</span>
    </div>
  )
}
