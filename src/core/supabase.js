// src/core/supabase.js
// v2.0 — NO INCLUIR EN ZIP DE DISTRIBUCIÓN v1.x
// Cliente Supabase singleton — FinanceOS cloud sync
// Requiere: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env
// Estado: pendiente para v2.0 — CLOUD_ENABLED es false si no hay .env configurado

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const CLOUD_ENABLED = !!(url && key &&
  !url.includes('TU_PROYECTO') &&
  !key.includes('TU_ANON_KEY'))

export const supabase = CLOUD_ENABLED
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        storageKey: 'fnos_cloud_session',
        autoRefreshToken: true,
      },
    })
  : null
