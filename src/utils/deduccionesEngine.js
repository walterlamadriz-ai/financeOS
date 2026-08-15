// src/utils/deduccionesEngine.js
// Orquestador puro del "Optimizador de deducciones" por país.
// NO contiene lógica de ningún país: toda particularidad vive en
// src/config/deducciones/{pais}.js. Agregar un país = un archivo de config.

// Suma los gastos del AÑO por cada bucket deducible del config, leyendo las
// categorías de la app (expense.category) que cada bucket declara en appCats.
export function autofillGastos(config, expenses, year) {
  const out = {}
  if (!config?.categorias) return out
  for (const cat of config.categorias) out[cat.key] = 0
  const y = String(year)
  for (const e of (expenses || [])) {
    if (!e?.date || !String(e.date).startsWith(y)) continue
    for (const cat of config.categorias) {
      if (cat.appCats?.includes(e.category)) {
        out[cat.key] += Number(e.amount) || 0
        break
      }
    }
  }
  for (const k in out) out[k] = Math.round(out[k])
  return out
}

// Delega el cálculo al config del país. Devuelve el resultado o null.
export function calcDeducciones(config, inputs) {
  if (!config || typeof config.calcular !== 'function') return null
  try {
    return config.calcular(inputs || {})
  } catch {
    return null
  }
}

// Registro de configs disponibles (clave = código de país en mayúsculas)
import ec from '../config/deducciones/ec.js'
import pe from '../config/deducciones/pe.js'
import de from '../config/deducciones/de.js'

const REGISTRY = { EC: ec, PE: pe, DE: de }

export function getDeduccionesConfig(country) {
  return REGISTRY[String(country || '').toUpperCase()] || null
}

export const PAISES_CON_DEDUCCIONES = Object.keys(REGISTRY)
