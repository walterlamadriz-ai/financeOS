// src/context/AppContext.jsx — v1.2 (QA fixes)
// FIX aplicados:
//   1. DB-first: await dbAdd() ANTES de dispatch() — garantiza persistencia
//   2. Error handling con toast visible al usuario
//   3. BOM UTF-8 en CSV para Excel Windows
//   4. currency guardado como código limpio ('CLP', no 'CLP — Peso chileno')
//   5. activeMonth en settings para filtro por mes
//   6. Loading states para acciones async

import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react'
import {
  dbGetAll, dbAdd, dbDelete, clearAllData,
  getSettings, saveSettings, exportAllData, importAllData,
  isUsingFallback, DEFAULT_SETTINGS,
} from '../core/db/index.js'
import { uid, SEED_INCOMES, SEED_EXPENSES, SEED_BUDGETS, SEED_DEBTS, SEED_GOALS } from '../utils/index.js'

export const AppContext = createContext(null)

const initialState = {
  incomes:  [],
  expenses: [],
  budgets:  [],
  debts:    [],
  goals:    [],
  subscriptions: [],
  settings: DEFAULT_SETTINGS,
  loading:  true,
  toast:    null, // { msg, type } — 'ok' | 'error'
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':      return { ...state, ...action.payload, loading: false }
    case 'ADD_INCOME':   return { ...state, incomes:  [action.item, ...state.incomes] }
    case 'DEL_INCOME':   return { ...state, incomes:  state.incomes.filter(r => r.id !== action.id) }
    case 'ADD_EXPENSE':  return { ...state, expenses: [action.item, ...state.expenses] }
    case 'DEL_EXPENSE':  return { ...state, expenses: state.expenses.filter(r => r.id !== action.id) }
    case 'ADD_BUDGET':   return { ...state, budgets:  [...state.budgets, action.item] }
    case 'DEL_BUDGET':   return { ...state, budgets:  state.budgets.filter(b => b.id !== action.id) }
    case 'ADD_DEBT':     return { ...state, debts:    [...state.debts, action.item] }
    case 'DEL_DEBT':     return { ...state, debts:    state.debts.filter(d => d.id !== action.id) }
    case 'UPDATE_DEBT':  return { ...state, debts:    state.debts.map(d => d.id === action.item.id ? action.item : d) }
    case 'ADD_GOAL':     return { ...state, goals:    [...state.goals, action.item] }
    case 'DEL_GOAL':     return { ...state, goals:    state.goals.filter(g => g.id !== action.id) }
    case 'UPDATE_GOAL':  return { ...state, goals:    state.goals.map(g => g.id === action.item.id ? action.item : g) }
    case 'ADD_SUB':      return { ...state, subscriptions: [action.item, ...state.subscriptions] }
    case 'DEL_SUB':      return { ...state, subscriptions: state.subscriptions.filter(s => s.id !== action.id) }
    case 'UPDATE_SUB':   return { ...state, subscriptions: state.subscriptions.map(s => s.id === action.item.id ? action.item : s) }
    case 'SAVE_SETTINGS':return { ...state, settings: action.settings }
    case 'CLEAR_ALL':    return { ...state, incomes: [], expenses: [], budgets: [], debts: [], goals: [], subscriptions: [] }
    case 'SET_TOAST':    return { ...state, toast: action.toast }
    default:             return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'ok') => {
    dispatch({ type: 'SET_TOAST', toast: { msg, type } })
    setTimeout(() => dispatch({ type: 'SET_TOAST', toast: null }), 3500)
  }, [])

  // ── Hydrate from DB on mount ──────────────────────────────────────────────────
  useEffect(() => {
    async function hydrate() {
      try {
        const [incomes, expenses, budgets, debts, goals, subscriptions, settings] = await Promise.all([
          dbGetAll('incomes'), dbGetAll('expenses'), dbGetAll('budgets'),
          dbGetAll('debts'),   dbGetAll('goals'),    dbGetAll('subscriptions'), getSettings(),
        ])
        dispatch({ type: 'HYDRATE', payload: { incomes, expenses, budgets, debts, goals, subscriptions, settings } })
        document.documentElement.setAttribute('data-theme', settings.theme || 'light')
        if (isUsingFallback()) {
          showToast('Modo compatibilidad activo (localStorage). Los datos se guardan localmente.', 'ok')
        }
      } catch (e) {
        console.error('Hydration error:', e)
        dispatch({ type: 'HYDRATE', payload: {} })
        showToast('Error al cargar datos. Intenta recargar la página.', 'error')
      }
    }
    hydrate()
  }, [])

  // ── Actions — FIX: DB primero, luego dispatch ─────────────────────────────────

  const addIncome = useCallback(async (data) => {
    const item = { ...data, id: uid(), createdAt: new Date().toISOString() }
    try {
      await dbAdd('incomes', item)          // DB primero
      dispatch({ type: 'ADD_INCOME', item }) // UI después de confirmar
    } catch (e) {
      showToast('Error al guardar ingreso. Intenta de nuevo.', 'error')
      throw e
    }
  }, [showToast])

  const delIncome = useCallback(async (id) => {
    try {
      await dbDelete('incomes', id)
      dispatch({ type: 'DEL_INCOME', id })
    } catch (e) {
      showToast('Error al eliminar ingreso.', 'error')
      throw e
    }
  }, [showToast])

  const addExpense = useCallback(async (data) => {
    const item = { ...data, id: uid(), createdAt: new Date().toISOString() }
    try {
      await dbAdd('expenses', item)
      dispatch({ type: 'ADD_EXPENSE', item })
    } catch (e) {
      showToast('Error al guardar gasto. Intenta de nuevo.', 'error')
      throw e
    }
  }, [showToast])

  const delExpense = useCallback(async (id) => {
    try {
      await dbDelete('expenses', id)
      dispatch({ type: 'DEL_EXPENSE', id })
    } catch (e) {
      showToast('Error al eliminar gasto.', 'error')
      throw e
    }
  }, [showToast])

  const addBudget = useCallback(async (data) => {
    const item = { ...data, id: uid() }
    try {
      await dbAdd('budgets', item)
      dispatch({ type: 'ADD_BUDGET', item })
    } catch (e) {
      showToast('Error al guardar presupuesto.', 'error')
      throw e
    }
  }, [showToast])

  const delBudget = useCallback(async (id) => {
    try {
      await dbDelete('budgets', id)
      dispatch({ type: 'DEL_BUDGET', id })
    } catch (e) {
      showToast('Error al eliminar presupuesto.', 'error')
      throw e
    }
  }, [showToast])

  const addDebt = useCallback(async (data) => {
    const item = { ...data, id: uid() }
    try {
      await dbAdd('debts', item)
      dispatch({ type: 'ADD_DEBT', item })
    } catch (e) {
      showToast('Error al guardar deuda.', 'error')
      throw e
    }
  }, [showToast])

  const delDebt = useCallback(async (id) => {
    try {
      await dbDelete('debts', id)
      dispatch({ type: 'DEL_DEBT', id })
    } catch (e) {
      showToast('Error al eliminar deuda.', 'error')
      throw e
    }
  }, [showToast])

  const updateDebt = useCallback(async (item) => {
    try {
      await dbAdd('debts', item)
      dispatch({ type: 'UPDATE_DEBT', item })
    } catch (e) {
      showToast('Error al actualizar deuda.', 'error')
      throw e
    }
  }, [showToast])

  const addGoal = useCallback(async (data) => {
    const item = { ...data, id: uid() }
    try {
      await dbAdd('goals', item)
      dispatch({ type: 'ADD_GOAL', item })
    } catch (e) {
      showToast('Error al guardar meta.', 'error')
      throw e
    }
  }, [showToast])

  const delGoal = useCallback(async (id) => {
    try {
      await dbDelete('goals', id)
      dispatch({ type: 'DEL_GOAL', id })
    } catch (e) {
      showToast('Error al eliminar meta.', 'error')
      throw e
    }
  }, [showToast])

  const updateGoal = useCallback(async (item) => {
    try {
      await dbAdd('goals', item)
      dispatch({ type: 'UPDATE_GOAL', item })
    } catch (e) {
      showToast('Error al actualizar meta.', 'error')
      throw e
    }
  }, [showToast])

  const updateSettings = useCallback(async (settings) => {
    try {
      await saveSettings(settings)
      dispatch({ type: 'SAVE_SETTINGS', settings })
      document.documentElement.setAttribute('data-theme', settings.theme || 'light')
    } catch (e) {
      showToast('Error al guardar ajustes.', 'error')
    }
  }, [showToast])

  const clearAll = useCallback(async () => {
    try {
      await clearAllData()
      dispatch({ type: 'CLEAR_ALL' })
      showToast('Todos los datos fueron borrados.', 'ok')
    } catch (e) {
      showToast('Error al borrar datos.', 'error')
    }
  }, [showToast])

  const loadDemo = useCallback(async () => {
    try {
      await clearAllData()
      const seeds = {
        incomes:  SEED_INCOMES.map(r  => ({ ...r,  id: uid() })),
        expenses: SEED_EXPENSES.map(r => ({ ...r,  id: uid() })),
        budgets:  SEED_BUDGETS.map(r  => ({ ...r,  id: uid() })),
        debts:    SEED_DEBTS.map(r    => ({ ...r,  id: uid() })),
        goals:    SEED_GOALS.map(r    => ({ ...r,  id: uid() })),
      }
      await Promise.all([
        ...seeds.incomes.map(r  => dbAdd('incomes',  r)),
        ...seeds.expenses.map(r => dbAdd('expenses', r)),
        ...seeds.budgets.map(r  => dbAdd('budgets',  r)),
        ...seeds.debts.map(r    => dbAdd('debts',    r)),
        ...seeds.goals.map(r    => dbAdd('goals',    r)),
      ])
      dispatch({ type: 'HYDRATE', payload: seeds })
      showToast('Datos demo cargados correctamente.', 'ok')
    } catch (e) {
      showToast('Error al cargar demo.', 'error')
    }
  }, [showToast])

  // FIX: BOM UTF-8 (\uFEFF) para que Excel Windows muestre acentos correctamente
  const exportCSV = useCallback(() => {
    try {
      const rows = [
        ['Tipo', 'Fecha', 'Descripción', 'Categoría', 'Monto', 'Método', 'Recurrencia', 'Notas'],
        ...state.incomes.map(r  => ['Ingreso', r.date, r.source,      r.category, r.amount,  '',        r.recurrence, r.notes || '']),
        ...state.expenses.map(r => ['Gasto',   r.date, r.description, r.category, -r.amount, r.method,  r.recurrence, r.notes || '']),
      ]
      const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }) // FIX: BOM
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `financeos-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      showToast('CSV exportado correctamente.', 'ok')
    } catch (e) {
      showToast('Error al exportar CSV.', 'error')
    }
  }, [state.incomes, state.expenses, showToast])

  const exportData = useCallback(async () => {
    try {
      const data = await exportAllData()
      // Agregar metadata al respaldo
      const backup = {
        _meta: {
          version:    '1.2',
          app:        'FinanceOS',
          createdAt:  new Date().toISOString(),
          recordCount: {
            incomes:       (data.incomes       || []).length,
            expenses:      (data.expenses      || []).length,
            budgets:       (data.budgets       || []).length,
            debts:         (data.debts         || []).length,
            goals:         (data.goals         || []).length,
            importBatches: (data.importBatches || []).length,
          },
        },
        ...data,
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `financeos-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Respaldo creado correctamente.', 'ok')
    } catch (e) {
      showToast('Error al crear el respaldo.', 'error')
    }
  }, [showToast])

  const importData = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result)
          await importAllData(data)
          const [incomes, expenses, budgets, debts, goals, subscriptions, settings] = await Promise.all([
            dbGetAll('incomes'), dbGetAll('expenses'), dbGetAll('budgets'),
            dbGetAll('debts'),   dbGetAll('goals'),    dbGetAll('subscriptions'), getSettings(),
          ])
          dispatch({ type: 'HYDRATE', payload: { incomes, expenses, budgets, debts, goals, subscriptions, settings } })
          showToast('Datos importados correctamente.', 'ok')
          resolve()
        } catch (err) {
          showToast('Error al importar. Verifica que el archivo sea un backup válido de FinanceOS.', 'error')
          reject(err)
        }
      }
      reader.onerror = () => {
        showToast('No se pudo leer el archivo.', 'error')
        reject(new Error('FileReader error'))
      }
      reader.readAsText(file)
    })
  }, [showToast])

  // ── Subscriptions ─────────────────────────────────────────────
  async function addSubscription(item) {
    try {
      const newItem = { ...item, id: item.id || uid(), createdAt: item.createdAt || new Date().toISOString() }
      await dbAdd('subscriptions', newItem)
      dispatch({ type: 'ADD_SUB', item: newItem })
    } catch (e) { showToast('Error al guardar suscripción. Intenta de nuevo.', 'error') }
  }
  async function deleteSubscription(id) {
    try {
      await dbDelete('subscriptions', id)
      dispatch({ type: 'DEL_SUB', id })
    } catch (e) { showToast('Error al eliminar suscripción.', 'error') }
  }
  async function updateSubscription(item) {
    try {
      await dbAdd('subscriptions', item)
      dispatch({ type: 'UPDATE_SUB', item })
    } catch (e) { showToast('Error al actualizar suscripción.', 'error') }
  }

  const value = {
    ...state,
    addIncome,  delIncome,
    addExpense, delExpense,
    addBudget,  delBudget,
    addDebt,    delDebt,    updateDebt,
    addGoal,    delGoal,    updateGoal,
      addSubscription, deleteSubscription, updateSubscription,
    updateSettings,
    clearAll,   loadDemo,
    exportData, exportCSV,  importData,
    showToast,
  }


  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
