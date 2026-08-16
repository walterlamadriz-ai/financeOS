// src/pages/IRSPortugal/index.jsx
// Simulador IRS — Portugal. Pasa a ser la tarjeta protagonista (el PPR tiene
// tracción cultural — 2,2M subscritores — pero solo 7% deduce y el ahorro
// medio real es €161/año; el pain diario es entender el IRS anual). El PPR
// (página PPR existente) se mantiene intacto como segundo item de nav.
// Solo visible si settings.country === 'PT'.

import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Card, CardHeader, FormRow, FormGroup, Alert, PageHeader } from '../../components/ui/index.jsx'
import ProGate from '../../components/ui/ProGate.jsx'
import { calcIRSEmpregado, calcIRSRecibosVerdes, ESCALOES_IRS_2026, MINIMO_EXISTENCIA } from '../../utils/irsPT.js'

const fmtEUR = (n) => `€${Math.round(Number(n) || 0).toLocaleString('pt-PT')}`

export default function IRSPortugal() {
  const { settings } = useApp()
  const country = (settings.country || 'CL').toUpperCase()

  // Regras dos hooks: TODOS os hooks antes de qualquer return condicional.
  // Se settings.country mudar com o componente montado, um hook depois do
  // return faz o React renderizar menos hooks do que esperava e o ecrã fica
  // em branco. Referência de estrutura correta: pages/Steuer/index.jsx.
  const [modo, setModo] = useState('empregado')

  if (country !== 'PT') {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--th)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Este módulo está disponível apenas para Portugal 🇵🇹
      </div>
    )
  }

  return (
    <ProGate feature="O simulador de IRS">
      <div className="stack">
        <PageHeader title="IRS e retenção" sub="Quanto pagas realmente — e quanto te retêm por mês" />

        <Alert type="info">
          ⚠ Estimativa educativa, não é aconselhamento fiscal. Não substitui a sua declaração no Portal das Finanças.
        </Alert>

        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <button type="button" onClick={() => setModo('empregado')} style={{
            flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            border: modo === 'empregado' ? '1.5px solid var(--grn)' : '0.5px solid var(--brd2)',
            background: modo === 'empregado' ? 'var(--grn-bg)' : 'var(--sur2)',
            color: modo === 'empregado' ? 'var(--grn)' : 'var(--tx)',
          }}>Trabalhador dependente</button>
          <button type="button" onClick={() => setModo('verdes')} style={{
            flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            border: modo === 'verdes' ? '1.5px solid var(--grn)' : '0.5px solid var(--brd2)',
            background: modo === 'verdes' ? 'var(--grn-bg)' : 'var(--sur2)',
            color: modo === 'verdes' ? 'var(--grn)' : 'var(--tx)',
          }}>Recibos verdes</button>
        </div>

        {modo === 'empregado' ? <EmpregadoCard /> : <RecibosVerdesCard />}

        <Card>
          <CardHeader title="Escalões IRS 2026" />
          {ESCALOES_IRS_2026.map((e, i) => {
            const desde = i === 0 ? 0 : ESCALOES_IRS_2026[i - 1].hasta
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', color: 'var(--tx)' }}>
                <span>{fmtEUR(desde)} — {e.hasta === Infinity ? 'e acima' : fmtEUR(e.hasta)}</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{(e.tasa * 100).toFixed(1)}%</span>
              </div>
            )
          })}
        </Card>
      </div>
    </ProGate>
  )
}

function EmpregadoCard() {
  const [bruto, setBruto] = useState('')
  const result = useMemo(() => calcIRSEmpregado({ brutoAnual: bruto }), [bruto])

  return (
    <Card>
      <CardHeader title="O teu salário" />
      <FormRow>
        <FormGroup label="Salário bruto anual (€, 14 meses)">
          <input type="number" inputMode="decimal" min="0" value={bruto} placeholder="0" onChange={e => setBruto(e.target.value)} />
        </FormGroup>
      </FormRow>

      {result && result.isento && (
        <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textAlign: 'center', padding: '12px 0' }}>
          ✓ Mínimo de existência ({fmtEUR(MINIMO_EXISTENCIA)}/ano) — isento de IRS.
        </div>
      )}

      {result && (
        <>
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
              {fmtEUR(result.liquidoMensal)}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
              líquido mensal estimado (14 meses) · taxa efetiva de IRS {(result.taxaEfetiva * 100).toFixed(1)}%
            </div>
          </div>
          <div style={{ marginTop: 4, borderTop: '.5px solid var(--brd)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Retenção de IRS / mês</span>
              <span style={{ fontFamily: 'var(--mono)' }}>−{fmtEUR(result.retencaoMensal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Segurança Social / mês (11%)</span>
              <span style={{ fontFamily: 'var(--mono)' }}>−{fmtEUR(result.ssMensal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>IRS anual</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.irsAnual)}</span>
            </div>
            {result.solidariedade > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
                <span>… dos quais taxa adicional de solidariedade</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.solidariedade)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Dedução específica aplicada</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.deducaoEspecifica)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Rendimento coletável</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.rendimentoColetavel)}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, marginTop: 14, padding: '10px 12px', background: 'var(--sur2)', borderRadius: 8, border: '.5px solid var(--brd)' }}>
            Dedução específica (art. 25.º CIRS) = o maior entre €4.587,09 e as contribuições obrigatórias para a Segurança Social (11%)
            {result.deducaoPorSS ? ' — no seu caso mandam as contribuições.' : ' — no seu caso manda o valor fixo.'}
            {' '}O mínimo de existência (art. 70.º) garante que o rendimento depois de IRS nunca desce abaixo de {fmtEUR(MINIMO_EXISTENCIA)}/ano.
            Não inclui deduções de saúde, educação ou habitação — essas reduzem o IRS na declaração anual.
          </div>
        </>
      )}
    </Card>
  )
}

function RecibosVerdesCard() {
  const [faturacao, setFaturacao] = useState('')
  const result = useMemo(() => calcIRSRecibosVerdes({ faturacaoAnual: faturacao }), [faturacao])

  return (
    <Card>
      <CardHeader title="Regime simplificado" />
      <FormRow>
        <FormGroup label="Faturação anual (€)">
          <input type="number" inputMode="decimal" min="0" value={faturacao} placeholder="0" onChange={e => setFaturacao(e.target.value)} />
        </FormGroup>
      </FormRow>

      {result && (
        <>
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
              {fmtEUR(result.irsAnual)}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--th)', marginTop: 6 }}>
              IRS anual estimado · taxa efetiva {(result.taxaEfetiva * 100).toFixed(1)}%
            </div>
          </div>
          <div style={{ marginTop: 4, borderTop: '.5px solid var(--brd)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Base tributável (75% da faturação)</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.baseTributavel)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Dedução por contribuições à SS</span>
              <span style={{ fontFamily: 'var(--mono)' }}>−{fmtEUR(result.deducaoSS)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Rendimento coletável</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.rendimentoColetavel)}</span>
            </div>
            {result.solidariedade > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
                <span>… dos quais taxa adicional de solidariedade</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{fmtEUR(result.solidariedade)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Segurança Social anual (21,4% sobre 70%)</span>
              <span style={{ fontFamily: 'var(--mono)' }}>−{fmtEUR(result.ssAnual)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx)' }}>
              <span>Líquido mensal estimado</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{fmtEUR(result.liquidoMensal)}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--th)', fontFamily: 'var(--mono)', lineHeight: 1.6, marginTop: 14, padding: '10px 12px', background: 'var(--sur2)', borderRadius: 8, border: '.5px solid var(--brd)' }}>
            Regime simplificado — coeficiente 0,75 sobre prestação de serviços profissionais, válido até €200.000/ano de faturação.
            O coeficiente já incorpora os gastos presumidos: não se soma a dedução específica da Categoria A. Deduz-se apenas a parte
            das contribuições obrigatórias que excede 10% do rendimento bruto. As contribuições são estimadas em 21,4% sobre 70% da
            faturação — se estiver isento ou tiver outra base de incidência, o valor real difere. Pagamentos por conta em julho/setembro/dezembro.
          </div>
        </>
      )}
    </Card>
  )
}
