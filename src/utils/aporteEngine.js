// src/utils/aporteEngine.js
// Motor 2 — Ahorro fiscal por aporte previsional. Orquestador puro + registro
// de configs por país. Sin lógica de país: todo vive en config/aporte/{pais}.js

export function calcAporte(config, inputs) {
  if (!config || typeof config.calcular !== 'function') return null
  try { return config.calcular(inputs || {}) } catch { return null }
}

import mx from '../config/aporte/mx.js'
import co from '../config/aporte/co.js'
import us from '../config/aporte/us.js'
import es from '../config/aporte/es.js'

const REGISTRY = { MX: mx, CO: co, US: us, ES: es }

export function getAporteConfig(country) {
  return REGISTRY[String(country || '').toUpperCase()] || null
}

export const PAISES_CON_APORTE = Object.keys(REGISTRY)
