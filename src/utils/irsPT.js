// src/utils/irsPT.js
// Simulador IRS — Portugal. Rendimentos 2026 (declaração 2027). Fórmula
// oficial: IRS = rendimento coletável × taxa marginal − parcela a abater.
// Fonte: CalculaPT / Forbes Portugal 2026 (limites atualizados 3,51%).
// NÃO constitui aconselhamento fiscal — estimativa educativa.

export const ESCALOES_IRS_2026 = [
  { hasta: 8342, tasa: 0.125, abater: 0 },
  { hasta: 12587, tasa: 0.157, abater: 266.94 },
  { hasta: 17838, tasa: 0.212, abater: 959.23 },
  { hasta: 23089, tasa: 0.241, abater: 1474.53 },
  { hasta: 29397, tasa: 0.311, abater: 3090.76 },
  { hasta: 43090, tasa: 0.349, abater: 4207.85 },
  { hasta: 46566, tasa: 0.431, abater: 7741.23 },
  { hasta: 86634, tasa: 0.446, abater: 8441.72 },
  { hasta: Infinity, tasa: 0.48, abater: 11387.28 },
]

export const MINIMO_EXISTENCIA = 12880 // €/ano — abaixo disso, isenção total
export const DEDUCAO_ESPECIFICA_A = 4587.09 // categoria A (trabalho dependente), automática
export const COEFICIENTE_SIMPLIFICADO = 0.75 // recibos verdes, prestação de serviços

function calcularIRS(rendimentoColetavel) {
  const rc = Math.max(0, Number(rendimentoColetavel) || 0)
  const escalao = ESCALOES_IRS_2026.find(e => rc <= e.hasta) || ESCALOES_IRS_2026[ESCALOES_IRS_2026.length - 1]
  const irs = Math.max(0, rc * escalao.tasa - escalao.abater)
  return { irs, escalao }
}

// Trabalhador dependente (Categoria A)
export function calcIRSEmpregado({ brutoAnual }) {
  const bruto = Number(brutoAnual) || 0
  if (bruto <= 0) return null

  if (bruto < MINIMO_EXISTENCIA) {
    return { isento: true, irsAnual: 0, taxaEfetiva: 0, retencaoMensal: 0, liquidoMensal: Math.round(bruto / 14) }
  }

  const rendimentoColetavel = Math.max(0, bruto - DEDUCAO_ESPECIFICA_A)
  const { irs, escalao } = calcularIRS(rendimentoColetavel)
  const taxaEfetiva = bruto > 0 ? irs / bruto : 0
  // Portugal paga em 14 meses (2 subsídios) — a retenção incide sobre os 12 meses "normais"
  const retencaoMensal = (bruto / 14) * taxaEfetiva
  const liquidoMensal = (bruto / 14) - retencaoMensal

  return {
    isento: false,
    irsAnual: Math.round(irs),
    taxaEfetiva,
    taxaMarginal: escalao.tasa,
    retencaoMensal: Math.round(retencaoMensal),
    liquidoMensal: Math.round(liquidoMensal),
    rendimentoColetavel: Math.round(rendimentoColetavel),
  }
}

// Recibos verdes — regime simplificado (faturação até €200.000/ano)
export function calcIRSRecibosVerdes({ faturacaoAnual }) {
  const bruto = Number(faturacaoAnual) || 0
  if (bruto <= 0) return null

  const rendimentoColetavel = Math.max(0, bruto * COEFICIENTE_SIMPLIFICADO - DEDUCAO_ESPECIFICA_A)
  const { irs, escalao } = calcularIRS(rendimentoColetavel)
  const taxaEfetiva = bruto > 0 ? irs / bruto : 0

  return {
    irsAnual: Math.round(irs),
    taxaEfetiva,
    taxaMarginal: escalao.tasa,
    rendimentoColetavel: Math.round(rendimentoColetavel),
    baseTributavel: Math.round(bruto * COEFICIENTE_SIMPLIFICADO),
  }
}
