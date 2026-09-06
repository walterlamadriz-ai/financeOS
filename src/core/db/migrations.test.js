// Cobertura del motor de migraciones de IndexedDB — el ítem que hasta ahora
// no tenía ningún test que ejerciera un salto de versión real (ver
// PLAN_REMEDIACION_TECNICA_CARLOS_FINANCEOS.md, punto 1). Usa fake-indexeddb
// porque vitest.config.js corre en entorno 'node' (sin DOM) a propósito para
// el resto de la suite — importar 'fake-indexeddb/auto' solo agrega los
// globals indexedDB/IDBKeyRange, no arrastra jsdom.
import 'fake-indexeddb/auto'
import { openDB } from 'idb'
import { describe, it, expect } from 'vitest'
import { MIGRATIONS, DB_VERSION, runMigrations, runMigrationSteps } from './migrations.js'

let dbCounter = 0
const freshDbName = () => `test-db-${++dbCounter}`

describe('runMigrations — motor genérico (pasos de prueba, no los reales)', () => {
  it('corre solo los pasos con version > oldVersion, en orden', async () => {
    const applied = []
    const steps = [
      { version: 1, migrate: () => applied.push(1) },
      { version: 2, migrate: () => applied.push(2) },
      { version: 3, migrate: () => applied.push(3) },
    ]
    const name = freshDbName()
    // Simula una base que ya está en v1: solo debería faltar aplicar 2 y 3.
    const db = await openDB(name, 3, {
      upgrade(db, oldVersion, newVersion, tx) {
        runMigrationSteps(db, 1, newVersion, tx, steps)
      },
    })
    db.close()
    expect(applied).toEqual([2, 3])
  })

  it('si un paso falla a mitad de camino, la base queda intacta en la versión vieja (abort atómico)', async () => {
    const name = freshDbName()
    // Paso 1: crea 'a' y guarda un registro — esto sí debe sobrevivir.
    const dbV1 = await openDB(name, 1, {
      upgrade(db) { db.createObjectStore('a', { keyPath: 'id' }) },
    })
    await dbV1.put('a', { id: 'x', value: 'original' })
    dbV1.close()

    const buggyStep = [
      { version: 1, migrate() {} },
      {
        version: 2,
        migrate(db, tx) {
          db.createObjectStore('b') // esto se revierte si el paso falla después
          // idb crea tx.done de forma eager al envolver la transacción; si
          // aborta y nadie la lee, Node la reporta como unhandled rejection
          // aparte del rechazo de openDB() (que sí capturamos abajo). No es
          // el error que este test verifica — es plomería de idb.
          tx.done.catch(() => {})
          throw new Error('migración v2 rota a propósito')
        },
      },
    ]

    await expect(
      openDB(name, 2, { upgrade: (db, oldVersion, newVersion, tx) => runMigrationSteps(db, oldVersion, newVersion, tx, buggyStep) })
    ).rejects.toThrow()

    // Reabrir sin forzar upgrade (misma versión vieja): no debe disparar upgrade,
    // 'a' debe seguir con su dato, y 'b' NO debe existir — el createObjectStore
    // de la migración rota se abortó junto con el resto de la transacción.
    const reopened = await openDB(name, 1, {
      upgrade() { throw new Error('no debería dispararse: la base ya está en v1') },
    })
    expect(reopened.objectStoreNames.contains('b')).toBe(false)
    expect(await reopened.get('a', 'x')).toEqual({ id: 'x', value: 'original' })
    reopened.close()
  })
})

describe('MIGRATIONS real de FinanceOS', () => {
  it('instalación limpia (oldVersion=0) crea las 8 stores esperadas con sus índices', async () => {
    const name = freshDbName()
    const db = await openDB(name, DB_VERSION, {
      upgrade: (db, oldVersion, newVersion, tx) => runMigrations(db, oldVersion, newVersion, tx),
    })
    const expected = ['incomes', 'expenses', 'budgets', 'debts', 'goals', 'settings', 'subscriptions', 'importBatches']
    for (const store of expected) expect(db.objectStoreNames.contains(store)).toBe(true)

    const incomesTx = db.transaction('incomes')
    expect(incomesTx.store.indexNames.contains('date')).toBe(true)
    expect(incomesTx.store.indexNames.contains('category')).toBe(true)
    await incomesTx.done
    db.close()
  })

  it('subir de v1 a v2 preserva los datos existentes y agrega subscriptions/importBatches vacíos', async () => {
    const name = freshDbName()
    const v1Migration = MIGRATIONS.find(m => m.version === 1)
    const dbV1 = await openDB(name, 1, { upgrade: (db) => v1Migration.migrate(db) })
    await dbV1.put('incomes', { id: 'inc-1', amount: 500000, date: '2026-09-01', category: 'salario' })
    await dbV1.put('settings', { language: 'es', currency: 'CLP' }, 'main')
    dbV1.close()

    const dbV2 = await openDB(name, 2, {
      upgrade: (db, oldVersion, newVersion, tx) => runMigrations(db, oldVersion, newVersion, tx),
    })
    expect(await dbV2.get('incomes', 'inc-1')).toEqual({ id: 'inc-1', amount: 500000, date: '2026-09-01', category: 'salario' })
    expect(await dbV2.get('settings', 'main')).toEqual({ language: 'es', currency: 'CLP' })
    expect(dbV2.objectStoreNames.contains('subscriptions')).toBe(true)
    expect(dbV2.objectStoreNames.contains('importBatches')).toBe(true)
    expect(await dbV2.getAll('subscriptions')).toEqual([])
    dbV2.close()
  })

  it('DB_VERSION es siempre la versión más alta declarada en MIGRATIONS (no puede desincronizarse)', () => {
    expect(DB_VERSION).toBe(Math.max(...MIGRATIONS.map(m => m.version)))
  })
})
