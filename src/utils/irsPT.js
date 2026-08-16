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

export const MINIMO_EXISTENCIA = 12880 // €/ano — valor de referência 2026 (art. 70.º CIRS)
export const DEDUCAO_ESPECIFICA_A = 4587.09 // categoria A (8,54 × IAS), automática
export const COEFICIENTE_SIMPLIFICADO = 0.75 // recibos verdes, prestação de serviços

// Segurança Social
export const TSU_TRABALHADOR = 0.11 // Categoria A — quota do trabalhador
export const TSU_INDEPENDENTE = 0.214 // Categoria B — trabalhador independente
export const BASE_INCIDENCIA_INDEPENDENTE = 0.70 // 70% do rendimento relevante (prestação de serviços)

// Taxa adicional de solidariedade — art. 68.º-A CIRS. Incide sobre o rendimento
// coletável, POR ESCALÃO (não sobre a totalidade), e SOMA-SE ao IRS dos
// escalões normais do art. 68.º.
export const ESCALOES_SOLIDARIEDADE = [
  { desde: 80000, ate: 250000, taxa: 0.025 },
  { desde: 250000, ate: Infinity, taxa: 0.05 },
]

export function taxaAdicionalSolidariedade(rendimentoColetavel) {
  const rc = Math.max(0, Number(rendimentoColetavel) || 0)
  let adicional = 0
  for (const t of ESCALOES_SOLIDARIEDADE) {
    if (rc > t.desde) adicional += (Math.min(rc, t.ate) - t.desde) * t.taxa
  }
  return adicional
}

// Mínimo de existência (art. 70.º CIRS) — GARANTIA, não um corte binário.
// A lei garante que da aplicação das taxas não pode resultar um rendimento
// líquido de imposto inferior ao valor de referência. Traduzido: o IRS nunca
// pode ser tão alto que o líquido caia abaixo do mínimo de existência.
//
// NOTA (desvio deliberado face à especificação recebida): o teto é calculado
// sobre o rendimento BRUTO, não sobre o coletável. Aplicá-lo ao coletável
// isentaria de IRS toda a gente até ~€17.500 de bruto (porque o coletável já
// vem líquido da dedução específica), o que é tão errado como o corte binário
// que substitui — só que na direção oposta. Sobre o bruto, a garantia legal
// cumpre-se exatamente: bruto − IRS ≥ MINIMO_EXISTENCIA, sempre e sem degrau.
export function aplicarMinimoExistencia(irsCalculado, rendimentoBruto) {
  const irs = Math.max(0, Number(irsCalculado) || 0)
  const tetoIRS = Math.max(0, (Number(rendimentoBruto) || 0) - MINIMO_EXISTENCIA)
  return Math.min(irs, tetoIRS)
}

function calcularIRS(rendimentoColetavel) {
  const rc = Math.max(0, Number(rendimentoColetavel) || 0)
  const escalao = ESCALOES_IRS_2026.find(e => rc <= e.hasta) || ESCALOES_IRS_2026[ESCALOES_IRS_2026.length - 1]
  const irsEscaloes = Math.max(0, rc * escalao.tasa - escalao.abater)
  const solidariedade = taxaAdicionalSolidariedade(rc)
  const adicionalMarginal = rc > 250000 ? 0.05 : rc > 80000 ? 0.025 : 0
  return {
    irs: irsEscaloes + solidariedade,
    irsEscaloes,
    solidariedade,
    escalao,
    taxaMarginal: escalao.tasa + adicionalMarginal,
  }
}

// Trabalhador dependente (Categoria A)
export function calcIRSEmpregado({ brutoAnual }) {
  const bruto = Number(brutoAnual) || 0
  if (bruto <= 0) return null

  // art. 25.º n.º 1 a) CIRS: a dedução específica é o MAIOR entre 8,54 × IAS e
  // as contribuições obrigatórias para a Segurança Social do trabalhador.
  const contribuicoesSS = bruto * TSU_TRABALHADOR
  const deducaoEspecifica = Math.max(DEDUCAO_ESPECIFICA_A, contribuicoesSS)
  const rendimentoColetavel = Math.max(0, bruto - deducaoEspecifica)

  const calc = calcularIRS(rendimentoColetavel)
  const irs = aplicarMinimoExistencia(calc.irs, bruto)
  const isento = irs <= 0

  const taxaEfetiva = bruto > 0 ? irs / bruto : 0
  // Portugal paga em 14 meses (2 subsídios)
  const brutoMensal = bruto / 14
  const retencaoMensal = brutoMensal * taxaEfetiva
  const ssMensal = brutoMensal * TSU_TRABALHADOR
  const liquidoMensal = brutoMensal - retencaoMensal - ssMensal

  return {
    isento,
    irsAnual: Math.round(irs),
    taxaEfetiva,
    taxaMarginal: calc.taxaMarginal,
    solidariedade: Math.round(calc.solidariedade),
    retencaoMensal: Math.round(retencaoMensal),
    ssMensal: Math.round(ssMensal),
    ssAnual: Math.round(contribuicoesSS),
    liquidoMensal: Math.round(liquidoMensal),
    liquidoAnualAposIRS: Math.round(bruto - irs),
    deducaoEspecifica: Math.round(deducaoEspecifica),
    deducaoPorSS: contribuicoesSS > DEDUCAO_ESPECIFICA_A,
    rendimentoColetavel: Math.round(rendimentoColetavel),
  }
}

// Recibos verdes — regime simplificado (faturação até €200.000/ano)
export function calcIRSRecibosVerdes({ faturacaoAnual }) {
  const bruto = Number(faturacaoAnual) || 0
  if (bruto <= 0) return null

  // O coeficiente 0,75 do art. 31.º CIRS JÁ incorpora os gastos presumidos —
  // não se lhe soma a dedução específica da Categoria A (isso duplicaria o
  // benefício). O que é dedutível é a parte das contribuições obrigatórias
  // para a Segurança Social que exceda 10% do rendimento bruto.
  const baseTributavel = bruto * COEFICIENTE_SIMPLIFICADO
  // Aproximação: o independente contribui 21,4% sobre 70% do rendimento
  // relevante. Sem um input real de contribuições, esta é a estimativa padrão.
  const contribuicoesSS = bruto * BASE_INCIDENCIA_INDEPENDENTE * TSU_INDEPENDENTE
  const deducaoSS = Math.max(0, contribuicoesSS - bruto * 0.10)
  const rendimentoColetavel = Math.max(0, baseTributavel - deducaoSS)

  const calc = calcularIRS(rendimentoColetavel)
  const irs = aplicarMinimoExistencia(calc.irs, bruto)

  const taxaEfetiva = bruto > 0 ? irs / bruto : 0
  const liquidoAnual = bruto - irs - contribuicoesSS

  return {
    isento: irs <= 0,
    irsAnual: Math.round(irs),
    taxaEfetiva,
    taxaMarginal: calc.taxaMarginal,
    solidariedade: Math.round(calc.solidariedade),
    ssAnual: Math.round(contribuicoesSS),
    ssMensal: Math.round(contribuicoesSS / 12),
    deducaoSS: Math.round(deducaoSS),
    liquidoAnual: Math.round(liquidoAnual),
    liquidoMensal: Math.round(liquidoAnual / 12),
    rendimentoColetavel: Math.round(rendimentoColetavel),
    baseTributavel: Math.round(baseTributavel),
  }
}
