// src/pages/ResicoMX/index.jsx
// Planificador RESICO — México. Sustituye a Afore voluntario como tarjeta
// protagonista para MX (Afore voluntario solo lo usa 7.9% de los mexicanos;
// RESICO lo usa cada freelancer, arrendador y profesionista independiente
// que declara). Solo visible si settings.country === 'MX'.

import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { calcResico, TRAMOS_RESICO, TOPE_ANUAL_RESICO, RETENCION_PERSONA_MORAL } from '../../utils/resicoMX.js'

const fmtMXN = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-MX')}`

// RESICO personas físicas cubre actividad empresarial, profesional y
// arrendamiento (Art. 113-E LISR). El sueldo de nómina tributa por sueldos y
// salarios, y las ventas de activos / rendimientos de inversión van por su
// propio régimen — ninguno de los tres entra en esta base.
const CATEGORIAS_RESICO = ['Freelance', 'Negocio propio', 'Arriendo', 'Honorarios', 'Consultoría']

const esIngresoResico = (r) =>
  CATEGORIAS_RESICO.some(c => (r?.category || '').toLowerCase().includes(c.toLowerCase()))

export default function ResicoMX() {
  const { settings, incomes } = useApp()
  const country = (settings.country || 'CL').toUpperCase()

  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const activeYear = activeMonth.slice(0, 4)

  // Ingreso facturable del mes activo — solo categorías que tributan por RESICO.
  const ingresoEstimado = useMemo(() => Math.round((incomes || [])
    .filter(r => String(r?.date || '').startsWith(activeMonth) && esIngresoResico(r))
    .reduce((s, r) => s + (Number(r.amount) || 0), 0)), [incomes, activeMonth])

  // Ingresos RESICO acumulados del ejercicio en curso — esta es la base real
  // contra la que el SAT mide el tope de $3.5M, no una proyección de un mes.
  const ingresoAcumuladoAnual = useMemo(() => Math.round((incomes || [])
    .filter(r => String(r?.date || '').startsWith(activeYear) && esIngresoResico(r))
    .reduce((s, r) => s + (Number(r.amount) || 0), 0)), [incomes, activeYear])

  const [ingreso, setIngreso] = useState('')
  // Marca si el usuario editó el ingreso a mano (para no pisarlo con el auto-relleno).
  const [ingresoTouched, setIngresoTouched] = useState(false)
  const [personaMoral, setPersonaMoral] = useState(false)

  // Auto-rellenar desde los ingresos cargados. Va en un efecto y no en el
  // inicializador de useState porque `incomes` se hidrata async desde IndexedDB:
  // en el primer render todavía está vacío y el inicializador solo corre una vez.
  useEffect(() => {
    if (!ingresoTouched && ingresoEstimado > 0) setIngreso(String(ingresoEstimado))
  }, [ingresoEstimado, ingresoTouched])

  const result = useMemo(
    () => calcResico(ingreso, {
      facturaAPersonaMoral: personaMoral,
      ingresoAcumuladoAnual,
    }),
    [ingreso, personaMoral, ingresoAcumuladoAnual]
  )

  if (country !== 'MX') {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponible solo para México 🇲🇽
      </div>
    )
  }

  const haySaldoAFavor = result && result.saldoAFavor > 0

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
                onChange={e => { setIngresoTouched(true); setIngreso(e.target.value) }} />
            </FormGroup>
          </FormRow>

          {ingresoEstimado > 0 && (
            <div style={{ marginTop: 2, marginBottom: 10, fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', lineHeight: 1.5 }}>
              {!ingresoTouched
                ? <>✓ Estimado desde tus ingresos facturables del mes (freelance, negocio propio y arriendo — no incluye sueldo de nómina). Podés ajustarlo.</>
                : <>Valor sugerido desde tus ingresos: {fmtMXN(ingresoEstimado)} · <button type="button" style={{ color: 'var(--grn)', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 0, padding: 0, font: 'inherit' }} onClick={() => { setIngresoTouched(false); setIngreso(String(ingresoEstimado)) }}>usar valor automático</button></>}
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', padding: '10px 12px', background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 8 }}>
            <input type="checkbox" checked={personaMoral} onChange={e => setPersonaMoral(e.target.checked)}
              style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--tx)', lineHeight: 1.5 }}>
              ¿Le facturás a personas morales (empresas)?
              <span style={{ display: 'block', fontSize: 11, color: 'var(--th)', marginTop: 2 }}>
                Si tu cliente es una empresa, está obligada a retenerte {(RETENCION_PERSONA_MORAL * 100).toFixed(2)}% de ISR sobre el pago (Art. 113-J LISR) y enterarlo al SAT. Esa retención se acredita contra el ISR del mes.
              </span>
            </span>
          </label>
        </Card>

        {result && (
          <Card>
            <CardHeader title="ISR RESICO del mes" />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                {haySaldoAFavor ? 'Saldo a favor' : 'A pagar al SAT'}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: haySaldoAFavor ? 'var(--pos)' : 'var(--accent)', lineHeight: 1 }}>
                {fmtMXN(haySaldoAFavor ? result.saldoAFavor : result.aPagar)}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
                Tasa {(result.tasa * 100).toFixed(2)}% sobre el ingreso total · te quedan {fmtMXN(result.neto)} netos
              </div>
            </div>

            {/* Desglose: causado − retención = a pagar / saldo a favor */}
            <div style={{ border: '.5px solid var(--brd)', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', fontSize: 12 }}>
                <span style={{ color: 'var(--th)' }}>ISR causado del mes</span>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--tx)', fontWeight: 600 }}>{fmtMXN(result.isrCausado)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', fontSize: 12, borderTop: '.5px solid var(--brd)' }}>
                <span style={{ color: 'var(--th)' }}>
                  Retención de personas morales ({(RETENCION_PERSONA_MORAL * 100).toFixed(2)}%)
                </span>
                <span style={{ fontFamily: 'var(--mono)', color: result.retencion > 0 ? 'var(--tx)' : 'var(--th)', fontWeight: 600 }}>
                  {result.retencion > 0 ? `− ${fmtMXN(result.retencion)}` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', fontSize: 12, borderTop: '.5px solid var(--brd)', background: haySaldoAFavor ? 'var(--pos-bg)' : 'var(--sur2)' }}>
                <span style={{ color: haySaldoAFavor ? 'var(--pos)' : 'var(--tx)', fontWeight: 600 }}>
                  {haySaldoAFavor ? 'Saldo a favor' : 'A pagar'}
                </span>
                <span style={{ fontFamily: 'var(--mono)', color: haySaldoAFavor ? 'var(--pos)' : 'var(--tx)', fontWeight: 700 }}>
                  {fmtMXN(haySaldoAFavor ? result.saldoAFavor : result.aPagar)}
                </span>
              </div>
            </div>

            {result.conRetencion && (
              <div style={{ fontSize: 11, color: 'var(--th)', lineHeight: 1.6, marginBottom: 14 }}>
                {haySaldoAFavor
                  ? <>Te retienen más de lo que causás: en el primer tramo la tasa RESICO ({(result.tasa * 100).toFixed(2)}%) es menor que la retención ({(RETENCION_PERSONA_MORAL * 100).toFixed(2)}%). El excedente queda como saldo a favor acreditable contra meses siguientes o solicitable en devolución.</>
                  : <>Ya te retuvieron {fmtMXN(result.retencion)} en el pago. Solo enterás la diferencia al presentar la declaración del mes.</>}
              </div>
            )}

            {result.siguienteTasa && result.margenEnTramo < result.ingreso * 0.15 && (
              <div style={{ background: 'var(--warn-bg)', border: '.5px solid var(--warn)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--warn)', marginBottom: 14, lineHeight: 1.6 }}>
                ⚠ Estás a {fmtMXN(result.margenEnTramo)} de cruzar al siguiente tramo ({(result.siguienteTasa * 100).toFixed(2)}%). Ojo: si lo cruzas, la tasa nueva aplica sobre <strong>todo</strong> el ingreso del mes, no solo el excedente — a diferencia del ISR normal.
              </div>
            )}

            {result.superaTope && (
              <div style={{ background: 'var(--red-bg)', border: '.5px solid var(--red)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--red)', marginBottom: 14, lineHeight: 1.6 }}>
                {result.topeEsProyeccion
                  ? <>⚠ <strong>Proyección lineal</strong>, no el cálculo real del SAT: si repitieras este mes 12 veces cerrarías el año en {fmtMXN(result.ingresoAnualProyectado)}, por encima del tope de {fmtMXN(TOPE_ANUAL_RESICO)}. El SAT mide ingresos <strong>acumulados del ejercicio</strong> (actual o anterior) — cargá tus ingresos del año en la app para ver el acumulado real.</>
                  : <>⚠ Tus ingresos acumulados de {activeYear} ({fmtMXN(result.baseTope)}) ya superan el tope de {fmtMXN(TOPE_ANUAL_RESICO)} — perderías la elegibilidad para RESICO y tributarías por régimen general.</>}
              </div>
            )}

            {!result.superaTope && !result.topeEsProyeccion && (
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 14, lineHeight: 1.6 }}>
                Acumulado {activeYear}: {fmtMXN(result.baseTope)} de {fmtMXN(TOPE_ANUAL_RESICO)} ({Math.round((result.baseTope / TOPE_ANUAL_RESICO) * 100)}% del tope del régimen).
              </div>
            )}

            <div style={{ marginTop: 4, borderTop: '.5px solid var(--brd)', paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                Tabla de tramos 2026 (Art. 113-E LISR)
              </div>
              {TRAMOS_RESICO.map((t, i) => {
                const desde = i === 0 ? 0 : TRAMOS_RESICO[i - 1].hasta
                const activo = i === result.tramoIdx
                const esUltimo = i === TRAMOS_RESICO.length - 1
                // Caso límite: el ingreso ya excede la tabla. El tramo se marca
                // activo por fallback, pero el rango impreso mentiría.
                const rangoFueraDeTabla = activo && esUltimo && result.fueraDeTabla
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 8px', marginBottom: 2,
                    borderRadius: 6, background: activo ? 'var(--grn-tint)' : 'transparent',
                    color: activo ? 'var(--grn)' : 'var(--tx)', fontWeight: activo ? 600 : 400,
                  }}>
                    <span>
                      {rangoFueraDeTabla
                        ? <>más de {fmtMXN(t.hasta)} · fuera de RESICO</>
                        : <>{fmtMXN(desde)} — {fmtMXN(t.hasta)}</>}
                    </span>
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
