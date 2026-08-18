// src/pages/AhorroFiscal/index.jsx
// Motor 2 — Ahorro fiscal por aporte previsional. Gated por país (MX/CO/US/ES).
// Config-driven: toda particularidad vive en src/config/aporte/{pais}.js

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, ProgressBar, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { getAporteConfig, calcAporte } from '../../utils/aporteEngine.js'
import {
  compararRothTraditional, calcHSA, tasaMarginalDesdeBruto,
  limite401k, limiteIRA, limiteHSA, LIMITES_2026,
} from '../../utils/taxCalcUS.js'

export default function AhorroFiscal() {
  const { settings, incomes } = useApp()
  const country = (settings.country || 'CL').toUpperCase()
  const config = getAporteConfig(country)
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const year = activeMonth.slice(0, 4)

  // Reglas de hooks: TODOS los hooks van antes de cualquier return condicional.
  // Si settings.country cambia con el componente montado, un hook después del
  // return hace que React renderice menos hooks de los esperados y la pantalla
  // queda en blanco. Referencia de estructura correcta: pages/Steuer/index.jsx.
  const ingresoEstimado = useMemo(() => Math.round((incomes || [])
    .filter(r => String(r?.date || '').startsWith(year))
    .reduce((s, r) => s + (Number(r.amount) || 0), 0)), [incomes, year])

  const [ingreso, setIngreso] = useState(ingresoEstimado || '')
  const [aporte, setAporte] = useState('')
  const [edad, setEdad] = useState('')
  // Toggle opcional declarado por el config del país (config.toggle). Los países
  // que no lo declaran no renderizan nada y su cálculo no cambia.
  const [toggleOn, setToggleOn] = useState(false)

  const result = useMemo(
    () => calcAporte(config, {
      ingresoAnual: Number(ingreso) || 0,
      aporteAnual: Number(aporte) || 0,
      edad: Number(edad) || 0,
      ...(config?.toggle ? { [config.toggle.key]: toggleOn } : {}),
    }),
    [config, ingreso, aporte, edad, toggleOn]
  )

  if (!config) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponible para México 🇲🇽, Colombia 🇨🇴, USA 🇺🇸 y España 🇪🇸
      </div>
    )
  }

  const sym = config.sym
  const locale = { MX: 'es-MX', CO: 'es-CO', US: 'en-US', ES: 'es-ES' }[config.pais] || 'es'
  const esUS = config.pais === 'US'

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
              <input type="number" inputMode="decimal" min="0" value={ingreso} placeholder="0" onChange={e => setIngreso(e.target.value)} />
            </FormGroup>
            <FormGroup label={config.aporteLabel}>
              <input type="number" inputMode="decimal" min="0" value={aporte} placeholder="0" onChange={e => setAporte(e.target.value)} />
            </FormGroup>
          </FormRow>
          {esUS && (
            <FormRow>
              <FormGroup label="Your age (for catch-up limits)">
                <input type="number" inputMode="decimal" min="0" max="100" value={edad} placeholder="e.g. 42" onChange={e => setEdad(e.target.value)} />
              </FormGroup>
            </FormRow>
          )}
          {config.toggle && (
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tx)', cursor: 'pointer' }}>
                <input type="checkbox" checked={toggleOn} onChange={e => setToggleOn(e.target.checked)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                {config.toggle.label}
              </label>
              {config.toggle.hint && (
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 4, paddingLeft: 24 }}>
                  {config.toggle.hint}
                </div>
              )}
            </div>
          )}
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
            {config.resumenTope}
          </div>
          {esUS && <LimitesUSA edad={edad} fmt={fmt} />}
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

            {esUS && result.gravable != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--tm)', marginBottom: 12 }}>
                <span>Taxable income (gross − standard deduction)</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{fmt(result.gravable)}</span>
              </div>
            )}

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

        {esUS && <RothHSACard fmt={fmt} ingresoAnual={ingreso} edad={edad} />}
      </div>
    </ProGate>
  )
}

// Topes 2026 con catch-up aplicado según la edad declarada.
function LimitesUSA({ edad, fmt }) {
  const k = limite401k(edad)
  const ira = limiteIRA(edad)
  const e = Number(edad) || 0
  if (!e) return null
  const filas = [
    ['401(k) elective deferral', k],
    ['IRA', ira],
  ]
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '.5px solid var(--brd)', display: 'flex', flexDirection: 'column', gap: 5 }}>
      {filas.map(([label, l]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--tx)' }}>
          <span>{label} {l.catchUp > 0 ? <span style={{ color: 'var(--accent)' }}>+ catch-up</span> : null}</span>
          <span style={{ fontFamily: 'var(--mono)' }}>
            {fmt(l.total)}{l.catchUp > 0 ? ` (${fmt(l.base)} + ${fmt(l.catchUp)})` : ''}
          </span>
        </div>
      ))}
      {e >= 60 && e <= 63 && (
        <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.5 }}>
          Super catch-up 60–63 aplicado ({fmt(LIMITES_2026.catchUp401kSuper6063)} en vez de {fmt(LIMITES_2026.catchUp401k50)}).
        </div>
      )}
    </div>
  )
}

// Roth vs Traditional + HSA — solo USA. El 401(k) de arriba responde "cuánto
// deduzco", esto responde las dos preguntas que de verdad generan duda:
// ¿Roth o Traditional? y ¿vale la pena maximizar el HSA?
function RothHSACard({ fmt, ingresoAnual, edad }) {
  // Los tramos van sobre taxable income, no sobre el bruto: hay que restar la
  // standard deduction antes de leer la tasa marginal.
  const [tasaHoy, setTasaHoy] = useState(() => Math.round(tasaMarginalDesdeBruto(Number(ingresoAnual) || 80000, 'single') * 100))
  const [tasaRetiro, setTasaRetiro] = useState('12')
  const [aporte, setAporte] = useState('7500')
  const [anios, setAnios] = useState('25')
  const [retorno, setRetorno] = useState('7')

  const [coverage, setCoverage] = useState('self')
  const [aporteHsa, setAporteHsa] = useState('')

  const rothVsTrad = useMemo(() => compararRothTraditional({
    aporte: Number(aporte) || 0,
    tasaHoy: (Number(tasaHoy) || 0) / 100,
    tasaRetiro: (Number(tasaRetiro) || 0) / 100,
    anios: Number(anios) || 0,
    retornoAnual: Number(retorno) || 0,
  }), [aporte, tasaHoy, tasaRetiro, anios, retorno])

  const hsa = useMemo(() => calcHSA({
    coverage, aporteAnual: aporteHsa, tasaMarginalHoy: (Number(tasaHoy) || 0) / 100,
    anios: Number(anios) || 0, retornoAnual: Number(retorno) || 0, edad: Number(edad) || 0,
  }), [coverage, aporteHsa, tasaHoy, anios, retorno, edad])

  const topeHsa = limiteHSA(coverage, edad)

  return (
    <>
      <Card>
        <CardHeader title="Roth vs Traditional" />
        <div style={{ fontSize: 12, color: 'var(--tm)', lineHeight: 1.6, marginBottom: 14 }}>
          Mismo aporte nominal a cada cuenta, mismo crecimiento. En Traditional entra completo y tributas al retirarlo;
          en Roth ya tributaste y sale libre. Lo que inclina la balanza es la deducción de hoy: si la inviertes, Traditional
          gana cuando tu tasa de hoy es mayor que la del retiro.
        </div>
        <FormRow>
          <FormGroup label="Aporte anual (USD)">
            <input type="number" inputMode="decimal" min="0" value={aporte} onChange={e => setAporte(e.target.value)} />
          </FormGroup>
          <FormGroup label="Años hasta el retiro">
            <input type="number" inputMode="decimal" min="0" value={anios} onChange={e => setAnios(e.target.value)} />
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup label="Tu tasa marginal hoy (%)">
            <input type="number" inputMode="decimal" min="0" value={tasaHoy} onChange={e => setTasaHoy(e.target.value)} />
          </FormGroup>
          <FormGroup label="Tasa marginal esperada al retirarte (%)">
            <input type="number" inputMode="decimal" min="0" value={tasaRetiro} onChange={e => setTasaRetiro(e.target.value)} />
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup label="Retorno anual asumido (%)">
            <input type="number" inputMode="decimal" min="0" step="0.5" value={retorno} onChange={e => setRetorno(e.target.value)} />
          </FormGroup>
        </FormRow>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <div style={{ background: rothVsTrad.convieneTraditional ? 'var(--grn-tint)' : 'var(--sur2)', border: rothVsTrad.convieneTraditional ? '.5px solid color-mix(in srgb, var(--grn) 35%, transparent)' : '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 4 }}>TRADITIONAL — TOTAL NETO</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: rothVsTrad.convieneTraditional ? 'var(--grn)' : 'var(--tx)' }}>{fmt(rothVsTrad.traditionalTotal)}</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6, lineHeight: 1.5 }}>
              cuenta {fmt(rothVsTrad.traditionalNeto)} + deducción invertida {fmt(rothVsTrad.ahorroInvertido)}
            </div>
          </div>
          <div style={{ background: !rothVsTrad.convieneTraditional ? 'var(--grn-tint)' : 'var(--sur2)', border: !rothVsTrad.convieneTraditional ? '.5px solid color-mix(in srgb, var(--grn) 35%, transparent)' : '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 4 }}>ROTH — VALOR FUTURO</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: !rothVsTrad.convieneTraditional ? 'var(--grn)' : 'var(--tx)' }}>{fmt(rothVsTrad.rothFinal)}</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6, lineHeight: 1.5 }}>
              sale libre de impuesto
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--tm)', marginTop: 10, lineHeight: 1.5 }}>
          {rothVsTrad.convieneTraditional
            ? <>Con estos números, <strong style={{ color: 'var(--accent)' }}>Traditional</strong> te deja {fmt(rothVsTrad.diferencia)} más — tiene sentido si esperas pagar menos impuesto al retirarte que hoy.</>
            : <><strong style={{ color: 'var(--accent)' }}>Roth</strong> te deja {fmt(rothVsTrad.diferencia)} más — tiene sentido si tu tasa de hoy es más baja que la que esperas pagar retirado.</>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, marginTop: 12, padding: '10px 12px', background: 'var(--sur2)', borderRadius: 8, border: '.5px solid var(--brd)' }}>
          Asume que la deducción de hoy ({fmt(rothVsTrad.ahorroFiscalHoy)}) se invierte al mismo retorno y no paga impuesto sobre las ganancias.
          Si te la gastas, o si ya topeas el límite legal en ambas cuentas, Roth gana siempre a igual aporte nominal.
        </div>
      </Card>

      <Card>
        <CardHeader title="HSA — la cuenta con triple ventaja fiscal" />
        <div style={{ fontSize: 12, color: 'var(--tm)', lineHeight: 1.6, marginBottom: 14 }}>
          Deducible al aportar, crece libre de impuesto, sale libre de impuesto en gasto médico calificado.
          Límites 2026: {fmt(LIMITES_2026.hsaSelfOnly)} individual / {fmt(LIMITES_2026.hsaFamily)} familiar
          {topeHsa.catchUp > 0
            ? <> · catch-up 55+ aplicado (+{fmt(topeHsa.catchUp)}) → tu tope es <strong style={{ color: 'var(--accent)' }}>{fmt(topeHsa.total)}</strong>.</>
            : <> · con 55 años o más suma {fmt(LIMITES_2026.hsaCatchUp55)} de catch-up (indica tu edad arriba).</>}
        </div>
        <FormRow>
          <FormGroup label="Cobertura">
            <select value={coverage} onChange={e => setCoverage(e.target.value)}>
              <option value="self">Individual (self-only)</option>
              <option value="family">Familiar</option>
            </select>
          </FormGroup>
          <FormGroup label="Aporte anual planeado (USD)">
            <input type="number" inputMode="decimal" min="0" value={aporteHsa} placeholder="0" onChange={e => setAporteHsa(e.target.value)} />
          </FormGroup>
        </FormRow>

        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 30, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{fmt(hsa.ahorroFiscalHoy)}</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6, lineHeight: 1.6 }}>
            ahorro fiscal este año · aportando {fmt(hsa.aporte)} cada año durante {anios} años,
            el saldo llega a {fmt(hsa.valorFuturo)} ({fmt(hsa.totalAportado)} aportados)
          </div>
        </div>
        {hsa.faltaParaTope > 0 ? (
          <div style={{ fontSize: 12, color: 'var(--tm)', lineHeight: 1.5 }}>
            Puedes aportar <strong style={{ color: 'var(--accent)' }}>{fmt(hsa.faltaParaTope)}</strong> más este año antes de tocar el límite ({fmt(hsa.limite)}).
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>✓ Alcanzaste el límite de aporte {coverage === 'family' ? 'familiar' : 'individual'}.</div>
        )}
      </Card>
    </>
  )
}
