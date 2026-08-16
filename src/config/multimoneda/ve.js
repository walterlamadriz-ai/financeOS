// src/config/multimoneda/ve.js
// Venezuela — Panel multimoneda BsS↔USD (preservación de valor).
// Fuente tasa: BCV. La tasa es EDITABLE por el usuario (la volatilidad se delega
// al usuario en vez de depender de una API). Default + fecha visibles.

import { FALLBACK } from '../../utils/tasaVE.js'

// La tasa por defecto sale de tasaVE.js — fuente de verdad única. Antes había
// una constante propia acá (709.69) que quedó desincronizada del fallback del
// util (771.07). No volver a declarar una tasa local en este archivo.
const TASA_DEFAULT = FALLBACK.oficial

const UMBRAL_EXPOSICION = 30 // % en BsS que dispara alerta

export default {
  pais: 'VE',
  nombre: 'Venezuela',
  monedaBase: 'USD',
  symUSD: '$',
  symBs: 'Bs',
  vigencia: 'ago-2026',
  fuente: 'BCV',
  tasaDefault: TASA_DEFAULT,
  titulo: 'Panel multimoneda (BsS ↔ USD)',
  subtitulo: 'Mira tu patrimonio total en dólares y tu exposición al bolívar',
  disclaimer: 'Estimación educativa, no asesoría financiera. La tasa es referencial y editable — actualízala con el valor del día. Tus datos quedan solo en tu dispositivo.',
  umbralExposicion: UMBRAL_EXPOSICION,

  calcular({ saldoBsS = 0, saldoUSD = 0, tasa } = {}) {
    const bs = Number(saldoBsS) || 0
    const usd = Number(saldoUSD) || 0
    const t = Number(tasa)
    // Sin fallback silencioso a TASA_DEFAULT: si la tasa viene vacía o inválida
    // devolvemos null para que la UI pida una tasa válida, en vez de calcular
    // con un valor viejo y presentarlo como si fuera dato en vivo.
    if (!Number.isFinite(t) || t <= 0) return null
    const bsEnUSD = bs / t
    const totalUSD = bsEnUSD + usd
    const exposicionBsPct = totalUSD > 0 ? (bsEnUSD / totalUSD) * 100 : 0
    return {
      bsEnUSD: Math.round(bsEnUSD * 100) / 100,
      totalUSD: Math.round(totalUSD * 100) / 100,
      exposicionBsPct,
      alerta: exposicionBsPct > UMBRAL_EXPOSICION,
    }
  },
}
