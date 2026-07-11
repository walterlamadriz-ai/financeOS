// src/pages/PPR/index.jsx
// Módulo PPR Portugal (Plano Poupança Reforma) — simulador do benefício fiscal
// Solo visible si settings.country === 'PT'.
// DECISIÓN (Walter, 2026-07-10): los módulos fiscales por país van en el idioma
// del país donde aparecen → esta página está escrita en portugués (como el APV
// chileno está en español).
//
// Reglas (art. 21.º EBF, validadas 2026-07-10):
//   - Dedução à coleta do IRS: 20% do valor aplicado no ano, com tetos por idade
//     (idade a 1 de janeiro): <35 → €400 · 35-50 → €350 · >50 → €300.
//   - Aporte que maximiza o benefício: €2.000 / €1.750 / €1.500 respetivamente.
//   - Após a passagem à reforma, os aportes deixam de ser dedutíveis.
//   - Resgate em condições legais: IRS reduzido (~8% sobre o rendimento).
//   - Resgate fora das condições: devolução das deduções usufruídas +10%/ano.

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, Alert, PageHeader, KPI } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'

const fmtEur = (n) => '€' + (Number(n) || 0).toLocaleString('pt-PT', { maximumFractionDigits: 0 })

// Teto de dedução segundo a idade a 1 de janeiro (art. 21.º EBF)
function deductionCap(age) {
  if (age < 35) return { cap: 400, maxContribution: 2000, bracket: 'menos de 35 anos' }
  if (age <= 50) return { cap: 350, maxContribution: 1750, bracket: '35 a 50 anos' }
  return { cap: 300, maxContribution: 1500, bracket: 'mais de 50 anos' }
}

export default function PPRPage() {
  const { settings } = useApp()
  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true')

  const [f, setF] = useState({
    age:            isDemo ? '32' : '',
    annualContrib:  isDemo ? '1200' : '',
    currentBalance: isDemo ? '5000' : '',
    retireAge:      66,
    expectedReturn: 4,
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const r = useMemo(() => {
    const age = Number(f.age) || 0
    const contrib = Number(f.annualContrib) || 0
    const balance = Number(f.currentBalance) || 0
    const retireAge = Number(f.retireAge) || 66
    const ret = (Number(f.expectedReturn) || 0) / 100
    if (age <= 0) return null

    const { cap, maxContribution, bracket } = deductionCap(age)
    const benefit = Math.min(contrib * 0.20, cap)
    const benefitMaxed = contrib >= maxContribution
    const extraToMax = Math.max(0, maxContribution - contrib)
    const extraBenefit = Math.min(maxContribution * 0.20, cap) - benefit

    // Projeção composta até a reforma (aporte constante no fim de cada ano)
    const years = Math.max(0, retireAge - age)
    let projected = balance
    let totalContrib = 0
    for (let i = 0; i < years; i++) {
      projected = projected * (1 + ret) + contrib
      totalContrib += contrib
    }
    const gains = Math.max(0, projected - balance - totalContrib)
    const exitTax = gains * 0.08 // condições legais de resgate

    return { cap, maxContribution, bracket, benefit, benefitMaxed, extraToMax, extraBenefit,
             years, projected, totalContrib, gains, exitTax,
             totalBenefits: benefit * years }
  }, [f])

  return (
    <ProGate feature="Simulador PPR">
    <div className="stack">
      <PageHeader title="PPR — Plano Poupança Reforma 🇵🇹"
        sub="Simule o benefício fiscal no IRS e a sua poupança até a reforma" />
      <p style={{ fontSize: 12, color: 'var(--th)', fontFamily: 'var(--mono)', marginTop: -4, marginBottom: 8, lineHeight: 1.6 }}>
        Dedução à coleta do IRS: <strong>20% do valor aplicado no ano</strong>, com teto segundo a idade
        (menos de 35 anos: €400 · 35-50: €350 · mais de 50: €300). Conta a idade a 1 de janeiro.
      </p>

      <Card>
        <CardHeader title="Os seus dados" />
        <FormRow>
          <FormGroup label="Idade (a 1 de janeiro)">
            <input type="number" min="18" max="80" value={f.age} placeholder="ex. 32"
              onChange={e => set('age', e.target.value)} />
          </FormGroup>
          <FormGroup label="Aporte anual ao PPR (€)">
            <input type="number" min="0" value={f.annualContrib} placeholder="ex. 1200"
              onChange={e => set('annualContrib', e.target.value)} />
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup label="Saldo atual no PPR (€)">
            <input type="number" min="0" value={f.currentBalance} placeholder="0"
              onChange={e => set('currentBalance', e.target.value)} />
          </FormGroup>
          <FormGroup label="Idade de reforma">
            <input type="number" min="55" max="75" value={f.retireAge}
              onChange={e => set('retireAge', e.target.value)} />
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup label="Retorno anual esperado (%)">
            <input type="number" min="0" max="15" step="0.5" value={f.expectedReturn}
              onChange={e => set('expectedReturn', e.target.value)} />
          </FormGroup>
        </FormRow>
      </Card>

      {r && (Number(f.annualContrib) > 0 || Number(f.currentBalance) > 0) && (
        <>
          <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
            <KPI label="Benefício fiscal deste ano" value={fmtEur(r.benefit)} color="green"
              sub={`teto ${fmtEur(r.cap)} (${r.bracket})`} />
            <KPI label="Poupança projetada" value={fmtEur(r.projected)}
              sub={`aos ${f.retireAge} anos · ${r.years} anos de aportes`} />
            <KPI label="Benefícios fiscais acumulados" value={fmtEur(r.totalBenefits)} color="green"
              sub={`${fmtEur(r.benefit)}/ano × ${r.years} anos (idade atual)`} />
            <KPI label="Rendimentos estimados" value={fmtEur(r.gains)}
              sub={`IRS no resgate legal ≈ ${fmtEur(r.exitTax)} (8%)`} />
          </div>

          {!r.benefitMaxed && r.extraBenefit > 0 && (
            <Alert type="info">
              💡 Aportando mais {fmtEur(r.extraToMax)} este ano (total {fmtEur(r.maxContribution)}),
              o seu benefício fiscal sobe {fmtEur(r.extraBenefit)} até ao máximo de {fmtEur(r.cap)}.
            </Alert>
          )}
          {r.benefitMaxed && (
            <Alert type="ok">
              ✓ Já maximiza a dedução da sua faixa etária: {fmtEur(r.cap)} de benefício com
              {' '}{fmtEur(r.maxContribution)} de aporte. Aportes acima disso continuam a crescer,
              mas sem dedução adicional no IRS.
            </Alert>
          )}

          <Card>
            <CardHeader title="Regras a ter em conta" />
            <ul style={{ fontSize: 12, color: 'var(--tm)', fontFamily: 'var(--mono)', lineHeight: 1.9, paddingLeft: 18, margin: 0 }}>
              <li>A dedução entra nos <strong>limites globais de deduções à coleta</strong> do IRS segundo o escalão de rendimento (sem limite no 1.º escalão; €1.000 acima do último).</li>
              <li>Casais: cada cônjuge com o seu próprio PPR tem o seu próprio benefício.</li>
              <li>Após a passagem à reforma, os aportes deixam de ser dedutíveis.</li>
              <li><strong>Resgate em condições legais</strong> (reforma, 60+ anos com 5 anos de permanência, desemprego de longa duração, doença grave, crédito habitação): IRS reduzido (~8% sobre o rendimento).</li>
              <li><strong>Resgate fora das condições</strong>: devolução das deduções usufruídas, majoradas em 10% por cada ano decorrido.</li>
            </ul>
          </Card>

          <div style={{ fontSize: 10, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, padding: '0 4px' }}>
            Simulação orientativa baseada no art. 21.º do EBF (valores vigentes à data). Não considera
            comissões do produto nem alterações legislativas futuras. Não constitui aconselhamento
            financeiro nem fiscal — confirme com o seu contabilista ou na Autoridade Tributária.
          </div>
        </>
      )}
    </div>
    </ProGate>
  )
}
