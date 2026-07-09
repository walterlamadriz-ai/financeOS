// src/i18n/useT.js
// Hook de traducción. Lee settings.language del contexto activo (real o demo).
// Si falta una key en el idioma elegido, cae a español; si tampoco existe ahí,
// muestra la propia key (nunca undefined ni pantalla rota).

import { useApp } from '../context/AppContext.jsx'
import { translations } from './translations.js'

function interpolate(str, vars) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`))
}

export function useT() {
  const { settings } = useApp()
  const lang = settings?.language || 'es'

  function t(key, vars) {
    const str = translations[lang]?.[key] ?? translations.es?.[key] ?? key
    return interpolate(str, vars)
  }

  return { t, lang }
}
