// src/pages/AhorroFiscal/index.jsx
// Motor 2 — Ahorro fiscal por aporte previsional. Gated por país (MX/CO/US/ES).
// Config-driven: toda particularidad vive en src/config/aporte/{pais}.js

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, ProgressBar, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { getAporteConfig, calcAporte } from '../../utils/aporteEngine.js'

export default function AhorroFiscal() {
  const { settings, incomes } = useApp()
  const country = (settings.country || 'CL').toUpperCase()
  const config = getAporteConfig(country)
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const year = activeMonth.slice(0, 4)

  if (!config) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponible para México 🇲🇽, Colombia 🇨🇴, USA 🇺🇸 y España 🇪🇸
      </div>
    )
  }

  const sym = config.sym
  const locale = { MX: 'es-MX', CO: 'es-CO', US: 'en-US', ES: 'es-ES' }[config.pais] || 'es'

  const ingresoEstimado = useMemo(() => Math.round((incomes || [])
    .filter(r => String(r?.date || '').startsWith(year))
    .reduce((s, r) => s + (Number(r.amount) || 0), 0)), [incomes, year])

  const [ingreso, setIngreso] = useState(ingresoEstimado || '')
  const [aporte, setAporte] = useState('')

  const result = useMemo(
    () => calcAporte(config, { ingresoAnual: Number(ingreso) || 0, aporteAnual: Number(aporte) || 0 }),
    [config, ingreso, aporte]
  )

  const fmt = (n) => `${sym}${(Number(n) || 0).toLocaleString(locale, { maximumFractionDigits: 0 })}`

  return (
    <ProGate feature="El proyector de ahorro fiscal">
      <div className="stack">
        <PageHeader title={config.titulo} sub={config.subtitulo} />

        <Alert type="info">
          ⚠ {config.disclaimer} <strong>Cifras {config.vigencia} ({config.fuente}).</strong>
        </Alert>

        <Card>
          <CardHeader title="Tus datos del año" right={<span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>{year}</span>} />
          <FormRow>
            <FormGroup label={config.ingresoLabel}>
              <input type="number" min="0" value={ingreso} placeholder="0" onChange={e => setIngreso(e.target.value)} />
            </FormGroup>
            <FormGroup label={config.aporteLabel}>
              <input type="number" min="0" value={aporte} placeholder="0" onChange={e => setAporte(e.target.value)} />
            </FormGroup>
          </FormRow>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
            {config.resumenTope}
          </div>
        </Card>

        {result && (
          <Card>
            <CardHeader title="Ahorro fiscal estimado" />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                {fmt(result.ahorro)}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
                {result.resumen} · Tu tasa marginal: {Math.round(result.marginal * 100)}%
              </div>
            </div>

            <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>
              <span>Aprovechamiento del tope deducible</span>
              <span>{Math.round(result.topePct)}%</span>
            </div>
            <ProgressBar value={result.topePct} max={100} color={result.topePct >= 100 ? 'green' : 'amber'} height={6} />
            {result.faltaParaTope > 0 ? (
              <div style={{ fontSize: 12, color: 'var(--tm)', marginTop: 10, lineHeight: 1.5 }}>
                Puedes aportar <strong style={{ color: 'var(--accent)' }}>{fmt(result.faltaParaTope)}</strong> más este año con beneficio fiscal (tope: {fmt(result.tope)}).
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 10, fontWeight: 600 }}>
                ✓ Alcanzaste el tope deducible máximo.
              </div>
            )}

            <div style={{ marginTop: 16, borderTop: '.5px solid var(--brd)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Monto deducible aplicado</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{fmt(result.deducible)}</span>
            </div>
          </Card>
        )}
      </div>
    </ProGate>
  )
}
