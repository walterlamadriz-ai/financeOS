// src/pages/Reports/index.jsx — v1.5
import { useMemo, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { useApp } from '../../context/AppContext.jsx'
import { KPI, Card, CardHeader, Alert, Empty, PageHeader } from '../../components/ui/index.jsx'
import { fmtMoney, fmtPct } from '../../utils/index.js'
import { ReportsDisclaimer } from '../../components/legal/MicroCopy.jsx'
import { CURRENCY_SYMBOLS, monthLabel } from '../shared/constants.js'
import MonthSelector from '../shared/MonthSelector.jsx'
import MoneyFlow from '../../components/charts/MoneyFlow.jsx'
import CategoryDonut from '../../components/charts/CategoryDonut.jsx'
import useSubscriptionMetrics from '../../hooks/useSubscriptionMetrics.js'
import ReportPDF from './ReportPDF.jsx'
import { evaluateCoach, calcCoachMetrics } from '../../data/coachRules.js'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  AreaChart, Area, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'

export default function Reports() {
  const { incomes, expenses, budgets, debts: allDebts, subscriptions: allSubs, settings } = useApp()
  const sym        = CURRENCY_SYMBOLS[settings.currency] || '$'
  const subMetrics = useSubscriptionMetrics()
  const [pdfLoading, setPdfLoading] = useState(false)
  const activeMonth = settings.activeMonth || new Date().toISOString().slice(0, 7)

  async function downloadPDF() {
    setPdfLoading(true)
    try {
      const data = {
        sym, month: activeMonth, monthLabel: monthLabel(activeMonth),
        totalIncome, totalExpense, totalSubs, totalDebt, balance, savingRate,
        savingGoalPct: settings.savingGoalPct || 25,
        necesidad, deseos, expByCat, trendData, overBudget,
        currency: settings.currency || 'CLP',
        generatedAt: new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
      }
      const blob = await pdf(<ReportPDF data={data} />).toBlob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `FinanceOS-Reporte-${activeMonth}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setPdfLoading(false)
    }
  }

  const mIncomes    = useMemo(() => incomes.filter(r => r.date?.startsWith(activeMonth)), [incomes, activeMonth])
  const mExpenses   = useMemo(() => expenses.filter(r => r.date?.startsWith(activeMonth)), [expenses, activeMonth])

  const totalIncome  = useMemo(() => mIncomes.reduce((s,r)  => s+r.amount, 0), [mIncomes])
  const totalExpense = useMemo(() => mExpenses.reduce((s,r) => s+r.amount, 0), [mExpenses])
  const totalSubs    = useMemo(() => (Array.isArray(allSubs)?allSubs:[]).filter(s=>s?.status==='active').reduce((s,sub) => {
    const amt=Number(sub.amount)||0, f=sub.frequency||'monthly'
    if(f==='annual'||f==='anual') return s+amt/12
    if(f==='quarterly') return s+amt/3
    if(f==='weekly') return s+amt*4.33
    return s+amt
  }, 0), [allSubs])
  const totalDebt    = useMemo(() => (Array.isArray(allDebts)?allDebts:[]).reduce((s,d) => s+(Number(d.minPayment)||0), 0), [allDebts])
  const balance      = totalIncome - totalExpense - totalDebt - totalSubs
  const savingRate   = totalIncome > 0 ? Math.max(0, balance)/totalIncome : 0
  const necesidad    = useMemo(() => mExpenses.filter(r=>r.type==='Necesidad').reduce((s,r) => s+r.amount, 0), [mExpenses])
  const deseos       = useMemo(() => mExpenses.filter(r=>r.type==='Deseo').reduce((s,r) => s+r.amount, 0), [mExpenses])
  const expByCat     = useMemo(() => { const m={}; mExpenses.forEach(e=>{m[e.category]=(m[e.category]||0)+e.amount}); return m }, [mExpenses])
  const overBudget   = useMemo(() => budgets.filter(b=>(expByCat[b.category]||0)>b.limit), [budgets, expByCat])
  const neededToSave = Math.max(0, totalIncome*(settings.savingGoalPct/100||0.25)-Math.max(0,balance))

  const trendData = useMemo(() => {
    const months = []
    for (let i=5; i>=0; i--) {
      const d=new Date(); d.setMonth(d.getMonth()-i)
      const key=d.toISOString().slice(0,7)
      const lbl=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()]
      const inc=incomes.filter(r=>r.date?.startsWith(key)).reduce((s,r)=>s+r.amount,0)
      const exp=expenses.filter(r=>r.date?.startsWith(key)).reduce((s,r)=>s+r.amount,0)
      months.push({mes:lbl, Ingresos:inc, Gastos:exp, Ahorro:Math.max(0,inc-exp)})
    }
    return months
  }, [incomes, expenses])

  const coachSignals = useMemo(() => {
    if (mIncomes.length === 0 && mExpenses.length === 0) return []
    const metrics = calcCoachMetrics({ incomes, expenses, budgets, debts: allDebts, goals: [], subs: allSubs, settings })
    return evaluateCoach(metrics)
  }, [incomes, expenses, budgets, allDebts, allSubs, settings, mIncomes.length, mExpenses.length])

  const SEV_COLOR = { warning: 'var(--red)', attention: 'var(--amb)', info: 'var(--accent)' }
  const SEV_ICON  = { warning: '⊗', attention: '⚠', info: '◈' }

  const axisStyle = {fill:'var(--th)',fontSize:10}
  const gridStyle = {stroke:'rgba(0,0,0,0.05)',strokeDasharray:'3 3'}
  const ttStyle   = {background:'var(--sur)',border:'0.5px solid var(--brd2)',borderRadius:8,padding:'8px 12px',fontSize:11,fontFamily:'var(--mono)'}

  return (
    <div className="stack">
      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:8}}>
        <PageHeader title="Reportes" sub={`${monthLabel(activeMonth)} · orientación general, no asesoría certificada`} />
        <MonthSelector incomes={incomes} expenses={expenses} />
        <button
          onClick={downloadPDF}
          disabled={pdfLoading}
          style={{
            marginLeft:'auto', display:'flex', alignItems:'center', gap:6,
            padding:'7px 14px', borderRadius:8, border:'.5px solid var(--grn)',
            background: pdfLoading ? 'var(--sur2)' : 'var(--grn)', color: pdfLoading ? 'var(--th)' : '#0f1923',
            fontFamily:'var(--mono)', fontWeight:700, fontSize:12, cursor: pdfLoading ? 'wait' : 'pointer',
            transition:'.2s', flexShrink:0,
          }}
        >
          {pdfLoading ? '⏳ Generando…' : '⬇ Descargar PDF'}
        </button>
      </div>
      <div className="kpi-row">
        <KPI label="Balance neto"  value={fmtMoney(balance,sym)} color={balance>=0?'green':'red'} />
        <KPI label="Tasa ahorro"   value={fmtPct(savingRate)} color={savingRate>=0.25?'green':savingRate>=0.1?'amber':'red'} sub={`Meta: ${settings.savingGoalPct||25}%`} />
        <KPI label="Ingresos"      value={fmtMoney(totalIncome,sym)} />
        <KPI label="Suscripciones" value={fmtMoney(totalSubs,sym)} color="amber" sub="pagos recurrentes" />
        <KPI label="Gastos"        value={fmtMoney(totalExpense,sym)} color="red" />
      </div>
      <div className="grid2">
        <Card>
          <CardHeader title="Flujo de dinero del mes" />
          <MoneyFlow incomes={mIncomes} expenses={mExpenses} subscriptions={Array.isArray(allSubs)?allSubs:[]} debts={Array.isArray(allDebts)?allDebts:[]} sym={sym} />
        </Card>
        <Card>
          <CardHeader title="Gastos por categoría" />
          <CategoryDonut records={mExpenses} sym={sym} maxCategories={6} />
        </Card>
        <Card>
          <CardHeader title="Regla 50/30/20" />
          {totalIncome === 0 ? <Empty text="Registra ingresos para ver el análisis" /> : (() => {
            const rules = [
              {label:'Necesidades + Deudas', actual:necesidad+totalDebt, ideal:totalIncome*0.5, color:'var(--grn)', max:50},
              {label:'Deseos',               actual:deseos,              ideal:totalIncome*0.3, color:'var(--amb)', max:30},
              {label:'Ahorro',               actual:Math.max(0,balance), ideal:totalIncome*0.2, color:'var(--blu)', max:20},
            ]
            return (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {rules.map(r => {
                  const actualPct = totalIncome>0 ? r.actual/totalIncome*100 : 0
                  const ok = r.label==='Ahorro' ? actualPct>=r.max : actualPct<=r.max
                  return (
                    <div key={r.label}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}}>
                        <span style={{fontWeight:500}}>{r.label}</span>
                        <span style={{fontFamily:'var(--mono)',color:ok?'var(--grn)':'var(--red)',fontSize:11}}>{actualPct.toFixed(1)}% / {r.max}% ideal {ok?'✓':'⚠'}</span>
                      </div>
                      <div style={{height:8,background:'var(--sur3)',borderRadius:4,overflow:'hidden'}}>
                        <div style={{height:'100%',width:Math.min(actualPct/r.max*100,100)+'%',background:ok?r.color:'var(--red)',borderRadius:4,transition:'width .4s'}}/>
                      </div>
                      <div style={{fontSize:10,color:'var(--th)',fontFamily:'var(--mono)',marginTop:2,display:'flex',justifyContent:'space-between'}}>
                        <span>{fmtMoney(r.actual,sym)}</span><span>ideal: {fmtMoney(r.ideal,sym)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </Card>
        <Card>
          <CardHeader title="Tendencia 6 meses — Ingresos vs Gastos" />
          {trendData.every(d=>d.Ingresos===0&&d.Gastos===0) ? <Empty text="Registra ingresos y gastos para ver la tendencia" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} barGap={4} barCategoryGap="30%">
                <CartesianGrid {...gridStyle}/>
                <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false}/>
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':v}/>
                <RTooltip contentStyle={ttStyle}/>
                <Legend wrapperStyle={{fontSize:11,fontFamily:'var(--mono)',paddingTop:8}}/>
                <Bar dataKey="Ingresos" fill="var(--grn)" radius={[3,3,0,0]} opacity={0.85}/>
                <Bar dataKey="Gastos"   fill="var(--red)" radius={[3,3,0,0]} opacity={0.75}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
      <Card>
        <CardHeader title="Evolución del ahorro mensual" />
        {trendData.every(d=>d.Ahorro===0) ? <Empty text="Sin datos de ahorro aún" /> : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="ahorroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--grn)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--grn)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle}/>
              <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false}/>
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':v}/>
              <RTooltip contentStyle={ttStyle}/>
              <ReferenceLine y={0} stroke="var(--brd2)"/>
              <Area type="monotone" dataKey="Ahorro" name="Ahorro neto" stroke="var(--grn)" strokeWidth={2} fill="url(#ahorroGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
      <Card>
        <CardHeader title="Recomendaciones automáticas" />
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {totalIncome===0
            ? <Alert type="info">Registra tus ingresos y gastos para ver recomendaciones personalizadas.</Alert>
            : savingRate>=0.25
              ? <Alert type="ok">✓ Tu tasa de ahorro ({fmtPct(savingRate)}) supera la meta del {settings.savingGoalPct||25}%. Considera destinar el excedente a metas prioritarias o reducir deuda de alto interés.</Alert>
              : <Alert type="warn">→ Tasa de ahorro actual: {fmtPct(savingRate)}. Para llegar al {settings.savingGoalPct||25}% necesitas {balance<0?'reducir gastos en '+fmtMoney(-balance+totalIncome*(settings.savingGoalPct/100||0.25),sym):'ahorrar '+fmtMoney(neededToSave,sym)+' más este mes'}.</Alert>
          }
          {overBudget.length>0
            ? <Alert type="danger">⚠ {overBudget.map(b=>b.category).join(', ')} excedieron su presupuesto mensual.</Alert>
            : budgets.length>0 && <Alert type="ok">✓ Todos los presupuestos están dentro del límite mensual.</Alert>
          }
          {deseos>0 && totalExpense>0 && <Alert type="warn">→ Gastos "deseo": {fmtMoney(deseos,sym)} ({fmtPct(deseos/totalExpense)}). Regla 50/30/20 sugiere máximo 30% del ingreso neto.</Alert>}
        </div>
      </Card>
      {subMetrics.count > 0 && (
        <Card>
          <CardHeader title="Suscripciones — gasto estimado" />
          <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',marginBottom:12}}>Gasto proyectado · no incluido en los gastos registrados del mes</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}>
            {[
              {lb:'Gasto mensual estimado',v:fmtMoney(subMetrics.monthly,sym)},
              {lb:'Gasto anual estimado',  v:fmtMoney(subMetrics.annual,sym)},
              {lb:'Servicios activos',     v:`${subMetrics.count}`},
              ...(subMetrics.monthlyIncome>0?[{lb:'% del ingreso',v:`${(subMetrics.pct*100).toFixed(1)}%`}]:[]),
            ].map(m=>(
              <div key={m.lb} style={{flex:'1 1 110px',background:'var(--sur2)',borderRadius:6,padding:'8px 10px',border:'.5px solid var(--brd)'}}>
                <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--th)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>{m.lb}</div>
                <div style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:'var(--tx)'}}>{m.v}</div>
              </div>
            ))}
          </div>
          {subMetrics.byCategory.length>0 && (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--th)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:7}}>Por categoría</div>
              {subMetrics.byCategory.map(([cat,data])=>(
                <div key={cat} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'.5px solid var(--brd)',fontSize:12}}>
                  <span style={{color:'var(--tm)'}}>{cat}</span>
                  <span style={{fontFamily:'var(--mono)',color:'var(--tx)'}}>{fmtMoney(data.monthly,sym)}/mes · {data.count} servicio{data.count>1?'s':''}</span>
                </div>
              ))}
            </div>
          )}
          {subMetrics.alerts.map((a,i)=><Alert key={i} type={a.type==='duplicate'?'warn':'info'}>{a.msg}</Alert>)}
          <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',marginTop:8}}>Las sugerencias son orientativas y no constituyen asesoría financiera.</div>
        </Card>
      )}
      {coachSignals.length > 0 && (
        <Card>
          <CardHeader title="⚕ Diagnóstico del mes" />
          <div style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',marginBottom:12}}>Señales orientativas · no constituyen asesoría financiera</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {coachSignals.map((s,i) => (
              <div key={i} style={{borderLeft:`3px solid ${SEV_COLOR[s.severity]}`,paddingLeft:10}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                  <span style={{color:SEV_COLOR[s.severity],fontSize:12}}>{SEV_ICON[s.severity]}</span>
                  <span style={{fontSize:10,fontWeight:600,fontFamily:'var(--mono)',color:SEV_COLOR[s.severity],textTransform:'uppercase',letterSpacing:'.4px'}}>
                    {s.severity === 'warning' ? 'Revisar' : s.severity === 'attention' ? 'Atención' : 'Info'}
                  </span>
                  <span style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--th)',marginLeft:'auto'}}>{s.category}</span>
                </div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--tx)',marginBottom:2}}>{s.title}</div>
                <div style={{fontSize:12,color:'var(--tm)',lineHeight:1.5}}>{s.msg}</div>
                {s.action && <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--grn2)',marginTop:4}}>→ {s.action}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}
      <ReportsDisclaimer />
    </div>
  )
}
