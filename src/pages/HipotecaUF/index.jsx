// src/pages/HipotecaUF/index.jsx
// Simulador de dividendo hipotecario — Chile. El pain cotidiano #1 de quien
// tiene crédito en Chile: el dividendo en UF no cambia, pero su valor en CLP
// sube todos los meses porque la UF se reajusta. Solo visible si country=CL.

import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { calcDividendoUF, proyeccionCLP, calcPrepago, CRECIMIENTO_UF_DEFAULT } from '../../utils/hipotecaCL.js'
import { loadIndicadores } from '../../utils/indicadores.js'

const fmtCLP = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`
const fmtUF = (n) => `${(Number(n) || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 })} UF`

export default function HipotecaUF() {
  const { settings } = useApp()
  const country = (settings.country || 'CL').toUpperCase()

  if (country !== 'CL') {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponible solo para Chile 🇨🇱
      </div>
    )
  }

  const [uf, setUf] = useState(null)
  useEffect(() => { loadIndicadores().then(ind => setUf(ind.uf)) }, [])

  const [saldo, setSaldo] = useState('')
  const [tasa, setTasa] = useState('4.5')
  const [plazo, setPlazo] = useState('20')
  const [crecimiento, setCrecimiento] = useState(String(CRECIMIENTO_UF_DEFAULT))
  const [prepago, setPrepago] = useState('')

  const dividendoUF = useMemo(
    () => calcDividendoUF(saldo, tasa, plazo),
    [saldo, tasa, plazo]
  )

  const proyeccion = useMemo(
    () => uf && dividendoUF > 0 ? proyeccionCLP(dividendoUF, uf, crecimiento) : [],
    [dividendoUF, uf, crecimiento]
  )

  const impactoPrepago = useMemo(
    () => calcPrepago(saldo, tasa, plazo, prepago),
    [saldo, tasa, plazo, prepago]
  )

  return (
    <ProGate feature="El simulador de dividendo hipotecario">
      <div className="stack">
        <PageHeader title="Dividendo hipotecario en UF" sub="Por qué tu dividendo sube aunque tu crédito no cambie" />

        <Alert type="info">
          ⚠ Estimación educativa, no asesoría financiera. Sistema francés (cuota fija en UF) — el más común en créditos hipotecarios chilenos. Tu banco puede usar otro sistema o tener condiciones distintas.
        </Alert>

        <Card>
          <CardHeader title="Tu crédito" right={uf && <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)' }}>UF hoy: {fmtUF(uf)}</span>} />
          <FormRow>
            <FormGroup label="Saldo insoluto (UF)">
              <input type="number" inputMode="decimal" min="0" value={saldo} placeholder="0"
                onChange={e => setSaldo(e.target.value)} />
            </FormGroup>
            <FormGroup label="Tasa de interés anual (%)">
              <input type="number" inputMode="decimal" min="0" step="0.1" value={tasa}
                onChange={e => setTasa(e.target.value)} />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Plazo restante (años)">
              <input type="number" inputMode="decimal" min="1" value={plazo}
                onChange={e => setPlazo(e.target.value)} />
            </FormGroup>
            <FormGroup label="Crecimiento UF proyectado (% anual)">
              <input type="number" inputMode="decimal" min="0" step="0.1" value={crecimiento}
                onChange={e => setCrecimiento(e.target.value)} />
            </FormGroup>
          </FormRow>
        </Card>

        {dividendoUF > 0 && uf && (
          <Card>
            <CardHeader title="Tu dividendo" />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                {fmtCLP(dividendoUF * uf)}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
                {fmtUF(dividendoUF)} al mes · valor de hoy
              </div>
            </div>

            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10, borderTop: '.5px solid var(--brd)', paddingTop: 12 }}>
              Cómo sube tu dividendo (mismo monto en UF, más pesos)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
              {proyeccion.map(p => (
                <div key={p.anios} style={{ background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 4 }}>en {p.anios} {p.anios === 1 ? 'año' : 'años'}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--tx)' }}>{fmtCLP(p.clp)}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {dividendoUF > 0 && (
          <Card>
            <CardHeader title="¿Qué pasa si prepago hoy?" />
            <FormRow>
              <FormGroup label="Monto a prepagar (UF)">
                <input type="number" inputMode="decimal" min="0" value={prepago} placeholder="0"
                  onChange={e => setPrepago(e.target.value)} />
              </FormGroup>
            </FormRow>
            {impactoPrepago.mesesAhorrados > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <div style={{ background: 'var(--grn-tint)', border: '.5px solid color-mix(in srgb, var(--grn) 35%, transparent)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 4 }}>ACORTAS TU CRÉDITO EN</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--grn)' }}>
                    {Math.floor(impactoPrepago.mesesAhorrados / 12)} años {impactoPrepago.mesesAhorrados % 12} meses
                  </div>
                </div>
                <div style={{ background: 'var(--grn-tint)', border: '.5px solid color-mix(in srgb, var(--grn) 35%, transparent)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginBottom: 4 }}>AHORRAS EN INTERÉS (NETO)</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--grn)' }}>
                    {fmtUF(impactoPrepago.interesesAhorradosNetosUF)}{uf && <span style={{ fontSize: 12, fontWeight: 400 }}> · {fmtCLP(impactoPrepago.interesesAhorradosNetosUF * uf)}</span>}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6, lineHeight: 1.5 }}>
                    {fmtUF(impactoPrepago.interesesAhorradosUF)} de interés ahorrado − {fmtUF(impactoPrepago.comisionPrepagoUF)} de comisión de prepago
                  </div>
                </div>
              </div>
            )}
            {impactoPrepago.mesesAhorrados > 0 && (
              <div style={{ marginTop: 12, fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--th)', lineHeight: 1.6, padding: '8px 10px', background: 'var(--sur2)', border: '.5px solid var(--brd)', borderRadius: 'var(--r)' }}>
                La comisión de prepago se estima en el <strong>máximo legal</strong>: 1,5 meses de interés sobre el capital prepagado, el tope que fija la Ley 18.010 art. 10 para créditos reajustables (en UF).
                Tu banco puede cobrar menos, o nada — revisa tu escritura antes de decidir.
              </div>
            )}
          </Card>
        )}
      </div>
    </ProGate>
  )
}
