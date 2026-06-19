// src/hooks/usePlan.js
// Determina el plan activo leyendo la licencia guardada en settings.
// Prioridad: licencia FNOS-XXXX en settings > config.plan > 'starter'
//
// Formato de licencia: FNOS-XXXX-XXXX-XXXX (validado por licenseValidator.js)
// El plan se informa por el prefijo del segmento 2:
//   FNOS-PRO-…   → 'pro'
//   FNOS-ENT-…   → 'enterprise'
//   FNOS-STD-… o cualquier otra → 'starter'
// Si no hay licencia guardada se usa config.plan como fallback.

import { useApp } from '../context/AppContext.jsx'
import config from '../config.js'

export function usePlan() {
  const ctx = useApp() || {}
  const settings = ctx.settings || {}
  const licenseKey = (settings.licenseKey || '').toUpperCase().trim()

  let plan = config.plan || 'starter'

  if (licenseKey.startsWith('FNOS-')) {
    const parts = licenseKey.split('-')
    const seg2 = parts[1] || ''
    if (seg2 === 'ENT') plan = 'enterprise'
    else if (seg2 === 'PRO' || config.plan === 'pro') plan = 'pro'
    else plan = 'starter'
  }

  return {
    plan,
    isPro: plan === 'pro' || plan === 'enterprise',
    isEnterprise: plan === 'enterprise',
    isStarter: plan === 'starter',
  }
}
