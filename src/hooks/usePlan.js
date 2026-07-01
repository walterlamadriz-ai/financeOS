// src/hooks/usePlan.js
// El plan activo se toma del plan de la LICENCIA validada (getLicensePlan del
// validador, cacheado en fnos_license_v2 tras validar contra Supabase).
// - Modo demo (?demo=true): se muestran todas las features (showcase) → 'pro'.
// - Fallback si no hay licencia cacheada: config.plan.
//
// Reemplaza la lógica vieja que leía settings.licenseKey (nunca se seteaba) y
// derivaba el plan del prefijo de la clave (imposible con FNOS-XXXX-XXXX-XXXX).

import { getLicensePlan } from '../utils/licenseValidator.js'
import config from '../config.js'

export function usePlan() {
  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true')
  const plan = isDemo ? 'pro' : (getLicensePlan() || config.plan || 'personal')

  return {
    plan,
    isPro: plan === 'pro' || plan === 'enterprise',
    isEnterprise: plan === 'enterprise',
    isStarter: plan === 'starter',
  }
}
