// src/pages/ResicoMX/index.jsx
// Planificador RESICO — México. Sustituye a Afore voluntario como tarjeta
// protagonista para MX (Afore voluntario solo lo usa 7.9% de los mexicanos;
// RESICO lo usa cada freelancer, arrendador y profesionista independiente
// que declara). Solo visible si settings.country === 'MX'.

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { calcResico, TRAMOS_RESICO, TOPE_ANUAL_RESICO } from '../../utils/resicoMX.js'

const fmtMXN = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-MX')}`

export default function ResicoMX() {
  const { settings, incomes } = useApp()
  const country = (settings.country || 'CL').toUpperCase()

  if (country !== 'MX') {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponible solo para México 🇲🇽
      </div>
    )
  }

  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const ingresoEstimado = useMemo(() => Math.round((incomes || [])
    .filter(r => String(r?.date || '').startsWith(activeMonth))
    .reduce((s, r) => s + (Number(r.amount) || 0), 0)), [incomes, activeMonth])

  const [ingreso, setIngreso] = useState(ingresoEstimado || '')
  const result = useMemo(() => calcResico(ingreso), [ingreso])

  return (
    <ProGate feature="El planificador RESICO">
      <div className="stack">
        <PageHeader title="RESICO — Régimen Simplificado de Confianza" sub="Cuánto ISR pagas este mes sobre lo que facturaste" />

        <Alert type="info">
          ⚠ Estimación educativa, no asesoría fiscal. Aplica a personas físicas con actividad empresarial, profesional o arrendamiento — ingresos anuales hasta $3.5M. No sustituye tu declaración en el SAT.
        </Alert>

        <Card>
          <CardHeader title="Tu ingreso del mes" right={<span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>{activeMonth}</span>} />
          <FormRow>
            <FormGroup label="Ingreso mensual cobrado (facturado, sin IVA)">
              <input type="number" inputMode="decimal" min="0" value={ingreso} placeholder="0"
                onChange={e => setIngreso(e.target.value)} />
            </FormGroup>
          </FormRow>
        </Card>

        {result && (
          <Card>
            <CardHeader title="ISR RESICO del mes" />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                {fmtMXN(result.isr)}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
                Tasa {(result.tasa * 100).toFixed(2)}% sobre el ingreso total · te quedan {fmtMXN(result.neto)} netos
              </div>
            </div>

            {result.siguienteTasa && result.margenEnTramo < result.ingreso * 0.15 && (
              <div style={{ background: 'rgba(245,166,35,.1)', border: '.5px solid var(--amb)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--amb)', marginBottom: 14, lineHeight: 1.6 }}>
                ⚠ Estás a {fmtMXN(result.margenEnTramo)} de cruzar al siguiente tramo ({(result.siguienteTasa * 100).toFixed(2)}%). Ojo: si lo cruzas, la tasa nueva aplica sobre <strong>todo</strong> el ingreso del mes, no solo el excedente — a diferencia del ISR normal.
              </div>
            )}

            {result.superaTope && (
              <div style={{ background: 'rgba(255,77,106,.1)', border: '.5px solid var(--red)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--red)', marginBottom: 14, lineHeight: 1.6 }}>
                ⚠ A este ritmo tu ingreso anual proyectado ({fmtMXN(result.ingresoAnualProyectado)}) supera el tope de {fmtMXN(TOPE_ANUAL_RESICO)} — perderías la elegibilidad para RESICO.
              </div>
            )}

            <div style={{ marginTop: 4, borderTop: '.5px solid var(--brd)', paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                Tabla de tramos 2026 (Art. 113-E LISR)
              </div>
              {TRAMOS_RESICO.map((t, i) => {
                const desde = i === 0 ? 0 : TRAMOS_RESICO[i - 1].hasta
                const activo = i === result.tramoIdx
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 8px', marginBottom: 2,
                    borderRadius: 6, background: activo ? 'var(--grn-tint)' : 'transparent',
                    color: activo ? 'var(--grn)' : 'var(--tx)', fontWeight: activo ? 600 : 400,
                  }}>
                    <span>{fmtMXN(desde)} — {fmtMXN(t.hasta)}</span>
                    <span style={{ fontFamily: 'var(--mono)' }}>{(t.tasa * 100).toFixed(2)}%</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </ProGate>
  )
}
