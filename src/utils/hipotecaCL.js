// src/utils/hipotecaCL.js
// Simulador de dividendo hipotecario en UF — Chile.
// Sistema francés (cuota fija en UF): el dividendo en UF NO cambia mes a mes,
// pero su valor en CLP sube con el tiempo porque la UF se reajusta por inflación.
// Es el pain cotidiano #1 de quien tiene crédito hipotecario en Chile.
// NO constituye asesoría financiera — estimación educativa.

// Dividendo mensual fijo en UF (sistema francés / cuota nivelada)
export function calcDividendoUF(saldoUF, tasaAnualPct, plazoAnios) {
  const r = (Number(tasaAnualPct) || 0) / 100 / 12
  const n = (Number(plazoAnios) || 0) * 12
  const saldo = Number(saldoUF) || 0
  if (n <= 0 || saldo <= 0) return 0
  if (r === 0) return saldo / n
  return saldo * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// Proyección del dividendo en CLP a N años, asumiendo que la UF crece a una
// tasa anual constante (histórico Chile ~3-4%/año, sigue el IPC).
export function proyeccionCLP(dividendoUF, ufHoy, crecimientoUFAnualPct, aniosLista = [1, 3, 5, 10]) {
  const uf = Number(ufHoy) || 0
  const g = (Number(crecimientoUFAnualPct) || 0) / 100
  return aniosLista.map(anios => {
    const ufFutura = uf * Math.pow(1 + g, anios)
    return {
      anios,
      ufFutura: Math.round(ufFutura),
      clp: Math.round(dividendoUF * ufFutura),
    }
  })
}

// Impacto de un prepago único hoy: cuántos meses se acorta el crédito y
// cuánto interés total se ahorra, manteniendo el mismo dividendo en UF.
export function calcPrepago(saldoUF, tasaAnualPct, plazoAnios, prepagoUF) {
  const r = (Number(tasaAnualPct) || 0) / 100 / 12
  const saldo = Number(saldoUF) || 0
  const prepago = Math.min(Number(prepagoUF) || 0, saldo)
  const dividendoUF = calcDividendoUF(saldo, tasaAnualPct, plazoAnios)
  const nOriginal = (Number(plazoAnios) || 0) * 12

  if (dividendoUF <= 0 || prepago <= 0) {
    return { mesesAhorrados: 0, interesesAhorradosUF: 0, nuevoPlazoAnios: Number(plazoAnios) || 0 }
  }

  const interesesOriginal = dividendoUF * nOriginal - saldo
  const nuevoSaldo = saldo - prepago

  let nuevoN
  if (r === 0) {
    nuevoN = nuevoSaldo / dividendoUF
  } else {
    // n = -ln(1 - saldo*r/dividendo) / ln(1+r) — despejado de la fórmula de cuota nivelada
    const base = 1 - (nuevoSaldo * r) / dividendoUF
    nuevoN = base > 0 ? -Math.log(base) / Math.log(1 + r) : 0
  }
  const interesesNuevo = Math.max(0, dividendoUF * nuevoN - nuevoSaldo)
  const mesesAhorrados = Math.max(0, nOriginal - nuevoN)

  return {
    mesesAhorrados: Math.round(mesesAhorrados),
    interesesAhorradosUF: Math.round(interesesOriginal - interesesNuevo),
    nuevoPlazoAnios: Math.round((nuevoN / 12) * 10) / 10,
  }
}

// Crecimiento histórico UF de referencia — variación IPC/UF Chile 2015-2025 (INE).
export const CRECIMIENTO_UF_DEFAULT = 3.5 // % anual
