// src/lib/plaidClient.js
// Orquesta el flujo de Plaid Link (conectar banco) y la sincronización
// incremental de movimientos, alimentando el MISMO pipeline que usa el
// import de CSV: dbAdd → rehydrate() → markLocalChange() (regla del
// CLAUDE.md de este repo).
//
// El access_token vive SOLO en este dispositivo (plaidStore.js). Cruza a
// /api/plaid/* únicamente en el momento de conectar o sincronizar — el
// servidor nunca lo guarda. Ver la nota de diseño del commit de esta feature
// para el trade-off frente a "sin servidor, tus datos nunca salen de este
// dispositivo".
//
// Cobertura real de Plaid hoy: EEUU y México. El resto de los países que
// soporta FinanceOS no tiene bancos disponibles — por eso esto solo se
// ofrece cuando settings.country es 'US' o 'MX' (ver Import/index.jsx).

import { dbAdd, dbDelete } from '../core/db/index.js'
import { markLocalChange } from '../core/sync.js'
import { getPlaidItems, addPlaidItem, updatePlaidItem, removePlaidItem, getOrCreateClientUserId } from '../core/plaidStore.js'

const LINK_SCRIPT_URL = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
let scriptPromise = null

function loadPlaidScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.Plaid) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = LINK_SCRIPT_URL
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => { scriptPromise = null; reject(new Error('No se pudo cargar Plaid Link')) }
    document.head.appendChild(s)
  })
  return scriptPromise
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) {
    const err = new Error(json.message || json.error || 'Error de red')
    err.code = json.error
    err.needsReauth = !!json.needsReauth
    throw err
  }
  return json
}

/**
 * Abre el flujo de Plaid Link. Devuelve el item recién conectado, ya
 * sincronizado una primera vez, o null si el usuario cerró el modal sin
 * completar la conexión (no es un error).
 */
export async function connectBank({ language } = {}) {
  await loadPlaidScript()
  const clientUserId = await getOrCreateClientUserId()
  const { linkToken } = await apiPost('/api/plaid/create-link-token', { clientUserId, language })

  const linkResult = await new Promise((resolve, reject) => {
    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess: (public_token, metadata) => resolve({ publicToken: public_token, institutionName: metadata?.institution?.name || '' }),
      onExit: (err) => { if (err) reject(new Error(err.error_message || err.error_code || 'Plaid Link error')); else resolve(null) },
    })
    handler.open()
  })

  if (!linkResult) return null // usuario cerró el modal

  const { accessToken, itemId } = await apiPost('/api/plaid/exchange-token', { publicToken: linkResult.publicToken })
  const item = { itemId, accessToken, institutionName: linkResult.institutionName, cursor: null, linkedAt: Date.now(), lastSyncAt: null }
  await addPlaidItem(item)

  // Verificado en vivo contra el sandbox real: justo después de conectar,
  // Plaid puede tardar unos segundos en tener los movimientos listos — un
  // primer sync inmediato suele traer 0. Reintenta con espera creciente en
  // vez de mostrarle al usuario "0 nuevos" en su primera conexión.
  let result = await syncPlaidItem(item)
  for (let wait = 2000; result.added === 0 && result.modified === 0 && wait <= 8000; wait *= 2) {
    await new Promise(r => setTimeout(r, wait))
    const items = await getPlaidItems()
    const fresh = items.find(it => it.itemId === itemId) || item
    result = await syncPlaidItem(fresh)
  }
  return { ...item, ...result }
}

export async function listPlaidItems() {
  return getPlaidItems()
}

export async function disconnectPlaidItem(itemId) {
  await removePlaidItem(itemId)
}

function mapAndBucket(txn, itemId) {
  const isExpense = Number(txn.amount) > 0 // convención Plaid: positivo = sale dinero
  const record = {
    id: 'plaid_' + txn.transaction_id,
    date: String(txn.date || ''),
    description: String(txn.merchant_name || txn.name || ''),
    concept: String(txn.merchant_name || txn.name || ''),
    amount: Math.abs(Number(txn.amount) || 0),
    category: 'Importado',
    account: String(txn.account_id || ''),
    notes: '',
    source: 'plaid',
    plaidItemId: itemId,
    plaidTransactionId: txn.transaction_id,
    pending: !!txn.pending,
    importedAt: new Date().toISOString(),
    originalDescription: String(txn.name || ''),
  }
  return { record, store: isExpense ? 'expenses' : 'incomes' }
}

/**
 * Sincroniza un item ya conectado: trae added/modified/removed desde el
 * cursor guardado, aplica los cambios a incomes/expenses, y guarda el nuevo
 * cursor. added y modified se tratan igual (delete-en-ambos-baldes +
 * re-insertar en el correcto) porque una transacción "modified" en teoría
 * podría cambiar de signo entre el pending y el posted — no vale la pena
 * asumir que se queda en el mismo balde.
 */
export async function syncPlaidItem(item) {
  const { added, modified, removed, nextCursor } = await apiPost('/api/plaid/sync', {
    accessToken: item.accessToken,
    cursor: item.cursor,
  })

  for (const id of removed) {
    await dbDelete('incomes', 'plaid_' + id).catch(() => {})
    await dbDelete('expenses', 'plaid_' + id).catch(() => {})
  }
  let count = 0
  for (const txn of [...added, ...modified]) {
    const { record, store } = mapAndBucket(txn, item.itemId)
    const otherStore = store === 'expenses' ? 'incomes' : 'expenses'
    await dbDelete(otherStore, record.id).catch(() => {}) // por si cambió de balde
    await dbAdd(store, record)
    count++
  }

  await updatePlaidItem(item.itemId, { cursor: nextCursor, lastSyncAt: Date.now() })

  if (count > 0 || removed.length > 0) {
    try { await markLocalChange() } catch {}
  }

  return { added: added.length, modified: modified.length, removed: removed.length }
}
