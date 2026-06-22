// src/utils/licenseValidator.supabase.js
// VALIDADOR v2.0 — Supabase. PREPARADO, NO WIRED todavía.
// No lo importa nadie aún. Reemplazará a licenseValidator.js SOLO cuando:
//   1) la RPC `validate_license` exista y esté probada en Supabase, y
//   2) VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY estén en Vercel (ya están).
// Swap final: renombrar este archivo a licenseValidator.js (ver LICENSE-V2-SETUP.md, paso 6).
//
// Corrige los 2 bugs de la versión WIP anterior:
//   - bypass offline (aceptaba cualquier clave con formato válido si había cache) → ahora exige coincidencia de clave
//   - sin migración v1→v2 (deslogueaba usuarios activos) → ahora migra fnos_license_v1 → fnos_license_v2

const LS_V2 = 'fnos_license_v2'
const LS_V1 = 'fnos_license_v1'
const REVALIDATE_MS = 7 * 24 * 60 * 60 * 1000 // re-valida online cada 7 días
const KEY_RE = /^FNOS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

function readCache()  { try { return JSON.parse(localStorage.getItem(LS_V2) || 'null') } catch { return null } }
function writeCache(o) { try { localStorage.setItem(LS_V2, JSON.stringify(o)) } catch {} }

// Migración v1 → v2 (no desloguear a quien ya activó en v1.x offline)
;(function migrateV1() {
  try {
    if (localStorage.getItem(LS_V2)) return
    const old = localStorage.getItem(LS_V1)
    if (old) writeCache({ key: old.trim().toUpperCase(), plan: 'personal', ts: 0 }) // ts:0 → revalida online pronto
  } catch {}
})()

async function verifyOnline(key) {
  if (!SUPABASE_URL || !SUPABASE_ANON) return { offline: true }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/validate_license`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_key: key }),
    })
    if (!res.ok) return { offline: true, httpError: res.status } // RPC 404 / red → tratar como offline
    const data = await res.json()
    if (data && data.valid) return { valid: true, plan: data.plan || 'personal' }
    return { valid: false }
  } catch { return { offline: true } }
}

// Activación: el usuario ingresa una clave (LicenseGate)
export async function validateLicense(key) {
  if (!key) return false
  const clean = key.trim().toUpperCase()
  if (!KEY_RE.test(clean)) return false

  const r = await verifyOnline(clean)
  if (r.valid) { writeCache({ key: clean, plan: r.plan, ts: Date.now() }); return true }
  if (r.offline) {
    // Sin red / RPC caída: aceptar SOLO si coincide con la clave ya activada (no "hay cualquier cache")
    const c = readCache()
    return !!(c && c.key === clean)
  }
  return false // online respondió: clave inválida
}

// ¿Hay sesión activa? (App.jsx la usa en init — debe ser SÍNCRONA)
export function isLicenseActive() {
  const c = readCache()
  if (!c || !c.key) return false
  // Re-validación silenciosa en background si venció el TTL (no bloquea el arranque)
  if (Date.now() - (c.ts || 0) > REVALIDATE_MS) {
    verifyOnline(c.key).then(r => {
      if (r.valid) writeCache({ key: c.key, plan: r.plan, ts: Date.now() })
      else if (r.valid === false) clearLicense() // licencia revocada → desloguear
      // offline: dejar la cache como está
    }).catch(() => {})
  }
  return true
}

export function saveLicense(_key) {}                       // no-op: validateLicense persiste
export function getLicenseKey()  { return readCache()?.key  || '' }
export function getLicensePlan() { return readCache()?.plan || 'personal' }
export function clearLicense()   { try { localStorage.removeItem(LS_V2) } catch {} }
