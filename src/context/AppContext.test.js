// Cobertura del reducer de AppContext — la única pieza pura del archivo (sin
// DOM ni IndexedDB), y por donde pasa el 100% de las mutaciones de estado.
// No cubre las acciones async (addIncome, exportData, etc.): dependen de
// core/db/index.js (IndexedDB) y del DOM (document, Blob, FileReader), fuera
// del alcance de este vitest.config.js a propósito (ver comentario del archivo:
// "no carga el plugin de React ni VitePWA, innecesario para funciones puras").
import { describe, it, expect } from 'vitest'
import { reducer } from './AppContext.jsx'

const emptyState = {
  incomes: [], expenses: [], budgets: [], debts: [], goals: [], subscriptions: [],
  settings: { language: 'es' }, loading: true, toast: null,
}

describe('HYDRATE', () => {
  it('mezcla el payload y apaga loading', () => {
    const s = reducer(emptyState, { type: 'HYDRATE', payload: { incomes: [{ id: 1 }], settings: { language: 'en' } } })
    expect(s.incomes).toEqual([{ id: 1 }])
    expect(s.settings).toEqual({ language: 'en' })
    expect(s.loading).toBe(false)
  })
  it('con payload vacío conserva el resto del estado sin tocarlo', () => {
    const base = { ...emptyState, incomes: [{ id: 1 }] }
    const s = reducer(base, { type: 'HYDRATE', payload: {} })
    expect(s.incomes).toEqual([{ id: 1 }])
    expect(s.loading).toBe(false)
  })
})

describe('acciones por dominio — cada uno con su propio array, sin cruzarse', () => {
  const domains = [
    { add: 'ADD_INCOME', del: 'DEL_INCOME', upd: 'UPDATE_INCOME', key: 'incomes', prepend: true },
    { add: 'ADD_EXPENSE', del: 'DEL_EXPENSE', upd: 'UPDATE_EXPENSE', key: 'expenses', prepend: true },
    { add: 'ADD_BUDGET', del: 'DEL_BUDGET', upd: 'UPDATE_BUDGET', key: 'budgets', prepend: false },
    { add: 'ADD_DEBT', del: 'DEL_DEBT', upd: 'UPDATE_DEBT', key: 'debts', prepend: false },
    { add: 'ADD_GOAL', del: 'DEL_GOAL', upd: 'UPDATE_GOAL', key: 'goals', prepend: false },
    { add: 'ADD_SUB', del: 'DEL_SUB', upd: 'UPDATE_SUB', key: 'subscriptions', prepend: true },
  ]

  for (const d of domains) {
    describe(d.key, () => {
      it(`${d.add} agrega solo en ${d.key}, ningún otro array cambia`, () => {
        const item = { id: 'x1', amount: 100 }
        const s = reducer(emptyState, { type: d.add, item })
        expect(s[d.key]).toEqual([item])
        for (const other of domains) {
          if (other.key !== d.key) expect(s[other.key]).toEqual(emptyState[other.key])
        }
      })
      it(`${d.add} respeta el orden esperado (${d.prepend ? 'prepend — más nuevo primero' : 'append'})`, () => {
        const withOne = { ...emptyState, [d.key]: [{ id: 'old' }] }
        const s = reducer(withOne, { type: d.add, item: { id: 'new' } })
        expect(s[d.key].map(x => x.id)).toEqual(d.prepend ? ['new', 'old'] : ['old', 'new'])
      })
      it(`${d.del} filtra por id sin tocar los demás`, () => {
        const withTwo = { ...emptyState, [d.key]: [{ id: 'a' }, { id: 'b' }] }
        const s = reducer(withTwo, { type: d.del, id: 'a' })
        expect(s[d.key]).toEqual([{ id: 'b' }])
      })
      it(`${d.upd} reemplaza solo el item con ese id, preserva los otros intactos`, () => {
        const withTwo = { ...emptyState, [d.key]: [{ id: 'a', amount: 1 }, { id: 'b', amount: 2 }] }
        const s = reducer(withTwo, { type: d.upd, item: { id: 'a', amount: 99 } })
        expect(s[d.key]).toEqual([{ id: 'a', amount: 99 }, { id: 'b', amount: 2 }])
      })
      it(`${d.add} no muta el array original (inmutabilidad)`, () => {
        const original = { ...emptyState, [d.key]: [] }
        const originalArr = original[d.key]
        reducer(original, { type: d.add, item: { id: 'x' } })
        expect(original[d.key]).toBe(originalArr)
        expect(originalArr.length).toBe(0)
      })
    })
  }
})

describe('CLEAR_ALL', () => {
  it('vacía los 6 arrays de datos, deja settings/toast/loading intactos', () => {
    const full = {
      incomes: [{ id: 1 }], expenses: [{ id: 1 }], budgets: [{ id: 1 }],
      debts: [{ id: 1 }], goals: [{ id: 1 }], subscriptions: [{ id: 1 }],
      settings: { language: 'de' }, loading: false, toast: { msg: 'x', type: 'ok' },
    }
    const s = reducer(full, { type: 'CLEAR_ALL' })
    expect(s.incomes).toEqual([]); expect(s.expenses).toEqual([]); expect(s.budgets).toEqual([])
    expect(s.debts).toEqual([]); expect(s.goals).toEqual([]); expect(s.subscriptions).toEqual([])
    expect(s.settings).toEqual({ language: 'de' })
    expect(s.toast).toEqual({ msg: 'x', type: 'ok' })
  })
})

describe('SAVE_SETTINGS', () => {
  it('reemplaza settings completo, no lo mezcla con el anterior', () => {
    const base = { ...emptyState, settings: { language: 'es', currency: 'CLP' } }
    const s = reducer(base, { type: 'SAVE_SETTINGS', settings: { language: 'en' } })
    expect(s.settings).toEqual({ language: 'en' }) // sin currency: reemplazo total, no merge
  })
})

describe('SET_TOAST', () => {
  it('setea y limpia el toast', () => {
    const s1 = reducer(emptyState, { type: 'SET_TOAST', toast: { msg: 'hola', type: 'ok' } })
    expect(s1.toast).toEqual({ msg: 'hola', type: 'ok' })
    const s2 = reducer(s1, { type: 'SET_TOAST', toast: null })
    expect(s2.toast).toBeNull()
  })
})

describe('acción desconocida', () => {
  it('devuelve el mismo estado sin cambios (misma referencia, no solo mismo valor)', () => {
    const s = reducer(emptyState, { type: 'ALGO_QUE_NO_EXISTE' })
    expect(s).toBe(emptyState)
  })
})
