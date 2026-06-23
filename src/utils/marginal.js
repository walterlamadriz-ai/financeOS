// src/utils/marginal.js
// Helpers de tarifa progresiva (impuesto a la renta) reutilizables por los
// configs del Motor 2. brackets = [{ hasta, rate }] en moneda, orden ascendente,
// último con hasta: Infinity.

export function tasaMarginal(brackets, base) {
  for (const b of brackets) if (base <= b.hasta) return b.rate
  return brackets[brackets.length - 1].rate
}

export function impuestoProgresivo(brackets, base) {
  let imp = 0, prev = 0
  const x = Math.max(0, Number(base) || 0)
  for (const b of brackets) {
    if (x > prev) imp += (Math.min(x, b.hasta) - prev) * b.rate
    prev = b.hasta
    if (x <= b.hasta) break
  }
  return Math.max(0, imp)
}
