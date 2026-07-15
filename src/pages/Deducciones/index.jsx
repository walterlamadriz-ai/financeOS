// src/pages/Deducciones/index.jsx
// Motor 1 — Optimizador de gastos deducibles. Gated por país (EC/PE).
// Config-driven: toda particularidad vive en src/config/deducciones/{pais}.js

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, ProgressBar, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { getDeduccionesConfig, autofillGastos, calcDeducciones } from '../../utils/deduccionesEngine.js'

export default function Deducciones() {
  const { settings, expenses, incomes } = useApp()
  const country = (settings.country || 'CL').toUpperCase()
  const config = getDeduccionesConfig(country)
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const year = activeMonth.slice(0, 4)

  // Guard: país sin módulo
  if (!config) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponible para Ecuador 🇪🇨 y Perú 🇵🇪
      </div>
    )
  }

  const sym = config.sym

  // Autollenado de gastos del año desde lo ya registrado
  const autofilled = useMemo(
    () => autofillGastos(config, expenses, year),
    [config, expenses, year]
  )

  // Ingreso anual estimado desde ingresos del año (si el config lo necesita)
  const ingresoEstimado = useMemo(() => {
    if (!config.needsIngreso) return 0
    return Math.round((incomes || [])
      .filter(r => String(r?.date || '').startsWith(year))
      .reduce((s, r) => s + (Number(r.amount) || 0), 0))
  }, [incomes, year, config.needsIngreso])

  const [gastos, setGastos] = useState(autofilled)
  const [ingreso, setIngreso] = useState(ingresoEstimado || '')
  const [extra, setExtra] = useState(config.extraInput?.default ?? '')

  function setGasto(key, val) {
    setGastos(p => ({ ...p, [key]: val === '' ? 0 : Number(val) }))
  }

  const result = useMemo(() => {
    const inputs = { gastosPorCat: gastos }
    if (config.needsIngreso) inputs.ingresoAnual = Number(ingreso) || 0
    if (config.extraInput) inputs[config.extraInput.key] = Number(extra) || 0
    return calcDeducciones(config, inputs)
  }, [config, gastos, ingreso, extra])

  const fmt = (n) => `${sym}${(Number(n) || 0).toLocaleString('es-' + (config.pais === 'EC' ? 'EC' : 'PE'), { maximumFractionDigits: 0 })}`

  return (
    <ProGate feature="El optimizador de deducciones">
      <div className="stack">
        <PageHeader title={config.titulo} sub={config.subtitulo} />

        <Alert type="info">
          ⚠ {config.disclaimer} <strong>Cifras {config.vigencia} ({config.fuente}).</strong>
        </Alert>

        {/* Inputs */}
        <Card>
          <CardHeader title="Tus datos del año" right={<span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>{year}</span>} />

          {config.needsIngreso && (
            <FormRow>
              <FormGroup label={config.ingresoLabel || 'Ingreso anual'}>
                <input type="number" inputMode="decimal" min="0" value={ingreso} placeholder="0"
                  onChange={e => setIngreso(e.target.value)} />
              </FormGroup>
              {config.extraInput && (
                <FormGroup label={config.extraInput.label}>
                  <select value={extra} onChange={e => setExtra(e.target.value)}>
                    {config.extraInput.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FormGroup>
              )}
            </FormRow>
          )}

          {!config.needsIngreso && config.extraInput && (
            <FormRow>
              <FormGroup label={config.extraInput.label}>
                <select value={extra} onChange={e => setExtra(e.target.value)}>
                  {config.extraInput.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </FormGroup>
            </FormRow>
          )}

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
        </Card>

        {/* Resultado */}
        {result && (
          <Card>
            <CardHeader title={result.tituloResultado} />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                {fmt(result.ahorro)}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
                {result.resumen}
              </div>
            </div>

            {/* Progreso al tope */}
            <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>
              <span>Aprovechamiento del tope</span>
              <span>{Math.round(result.topePct)}%</span>
            </div>
            <ProgressBar value={result.topePct} max={100} color={result.topePct >= 100 ? 'green' : 'amber'} height={6} />
            {result.faltaParaTope > 0 ? (
              <div style={{ fontSize: 12, color: 'var(--tm)', marginTop: 10, lineHeight: 1.5 }}>
                {config.needsIngreso
                  ? <>Te queda <strong style={{ color: 'var(--accent)' }}>{fmt(result.faltaParaTope)}</strong> de deducción adicional sin usar. Registra más gastos sustentados para maximizar tu devolución.</>
                  : <>Te faltan <strong style={{ color: 'var(--accent)' }}>{fmt(result.faltaParaTope)}</strong> en gastos deducibles para llegar al tope y maximizar tu rebaja.</>}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 10, fontWeight: 600 }}>
                ✓ Alcanzaste el tope máximo de beneficio.
              </div>
            )}

            {/* Desglose */}
            <div style={{ marginTop: 16, borderTop: '.5px solid var(--brd)', paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Desglose</div>
              {result.desglose.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--tx)' }}>
                  <span>{d.label}{d.rate ? <span style={{ color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 11 }}> · {Math.round(d.rate * 100)}% deducible</span> : null}</span>
                  <span style={{ fontFamily: 'var(--mono)' }}>
                    {fmt(d.monto)}{d.aporta != null ? <span style={{ color: 'var(--accent)' }}> → {fmt(d.aporta)}</span> : null}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </ProGate>
  )
}
