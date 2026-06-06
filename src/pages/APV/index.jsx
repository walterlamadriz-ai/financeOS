// src/pages/APV/index.jsx
// Módulo APV Chile — página propia v1.4
// Solo visible si settings.country === 'CL'

import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, Btn } from '../../components/ui/index.jsx'
import { calcAPV } from '../../utils/apvCalc.js'
import { calcBeneficioAPV, calcDescuentos, calcImpuestoAnual } from '../../utils/taxCalcCL.js'

export default function APVPage() {
  const { settings, incomes } = useApp()
  const isChile = (settings.country || 'CL') === 'CL'

  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true')

  // Calcular sueldo bruto desde ingresos netos del mes activo
  // Bruto = Neto / (1 - AFP 10% - Salud 7% - Cesantía 0.6%) = Neto / 0.824
  const DESCUENTOS = 1 - 0.10 - 0.07 - 0.006  // 0.824
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)
  const ingresoNetoAPV = (incomes || [])
    .filter(r => r.date?.startsWith(activeMonth))
    .reduce((s, r) => s + r.amount, 0)
  const sueldoBrutoCalculado = ingresoNetoAPV > 0
    ? Math.round(ingresoNetoAPV / DESCUENTOS)
    : 0
  const [apvF, setApvF] = useState({
    monthlyContribution: isDemo ? '150000' : '',
    currentBalance:      isDemo ? '2000000' : '',
    currentAge:          isDemo ? '32' : '',
    targetAge:           65,
    expectedReturn:      5,
    regime:              isDemo ? 'B' : 'unsure',
    grossMonthly:        isDemo ? '2000000' : (sueldoBrutoCalculado > 0 ? String(sueldoBrutoCalculado) : ''),
    annualBonus:         isDemo ? '1000000' : ''
  })
  const [apvResult, setApvResult]   = useState(null)
  const [taxResult, setTaxResult]   = useState(null)

  if (!isChile) return (
    <div style={{padding:32,textAlign:'center',color:'var(--th)',fontFamily:'var(--mono)',fontSize:13}}>
      Este módulo está disponible solo para Chile 🇨🇱
    </div>
  )

  function calcular() {
    const r = calcAPV({
      currentBalance: Number(apvF.currentBalance) || 0,
      monthlyContribution: Number(apvF.monthlyContribution),
      currentAge: Number(apvF.currentAge),
      targetAge: Number(apvF.targetAge),
      expectedReturn: Number(apvF.expectedReturn) || 5
    })
    setApvResult(r)
    if (apvF.grossMonthly && Number(apvF.grossMonthly) > 0) {
      const t = calcBeneficioAPV({
        sueldoBrutoMensual: Number(apvF.grossMonthly),
        bonoAnual: Number(apvF.annualBonus) || 0,
        apvMensual: Number(apvF.monthlyContribution),
      })
      setTaxResult(t)
    } else {
      setTaxResult(null)
    }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <Card>
        <CardHeader title="🇨🇱 APV Chile — Simulador orientativo" />
        <div style={{fontSize:11,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:14,lineHeight:1.6,padding:'8px 10px',background:'rgba(255,165,0,.07)',borderRadius:6,border:'0.5px solid rgba(255,165,0,.2)'}}>
          ⚠ Simulación orientativa. No constituye asesoría financiera, tributaria, previsional ni legal. Consulta con tu administradora APV o el SII.
        </div>

        {/* ── PASO 1: Situación actual ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16,marginBottom:16,alignItems:'start'}}>
          <div style={{padding:'14px',background:'var(--sur2)',borderRadius:8,border:'0.5px solid var(--brd)'}}>
            <div style={{fontSize:11,fontWeight:600,color:'var(--tx)',marginBottom:10,fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.5px'}}>① Tu situación actual</div>
            <FormRow>
              <FormGroup label="Sueldo bruto mensual ($)"><input type="number" min="0" value={apvF.grossMonthly} placeholder="ej. 2000000" onChange={e => setApvF(p => ({...p, grossMonthly: e.target.value}))} /></FormGroup>
              <FormGroup label="Bono anual estimado ($)"><input type="number" min="0" value={apvF.annualBonus} placeholder="0 (opcional)" onChange={e => setApvF(p => ({...p, annualBonus: e.target.value}))} /></FormGroup>
            </FormRow>
            {apvF.grossMonthly && Number(apvF.grossMonthly) > 0 && (() => {
              const gm = Number(apvF.grossMonthly)
              const desc = calcDescuentos(gm)
              const rentaAnual = gm * 12 + (Number(apvF.annualBonus) || 0)
              const baseAnual = Math.max(0, rentaAnual - desc.total * 12)
              const imp = calcImpuestoAnual(baseAnual)
              return (
                <div style={{marginTop:12}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
                    <div style={{background:'var(--bg)',borderRadius:6,padding:'8px 12px'}}>
                      <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:2}}>Líquido mensual est.</div>
                      <div style={{fontSize:15,fontWeight:700,color:'var(--tx)',fontFamily:'var(--mono)'}}>${desc.liquido.toLocaleString()}</div>
                    </div>
                    <div style={{background:'var(--bg)',borderRadius:6,padding:'8px 12px'}}>
                      <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:2}}>Impuesto anual sin APV</div>
                      <div style={{fontSize:15,fontWeight:700,color:'var(--tx)',fontFamily:'var(--mono)'}}>${imp.impuesto.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',background:'var(--bg)',padding:'4px 8px',borderRadius:4}}>AFP: ${desc.afp.toLocaleString()}/mes</div>
                    <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',background:'var(--bg)',padding:'4px 8px',borderRadius:4}}>Salud: ${desc.salud.toLocaleString()}/mes</div>
                    <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',background:'var(--bg)',padding:'4px 8px',borderRadius:4}}>Cesantía: ${desc.cesantia.toLocaleString()}/mes</div>
                    <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',background:'var(--bg)',padding:'4px 8px',borderRadius:4}}>Tramo {imp.tramo} · {(imp.tasaMarginal*100).toFixed(0)}% marginal</div>
                  </div>
                  <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',marginTop:6}}>Descuentos orientativos: AFP 10% + Salud 7% + Cesantía 0.6%</div>
                </div>
              )
            })()}
          </div>

          {/* ── PASO 2: Simulación APV ── */}
          <div style={{padding:'14px',background:'var(--sur2)',borderRadius:8,border:'0.5px solid var(--brd)'}}>
            <div style={{fontSize:11,fontWeight:600,color:'var(--tx)',marginBottom:10,fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.5px'}}>② Simular aporte APV</div>
            <FormRow>
              <FormGroup label="Aporte mensual APV ($)"><input type="number" min="0" value={apvF.monthlyContribution} placeholder="ej. 150000" onChange={e => setApvF(p => ({...p, monthlyContribution: e.target.value}))} /></FormGroup>
              <FormGroup label="Saldo APV actual ($)"><input type="number" min="0" value={apvF.currentBalance} placeholder="0 (opcional)" onChange={e => setApvF(p => ({...p, currentBalance: e.target.value}))} /></FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup label="Edad actual"><input type="number" min="18" max="80" value={apvF.currentAge} placeholder="ej. 32" onChange={e => setApvF(p => ({...p, currentAge: e.target.value}))} /></FormGroup>
              <FormGroup label="Edad objetivo jubilación"><input type="number" min="50" max="90" value={apvF.targetAge} placeholder="65" onChange={e => setApvF(p => ({...p, targetAge: e.target.value}))} /></FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup label="Rentabilidad anual esperada (%)"><input type="number" min="0" max="20" step="0.5" value={apvF.expectedReturn} placeholder="5" onChange={e => setApvF(p => ({...p, expectedReturn: e.target.value}))} /></FormGroup>
              <FormGroup label="Régimen APV (informativo)">
                <select value={apvF.regime} onChange={e => setApvF(p => ({...p, regime: e.target.value}))}>
                  <option value="unsure">No estoy seguro</option>
                  <option value="A">Régimen A — bonificación 15%</option>
                  <option value="B">Régimen B — rebaja base imponible</option>
                </select>
              </FormGroup>
            </FormRow>
            <Btn variant="primary" onClick={calcular}>Calcular proyección →</Btn>
          </div>
        </div>

        {/* ── RESULTADOS ── */}
        {apvResult && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Fila 1: lado a lado */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16,alignItems:'start'}}>
              {/* Bloque 1: Impacto tributario */}
              {taxResult && (
                <div style={{background:'var(--sur2)',borderRadius:10,padding:'16px',border:'0.5px solid var(--brd)'}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--tx)',marginBottom:4,fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.5px'}}>① Impacto tributario este año</div>
                  <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:14,lineHeight:1.4}}>Aporte mensual ${Number(apvF.monthlyContribution).toLocaleString()} × 12 = ${(Number(apvF.monthlyContribution)*12).toLocaleString()}/año</div>
                  <div style={{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
                    {(() => {
                      const total = taxResult.impuestoSinAPV
                      const mejor = taxResult.mayorBeneficio === 'B' ? taxResult.ahorroRegB : taxResult.ahorroRegA
                      const pct = total > 0 ? mejor / total : 0
                      const r = 40, cx = 50, cy = 50
                      const circ = 2 * Math.PI * r
                      const dash = pct * circ
                      return (
                        <div style={{flexShrink:0,textAlign:'center'}}>
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--brd)" strokeWidth="12"/>
                            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--grn)" strokeWidth="12"
                              strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"/>
                            <text x={cx} y={cy-6} textAnchor="middle" fontSize="10" fill="var(--grn)" fontWeight="700" fontFamily="var(--mono)">{(pct*100).toFixed(0)}%</text>
                            <text x={cx} y={cy+8} textAnchor="middle" fontSize="7" fill="var(--th)" fontFamily="var(--mono)">ahorro</text>
                          </svg>
                          <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)'}}>vs impuesto sin APV</div>
                        </div>
                      )
                    })()}
                    <div style={{flex:1,minWidth:200}}>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'var(--bg)',borderRadius:6}}>
                          <span style={{fontSize:12,fontFamily:'var(--mono)',color:'var(--th)'}}>Sin APV</span>
                          <span style={{fontSize:12,fontFamily:'var(--mono)',color:'var(--tx)',fontWeight:600}}>${taxResult.impuestoSinAPV.toLocaleString()}/año</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(10,92,62,.06)',borderRadius:6,border:'0.5px solid rgba(10,92,62,.2)'}}>
                          <span style={{fontSize:12,fontFamily:'var(--mono)',color:'var(--grn)'}}>Reg. A → ahorro</span>
                          <span style={{fontSize:12,fontFamily:'var(--mono)',color:'var(--grn)',fontWeight:700}}>+${taxResult.ahorroRegA.toLocaleString()}/año</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(10,92,62,.06)',borderRadius:6,border:'0.5px solid rgba(10,92,62,.2)'}}>
                          <span style={{fontSize:12,fontFamily:'var(--mono)',color:'var(--grn)'}}>Reg. B → ahorro</span>
                          <span style={{fontSize:12,fontFamily:'var(--mono)',color:'var(--grn)',fontWeight:700}}>+${taxResult.ahorroRegB.toLocaleString()}/año</span>
                        </div>
                        <div style={{padding:'6px 12px',background:'var(--bg)',borderRadius:6}}>
                          <span style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)'}}>Mayor beneficio orientativo: </span>
                          <span style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--grn)',fontWeight:700}}>Régimen {taxResult.mayorBeneficio}</span>
                          <span style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)'}}> · Tramo {taxResult.tramoActual} · {(taxResult.tasaMarginal*100).toFixed(0)}% marginal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{marginTop:10,fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',lineHeight:1.5}}>
                    Estimación anual orientativa. UTM ref. ${taxResult.UTMref.toLocaleString()} · AFP 10% + Salud 7% + Cesantía 0.6%. No constituye asesoría tributaria. Consulta con el SII.
                  </div>
                </div>
              )}

              {/* Bloque 2: Proyección al jubilar */}
              <div style={{background:'var(--sur2)',borderRadius:10,padding:'16px',border:'0.5px solid var(--brd)'}}>
                <div style={{fontSize:11,fontWeight:600,color:'var(--tx)',marginBottom:4,fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.5px'}}>② Proyección acumulada al jubilar</div>
                <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:14,lineHeight:1.4}}>Con ${Number(apvF.monthlyContribution).toLocaleString()}/mes al {apvF.expectedReturn}% anual — valores en CLP nominal orientativos</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
                  <div style={{background:'var(--bg)',borderRadius:8,padding:'10px 12px',borderBottom:'2px solid var(--grn)'}}>
                    <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:4}}>EMPEZANDO HOY</div>
                    <div style={{fontSize:16,fontWeight:700,color:'var(--grn)',fontFamily:'var(--mono)'}}>{apvResult.projectionToday>=1000000?'$'+(apvResult.projectionToday/1000000).toFixed(1)+'M':'$'+apvResult.projectionToday.toLocaleString()}</div>
                    <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',marginTop:2}}>acumulado est. al retiro</div>
                  </div>
                  <div style={{background:'var(--bg)',borderRadius:8,padding:'10px 12px',borderBottom:'2px solid var(--brd)'}}>
                    <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:4}}>EN 5 AÑOS MÁS</div>
                    <div style={{fontSize:16,fontWeight:700,color:'var(--tx)',fontFamily:'var(--mono)'}}>{apvResult.projection5years>=1000000?'$'+(apvResult.projection5years/1000000).toFixed(1)+'M':'$'+apvResult.projection5years.toLocaleString()}</div>
                    <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',marginTop:2}}>si empezás en 5 años</div>
                  </div>
                  <div style={{background:'var(--bg)',borderRadius:8,padding:'10px 12px',borderBottom:'2px solid #e84142'}}>
                    <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:4}}>COSTO DE ESPERAR</div>
                    <div style={{fontSize:16,fontWeight:700,color:'#e84142',fontFamily:'var(--mono)'}}>-{apvResult.difference>=1000000?'$'+(apvResult.difference/1000000).toFixed(1)+'M':'$'+apvResult.difference.toLocaleString()}</div>
                    <div style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',marginTop:2}}>menos al jubilar</div>
                  </div>
                </div>
                <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:8}}>Crecimiento estimado por edad:</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {apvResult.chartPoints.map(pt => (
                    <div key={pt.age}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                        <span style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)'}}>{pt.age} años</span>
                        <span style={{fontSize:10,color:'var(--grn)',fontFamily:'var(--mono)',fontWeight:600}}>{pt.today>=1000000?'$'+(pt.today/1000000).toFixed(1)+'M':'$'+pt.today.toLocaleString()}</span>
                      </div>
                      <div style={{position:'relative',height:8,background:'var(--brd)',borderRadius:4,overflow:'hidden'}}>
                        <div style={{position:'absolute',height:'100%',width:Math.min(100,pt.in5years/apvResult.projectionToday*100)+'%',background:'rgba(10,92,62,.2)',borderRadius:4}}/>
                        <div style={{position:'absolute',height:'100%',width:Math.min(100,pt.today/apvResult.projectionToday*100)+'%',background:'var(--grn)',borderRadius:4,opacity:.85}}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:12,marginTop:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:10,height:10,borderRadius:2,background:'var(--grn)',opacity:.85}}/><span style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)'}}>Empezando hoy</span></div>
                  <div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:10,height:10,borderRadius:2,background:'rgba(10,92,62,.2)'}}/><span style={{fontSize:9,color:'var(--th)',fontFamily:'var(--mono)'}}>En 5 años más</span></div>
                </div>
                {apvF.regime !== 'unsure' && (
                  <div style={{marginTop:12,padding:'8px 12px',background:'var(--bg)',borderRadius:6,fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',lineHeight:1.6}}>
                    {apvF.regime === 'A' ? '📌 Reg. A: Bonificación estatal 15% del aporte anual (tope ~6 UTM). No rebaja base imponible.' : '📌 Reg. B: Rebaja base imponible. Tope orientativo 600 UF anuales. Sin bonificación directa.'}
                  </div>
                )}
                <div style={{marginTop:10,fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',lineHeight:1.5}}>
                  Proyección en CLP nominal con {apvF.expectedReturn}% anual. La rentabilidad pasada no garantiza resultados futuros. Consulta con tu administradora APV.
                </div>
              </div>
            </div>

            {/* Fila 2: Estimación tributaria ancho completo */}
            {taxResult && (
              <div style={{background:'var(--sur2)',borderRadius:10,padding:'16px',border:'0.5px solid var(--brd)'}}>
                <div style={{fontSize:11,fontWeight:600,color:'var(--tx)',marginBottom:4,fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:'.5px'}}>Estimación tributaria orientativa</div>
                <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:12,lineHeight:1.5,padding:'6px 10px',background:'rgba(0,0,0,.03)',borderRadius:4}}>Resultados en base anual · Aporte mensual ${Number(apvF.monthlyContribution).toLocaleString()} × 12 = ${(Number(apvF.monthlyContribution)*12).toLocaleString()}/año</div>
                <div style={{display:'flex',flexDirection:'column',gap:0,border:'0.5px solid var(--brd)',borderRadius:8,overflow:'hidden',marginBottom:12}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',background:'var(--sur2)'}}>
                    <div style={{padding:'8px 12px',fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',textTransform:'uppercase',letterSpacing:'.5px'}}>Situación</div>
                    <div style={{padding:'8px 12px',fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',textTransform:'uppercase',letterSpacing:'.5px',borderLeft:'0.5px solid var(--brd)'}}>Impuesto anual est. ($)</div>
                    <div style={{padding:'8px 12px',fontSize:10,fontFamily:'var(--mono)',color:'var(--grn)',textTransform:'uppercase',letterSpacing:'.5px',borderLeft:'0.5px solid var(--brd)'}}>Ahorro anual est. ($)</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderTop:'0.5px solid var(--brd)'}}>
                    <div style={{padding:'10px 12px',fontSize:12,fontFamily:'var(--mono)',color:'var(--tx)'}}>Sin APV</div>
                    <div style={{padding:'10px 12px',fontSize:12,fontFamily:'var(--mono)',color:'var(--tx)',borderLeft:'0.5px solid var(--brd)'}}>${taxResult.impuestoSinAPV.toLocaleString()}</div>
                    <div style={{padding:'10px 12px',fontSize:12,fontFamily:'var(--mono)',color:'var(--th)',borderLeft:'0.5px solid var(--brd)'}}>—</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderTop:'0.5px solid var(--brd)',background:'var(--sur2)'}}>
                    <div style={{padding:'10px 12px',fontSize:12,fontFamily:'var(--mono)',color:'var(--tx)'}}>Régimen A</div>
                    <div style={{padding:'10px 12px',fontSize:12,fontFamily:'var(--mono)',color:'var(--tx)',borderLeft:'0.5px solid var(--brd)'}}>${(taxResult.impuestoSinAPV-taxResult.ahorroRegA).toLocaleString()}</div>
                    <div style={{padding:'10px 12px',fontSize:12,fontFamily:'var(--mono)',color:'var(--grn)',fontWeight:600,borderLeft:'0.5px solid var(--brd)'}}>+${taxResult.ahorroRegA.toLocaleString()}</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderTop:'0.5px solid var(--brd)'}}>
                    <div style={{padding:'10px 12px',fontSize:12,fontFamily:'var(--mono)',color:'var(--tx)'}}>Régimen B</div>
                    <div style={{padding:'10px 12px',fontSize:12,fontFamily:'var(--mono)',color:'var(--tx)',borderLeft:'0.5px solid var(--brd)'}}>${taxResult.impuestoConRegB.toLocaleString()}</div>
                    <div style={{padding:'10px 12px',fontSize:12,fontFamily:'var(--mono)',color:'var(--grn)',fontWeight:600,borderLeft:'0.5px solid var(--brd)'}}>+${taxResult.ahorroRegB.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                  <div style={{background:'var(--bg)',borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:4}}>Tramo impuesto</div>
                    <div style={{fontSize:14,fontWeight:700,color:'var(--tx)',fontFamily:'var(--mono)'}}>Tramo {taxResult.tramoActual}</div>
                    <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)'}}>{(taxResult.tasaMarginal*100).toFixed(0)}% tasa marginal</div>
                  </div>
                  <div style={{background:'var(--bg)',borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginBottom:4}}>Mayor beneficio orientativo</div>
                    <div style={{fontSize:14,fontWeight:700,color:'var(--grn)',fontFamily:'var(--mono)'}}>Régimen {taxResult.mayorBeneficio}</div>
                    <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)'}}>+${taxResult.mayorBeneficio==='A'?taxResult.ahorroRegA.toLocaleString():taxResult.ahorroRegB.toLocaleString()}/año est.</div>
                  </div>
                </div>
                <div style={{padding:'8px 12px',background:'rgba(0,0,0,.03)',borderRadius:6,fontSize:9,color:'var(--th)',fontFamily:'var(--mono)',lineHeight:1.6}}>
                  Estimación anual orientativa basada en aporte mensual × 12. UTM referencial ${taxResult.UTMref.toLocaleString()} · Descuentos AFP 10% + Salud 7% + Cesantía 0.6% (orientativos). No constituye asesoría tributaria ni previsional. Consulta con un contador o el SII.
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
