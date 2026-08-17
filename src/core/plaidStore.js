// src/core/plaidStore.js
// Credenciales de Plaid (access_token por institución conectada) — SOLO en
// este dispositivo, nunca se persisten en el servidor. Guardado en el mismo
// object store 'settings' de IndexedDB (ver core/db/index.js), bajo su
// propia key ('plaidItems'), separado a propósito del blob principal de
// settings del usuario: así nunca queda incluido si algún día exportData()
// arma un backup — un access_token de banco no debería poder terminar en un
// archivo JSON que el usuario se manda por mail o guarda suelto.
//
// No usa un objectStore nuevo ni sube DB_VERSION (regla del CLAUDE.md: subirlo
// sin migración rompe la base de usuarios existentes) — 'settings' ya es
// keyPath-less, así que una key nueva alcanza.

import { getDB, isUsingFallback } from './db/index.js'

const KEY = 'plaidItems'
const LS_KEY = 'fos_plaidItems' // mismo criterio de fallback que db/index.js

async function readAll() {
  if (isUsingFallback()) {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
  }
  const db = await getDB()
  if (!db) return []
  return (await db.get('settings', KEY)) || []
}

async function writeAll(items) {
  if (isUsingFallback()) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)) } catch {}
    return
  }
  const db = await getDB()
  if (!db) return
  await db.put('settings', items, KEY)
}

export async function getPlaidItems() {
  return readAll()
}

export async function addPlaidItem(item) {
  const items = await readAll()
  items.push(item)
  await writeAll(items)
  return items
}

export async function updatePlaidItem(itemId, patch) {
  const items = await readAll()
  const next = items.map(it => it.itemId === itemId ? { ...it, ...patch } : it)
  await writeAll(next)
  return next
}

export async function removePlaidItem(itemId) {
  const items = await readAll()
  const next = items.filter(it => it.itemId !== itemId)
  await writeAll(next)
  return next
}

// Identificador estable por instalación para Plaid (client_user_id). No es
// una identidad real — Plaid solo lo pide para su propia gestión de sesión de
// Link. Se genera una vez y se guarda junto a los items.
const CLIENT_USER_ID_KEY = 'plaidClientUserId'

export async function getOrCreateClientUserId() {
  if (isUsingFallback()) {
    let id = localStorage.getItem('fos_' + CLIENT_USER_ID_KEY)
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('fos_' + CLIENT_USER_ID_KEY, id) }
    return id
  }
  const db = await getDB()
  if (!db) return crypto.randomUUID()
  let id = await db.get('settings', CLIENT_USER_ID_KEY)
  if (!id) { id = crypto.randomUUID(); await db.put('settings', id, CLIENT_USER_ID_KEY) }
  return id
}
