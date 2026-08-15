// src/pages/IRPFEspana/index.jsx
// Simulador IRPF — España. Sustituye al plan de pensiones como tarjeta
// protagonista (el plan de pensiones colapsó tras la reforma que bajó el
// tope deducible de €8.000 a €1.500 — ahorro fiscal medio real €285-705/año).
// El pain real es entender la retención mensual y la cuota anual. Dos modos:
// empleado (retención en nómina) y autónomo (Modelo 130 trimestral).
// Solo visible si settings.country === 'ES'.

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { calcIRPFEmpleado, calcIRPFAutonomo, TRAMOS_IRPF_2026 } from '../../utils/irpfES.js'

const fmtEUR = (n) => `€${Math.round(Number(n) || 0).toLocaleString('es-ES')}`

export default function IRPFEspana() {
  const { settings } = useApp()
  const country = (settings.country || 'CL').toUpperCase()

  if (country !== 'ES') {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponible solo para España 🇪🇸
      </div>
    )
  }

  const [modo, setModo] = useState('empleado')

  return (
    <ProGate feature="El simulador de IRPF">
      <div className="stack">
        <PageHeader title="IRPF y retención" sub="Cuánto pagas de verdad — y cuánto te retienen cada mes" />

        <Alert type="info">
          ⚠ Estimación educativa, no asesoría fiscal. Escala general de referencia — tu Comunidad Autónoma puede tener tramos distintos. No sustituye tu declaración con la Agencia Tributaria.
        </Alert>

        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <button type="button" onClick={() => setModo('empleado')} style={{
            flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            border: modo === 'empleado' ? '1.5px solid var(--grn)' : '0.5px solid var(--brd2)',
            background: modo === 'empleado' ? 'var(--grn-bg)' : 'var(--sur2)',
            color: modo === 'empleado' ? 'var(--grn)' : 'var(--tx)',
          }}>Empleado (nómina)</button>
          <button type="button" onClick={() => setModo('autonomo')} style={{
            flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            border: modo === 'autonomo' ? '1.5px solid var(--grn)' : '0.5px solid var(--brd2)',
            background: modo === 'autonomo' ? 'var(--grn-bg)' : 'var(--sur2)',
            color: modo === 'autonomo' ? 'var(--grn)' : 'var(--tx)',
          }}>Autónomo (Modelo 130)</button>
        </div>

        {modo === 'empleado' ? <EmpleadoCard /> : <AutonomoCard />}

        <Card>
          <CardHeader title="Escala general 2026 (referencia)" />
          {TRAMOS_IRPF_2026.map((t, i) => {
            const desde = i === 0 ? 0 : TRAMOS_IRPF_2026[i - 1].hasta
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', color: 'var(--tx)' }}>
                <span>{fmtEUR(desde)} — {t.hasta === Infinity ? 'en adelante' : fmtEUR(t.hasta)}</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{(t.tasa * 100).toFixed(0)}%</span>
              </div>
            )
          })}
        </Card>
      </div>
    </ProGate>
  )
}

function EmpleadoCard() {
  const [bruto, setBruto] = useState('')
  const [hijos, setHijos] = useState('0')

  const result = useMemo(() => calcIRPFEmpleado({ brutoAnual: bruto, numHijos: hijos }), [bruto, hijos])

  return (
    <Card>
      <CardHeader title="Tu nómina" />
      <FormRow>
        <FormGroup label="Salario bruto anual (€)">
          <input type="number" inputMode="decimal" min="0" value={bruto} placeholder="0" onChange={e => setBruto(e.target.value)} />
        </FormGroup>
        <FormGroup label="Hijos a cargo">
          <select value={hijos} onChange={e => setHijos(e.target.value)}>
            {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormGroup>
      </FormRow>

      {result && (
        <>
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
              {fmtEUR(result.retencionMensual)}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
              retención mensual estimada · tipo efectivo {(result.tipoEfectivo * 100).toFixed(1)}%
            </div>
          </div>
          <div style={{ marginTop: 4, borderTop: '.5px solid var(--brd)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Neto mensual estimado</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{fmtEUR(result.netoMensual)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Cuota IRPF anual</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.cuotaAnual)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Base liquidable</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.baseLiquidable)}</span>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

function AutonomoCard() {
  const [ingresos, setIngresos] = useState('')
  const [gastos, setGastos] = useState('')
  const [reducido, setReducido] = useState(false)

  const result = useMemo(() => calcIRPFAutonomo({ ingresosTrimestre: ingresos, gastosTrimestre: gastos, primerosDosAnios: reducido }), [ingresos, gastos, reducido])

  return (
    <Card>
      <CardHeader title="Modelo 130 — pago fraccionado trimestral" />
      <FormRow>
        <FormGroup label="Ingresos del trimestre (€)">
          <input type="number" inputMode="decimal" min="0" value={ingresos} placeholder="0" onChange={e => setIngresos(e.target.value)} />
        </FormGroup>
        <FormGroup label="Gastos deducibles del trimestre (€)">
          <input type="number" inputMode="decimal" min="0" value={gastos} placeholder="0" onChange={e => setGastos(e.target.value)} />
        </FormGroup>
      </FormRow>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tx)', margin: '4px 0 12px', cursor: 'pointer' }}>
        <input type="checkbox" checked={reducido} onChange={e => setReducido(e.target.checked)} style={{ width: 16, height: 16, flexShrink: 0 }} />
        Estoy en mis primeros 2 años de actividad (tasa reducida 15%)
      </label>

      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
          {fmtEUR(result.pagoFraccionado)}
        </div>
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
          a ingresar este trimestre · tasa {(result.tasa * 100).toFixed(0)}%
        </div>
      </div>
      <div style={{ marginTop: 4, borderTop: '.5px solid var(--brd)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
          <span>Rendimiento neto</span>
          <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.rendimientoNeto)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
          <span>Gastos de difícil justificación (5%)</span>
          <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.gastosDificilJust)}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, marginTop: 14, padding: '10px 12px', background: 'var(--sur2)', borderRadius: 8, border: '.5px solid var(--brd)' }}>
        Exento si es tu primer año de actividad, facturas &lt;€15.000/año, la cuota del año anterior fue &lt;€200, o tus retenciones ya cubren &gt;90% del IRS anual estimado.
      </div>
    </Card>
  )
}
