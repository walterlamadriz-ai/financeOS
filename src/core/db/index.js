// src/core/db/index.js — v1.1 (QA fixes)

import { openDB } from 'idb'

const DB_NAME    = 'financeos'
const DB_VERSION = 1
let _db = null
let _useLocalStorage = false

// ─── localStorage fallback (Safari privado / iOS bloqueado) ──────────────────
function lsGet(store)       { try { return JSON.parse(localStorage.getItem(`fos_${store}`) || '[]') } catch { return [] } }
function lsSet(store, data) { try { localStorage.setItem(`fos_${store}`, JSON.stringify(data)) } catch {} }
function lsPut(store, item) { const a = lsGet(store).filter(r => r.id !== item.id); lsSet(store, [...a, item]) }
function lsDel(store, id)   { lsSet(store, lsGet(store).filter(r => r.id !== id)) }
function lsClear(store)     { try { localStorage.removeItem(`fos_${store}`) } catch {} }

// ─── getDB ────────────────────────────────────────────────────────────────────
export async function getDB() {
  if (_useLocalStorage) return null
  if (_db) return _db
  try {
    _db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('incomes')) {
          const s = db.createObjectStore('incomes', { keyPath: 'id' })
          s.createIndex('date', 'date'); s.createIndex('category', 'category')
        }
        if (!db.objectStoreNames.contains('expenses')) {
          const s = db.createObjectStore('expenses', { keyPath: 'id' })
          s.createIndex('date', 'date'); s.createIndex('category', 'category')
        }
        if (!db.objectStoreNames.contains('budgets'))  db.createObjectStore('budgets',  { keyPath: 'id' })
        if (!db.objectStoreNames.contains('debts'))    db.createObjectStore('debts',    { keyPath: 'id' })
        if (!db.objectStoreNames.contains('goals'))    db.createObjectStore('goals',    { keyPath: 'id' })
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings')
      },
      // FIX: manejar eventos de versión para no bloquear otras tabs
      blocked()    { _db?.close(); _db = null },
      blocking()   { _db?.close(); _db = null },
      terminated() { _db = null },
    })
    return _db
  } catch (e) {
    console.warn('IndexedDB no disponible → localStorage fallback:', e.message)
    _useLocalStorage = true
    return null
  }
}

export const isUsingFallback = () => _useLocalStorage

// ─── CRUD genérico ────────────────────────────────────────────────────────────
export async function dbGetAll(store) {
  const db = await getDB()
  if (!db) return lsGet(store)
  return db.getAll(store)
}

export async function dbAdd(store, item) {
  const db = await getDB()
  if (!db) { lsPut(store, item); return item }
  await db.put(store, item)
  return item
}

export async function dbDelete(store, id) {
  const db = await getDB()
  if (!db) { lsDel(store, id); return }
  await db.delete(store, id)
}

// ─── Settings ─────────────────────────────────────────────────────────────────
const SETTINGS_KEY = 'main'
export const DEFAULT_SETTINGS = {
  currency: 'CLP',
  language: 'es',
  theme: 'light',
  savingGoalPct: 25,
  emergencyFundMonths: 5,
  activeMonth: new Date().toISOString().slice(0, 7),
}

export async function getSettings() {
  const db = await getDB()
  let saved = null
  if (!db) { try { saved = JSON.parse(localStorage.getItem('fos_settings')) } catch {} }
  else      { saved = await db.get('settings', SETTINGS_KEY) }
  return { ...DEFAULT_SETTINGS, ...(saved || {}) }
}

export async function saveSettings(settings) {
  const db = await getDB()
  if (!db) { try { localStorage.setItem('fos_settings', JSON.stringify(settings)) } catch {} }
  else     { await db.put('settings', settings, SETTINGS_KEY) }
  return settings
}

// ─── clearAllData — FIX: no mezclar tx.done en Promise.all ───────────────────
export async function clearAllData() {
  const stores = ['incomes', 'expenses', 'budgets', 'debts', 'goals']
  const db = await getDB()
  if (!db) { stores.forEach(lsClear); return }
  const tx = db.transaction(stores, 'readwrite')
  await Promise.all(stores.map(s => tx.objectStore(s).clear()))
  await tx.done  // awaited DESPUÉS de las operaciones, no dentro del array
}

// ─── Export / Import ──────────────────────────────────────────────────────────
export async function exportAllData() {
  const [incomes, expenses, budgets, debts, goals, settings] = await Promise.all([
    dbGetAll('incomes'), dbGetAll('expenses'), dbGetAll('budgets'),
    dbGetAll('debts'),   dbGetAll('goals'),    getSettings(),
  ])
  return { incomes, expenses, budgets, debts, goals, settings, exportedAt: new Date().toISOString(), version: '1.1' }
}

export async function importAllData(data) {
  if (!data || typeof data !== 'object') throw new Error('Formato inválido')
  await clearAllData()
  const db  = await getDB()
  const stores = ['incomes', 'expenses', 'budgets', 'debts', 'goals']
  for (const store of stores) {
    if (!Array.isArray(data[store])) continue
    if (!db) { lsSet(store, data[store]); continue }
    const tx = db.transaction(store, 'readwrite')
    for (const item of data[store]) await tx.store.put(item)
    await tx.done
  }
  if (data.settings) await saveSettings(data.settings)
}
