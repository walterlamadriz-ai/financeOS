// src/core/cloudSync.js
// v2.0 — NO INCLUIR EN ZIP DE DISTRIBUCIÓN v1.x
// Cloud sync via Supabase — auth anónima + JSON blob por usuario
// Patrón: Export-Import Bridge (misma estructura que backup local)
// Estado: pendiente para v2.0 — no activo en producción actual

import { supabase, CLOUD_ENABLED } from './supabase.js'
import { exportAllData } from './db/index.js'

const LS_CLOUD_KEY = 'fnos_cloud_uid'

// ── AUTH ANÓNIMA ─────────────────────────────────────────────────────────────
// Genera (o recupera) una sesión anónima para este dispositivo.
// El user_id se persiste en Supabase session storage automáticamente.
export async function ensureCloudSession() {
  if (!CLOUD_ENABLED) throw new Error('Cloud no configurado')

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) return session.user

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.user
}

// ── PUSH — sube datos locales a la nube ──────────────────────────────────────
export async function cloudPush() {
  if (!CLOUD_ENABLED) throw new Error('Cloud no configurado')

  const user = await ensureCloudSession()
  const payload = await exportAllData()  // mismo formato que backup local

  const { error } = await supabase
    .from('cloud_backups')
    .upsert({
      user_id: user.id,
      data: payload,
      app_version: import.meta.env.VITE_APP_VERSION || '1.5',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) throw error
  return { ok: true, savedAt: new Date().toISOString() }
}

// ── PULL — descarga datos de la nube ─────────────────────────────────────────
export async function cloudPull() {
  if (!CLOUD_ENABLED) throw new Error('Cloud no configurado')

  const user = await ensureCloudSession()

  const { data, error } = await supabase
    .from('cloud_backups')
    .select('data, updated_at, app_version')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return { payload: data.data, savedAt: data.updated_at, version: data.app_version }
}

// ── STATUS — info de la sesión cloud ─────────────────────────────────────────
export async function cloudStatus() {
  if (!CLOUD_ENABLED) return { enabled: false }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { enabled: true, connected: false }

    const { data } = await supabase
      .from('cloud_backups')
      .select('updated_at')
      .eq('user_id', session.user.id)
      .maybeSingle()

    return {
      enabled: true,
      connected: true,
      userId: session.user.id.slice(0, 8) + '…',
      lastSync: data?.updated_at || null,
    }
  } catch {
    return { enabled: true, connected: false }
  }
}
