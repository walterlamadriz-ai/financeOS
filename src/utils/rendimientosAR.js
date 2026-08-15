// src/utils/rendimientosAR.js
// Comparador de instrumentos en pesos — Argentina. Interés simple sobre TNA
// (tasa nominal anual), que es como la mayoría de bancos/billeteras lo cotizan
// para plazos cortos. NO constituye asesoría financiera.

export function calcRendimiento(capital, tnaPct, dias) {
  const c = Number(capital) || 0
  const tna = (Number(tnaPct) || 0) / 100
  const d = Number(dias) || 0
  const interes = c * tna * (d / 365)
  return { final: Math.round(c + interes), interes: Math.round(interes) }
}

// TNA de referencia — el usuario debe ajustar con la tasa real que le ofrece
// su banco/billetera, que cambia semana a semana. Estos son solo defaults
// razonables para no arrancar con el campo en cero.
export const TNA_DEFAULTS = {
  plazoFijo: 38,
  cuentaRemunerada: 34,
  fciMoneyMarket: 36,
}
