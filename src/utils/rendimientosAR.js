// src/utils/rendimientosAR.js
// Comparador de instrumentos en pesos — Argentina. Interés simple sobre TNA
// (tasa nominal anual), que es como la mayoría de bancos/billeteras lo cotizan
// para plazos cortos. NO constituye asesoría financiera.

// Interés SIMPLE sobre el período ingresado: correcto para un plazo fijo que
// NO se renueva. Si el usuario simula 365 días, esto subestima lo que rendiría
// el mismo capital renovando cada 30 días — por eso también exponemos la TEA.
export function calcRendimiento(capital, tnaPct, dias) {
  const c = Number(capital) || 0
  const tna = (Number(tnaPct) || 0) / 100
  const d = Number(dias) || 0
  const interes = c * tna * (d / 365)
  return {
    final: Math.round(c + interes),
    interes: Math.round(interes),
    tea: calcTEA(tnaPct),
  }
}

// Tasa Efectiva Anual — lo que rinde el capital si se renueva el plazo al
// vencimiento y los intereses se reinvierten (capitalización compuesta).
// Es el único número comparable entre instrumentos con distinta frecuencia de
// capitalización; la TNA sola no lo es.
export function calcTEA(tnaPct, diasPlazo = 30) {
  const tna = (Number(tnaPct) || 0) / 100
  const d = Number(diasPlazo) || 30
  if (tna <= 0 || d <= 0) return 0
  const tasaPeriodo = tna * (d / 365)
  const periodosPorAno = 365 / d
  return Math.pow(1 + tasaPeriodo, periodosPorAno) - 1
}

// TNA de referencia — el usuario debe ajustar con la tasa real que le ofrece
// su banco/billetera, que cambia semana a semana. Estos son solo defaults
// razonables para no arrancar con el campo en cero.
//
// ⚠ REVISAR PERIÓDICAMENTE: el default ES el número que el usuario lee, porque
// el campo viene precargado y el resultado se muestra al instante. Una tasa
// vieja acá no es un detalle cosmético, es un resultado mal calculado.
//
// Última actualización: 16-ago-2026.
//   · plazoFijo        — promedio de plaza ~19.3% TNA a 30 días; bancos grandes
//                        16%–19.5% (Nación 19%, Provincia 19.5%, Galicia 17.5%).
//   · cuentaRemunerada — billeteras/cuentas remuneradas ~18% (Naranja X 18%);
//                        algunas puntas pagan más (Ualá 26%) pero no son la norma.
//   · fciMoneyMarket   — money market ~17.7% (Mercado Pago 17.7%).
export const TNA_DEFAULTS = {
  plazoFijo: 19,
  cuentaRemunerada: 18,
  fciMoneyMarket: 17.7,
}
