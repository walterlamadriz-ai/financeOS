// src/utils/hipotecaCL.js
// Simulador de dividendo hipotecario en UF — Chile.
// Sistema francés (cuota fija en UF): el dividendo en UF NO cambia mes a mes,
// pero su valor en CLP sube con el tiempo porque la UF se reajusta por inflación.
// Es el pain cotidiano #1 de quien tiene crédito hipotecario en Chile.
// NO constituye asesoría financiera — estimación educativa.

// Máximo legal de la comisión de prepago en operaciones reajustables, expresado
// en meses de interés sobre el capital prepagado (Ley 18.010 art. 10).
// En operaciones NO reajustables el máximo es 1 mes.
export const MESES_INTERES_COMISION_PREPAGO = 1.5

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
    return {
      mesesAhorrados: 0,
      interesesAhorradosUF: 0,
      comisionPrepagoUF: 0,
      interesesAhorradosNetosUF: 0,
      nuevoPlazoAnios: Number(plazoAnios) || 0,
    }
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
  const interesesAhorrados = interesesOriginal - interesesNuevo

  // Comisión de prepago (Ley 18.010 art. 10): en operaciones REAJUSTABLES —como
  // un crédito en UF— el banco puede cobrar hasta el equivalente a MES Y MEDIO de
  // intereses calculados sobre el capital que se prepaga. Es el máximo legal: hay
  // bancos que cobran menos o nada, y conviene confirmarlo en la escritura.
  const comisionPrepagoUF = prepago * r * MESES_INTERES_COMISION_PREPAGO

  return {
    mesesAhorrados: Math.round(mesesAhorrados),
    interesesAhorradosUF: Math.round(interesesAhorrados),
    comisionPrepagoUF: Math.round(comisionPrepagoUF * 100) / 100,
    interesesAhorradosNetosUF: Math.round(interesesAhorrados - comisionPrepagoUF),
    nuevoPlazoAnios: Math.round((nuevoN / 12) * 10) / 10,
  }
}

// Crecimiento histórico UF de referencia. El 3,5% que había acá subestimaba la
// serie real: calculado sobre mindicador.cl (la misma fuente que usa la app), el
// CAGR de la UF es ~4,48% a 10 años y ~6,45% a 5 años. Se toma 4,5% como default
// de largo plazo; el usuario puede ajustarlo en el formulario.
export const CRECIMIENTO_UF_DEFAULT = 4.5 // % anual
