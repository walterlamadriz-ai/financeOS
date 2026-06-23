// src/config/multimoneda/ve.js
// Venezuela — Panel multimoneda BsS↔USD (preservación de valor).
// Fuente tasa: BCV. La tasa es EDITABLE por el usuario (la volatilidad se delega
// al usuario en vez de depender de una API). Default + fecha visibles.

const TASA_DEFAULT = 612.43       // Bs/USD · BCV jun-2026 (referencial, editable)

export default {
  pais: 'VE',
  nombre: 'Venezuela',
  monedaBase: 'USD',
  symUSD: '$',
  symBs: 'Bs',
  vigencia: 'jun-2026',
  fuente: 'BCV',
  tasaDefault: TASA_DEFAULT,
  titulo: 'Panel multimoneda (BsS ↔ USD)',
  subtitulo: 'Mira tu patrimonio total en dólares y tu exposición al bolívar',
  disclaimer: 'Estimación educativa, no asesoría financiera. La tasa es referencial y editable — actualízala con el valor del día. Tus datos quedan solo en tu dispositivo.',
  umbralExposicion: 30,             // % en BsS que dispara alerta

  calcular({ saldoBsS = 0, saldoUSD = 0, tasa = TASA_DEFAULT }) {
    const bs = Number(saldoBsS) || 0
    const usd = Number(saldoUSD) || 0
    const t = Number(tasa) || TASA_DEFAULT
    if (t <= 0) return null
    const bsEnUSD = bs / t
    const totalUSD = bsEnUSD + usd
    const exposicionBsPct = totalUSD > 0 ? (bsEnUSD / totalUSD) * 100 : 0
    return {
      bsEnUSD: Math.round(bsEnUSD * 100) / 100,
      totalUSD: Math.round(totalUSD * 100) / 100,
      exposicionBsPct,
      alerta: exposicionBsPct > 30,
    }
  },
}
