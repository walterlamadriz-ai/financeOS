// Fija el comportamiento de la guarda `r !== 0` (en vez de `r > 0`) que
// apvCalc.js documenta haber corregido — antes una rentabilidad negativa se
// trataba en silencio como 0%. Sin este test, un futuro cambio de fórmula
// puede reintroducir esa regresión sin que nada lo note.
import { describe, it, expect } from 'vitest'
import { calcAPV } from './apvCalc.js'

describe('calcAPV', () => {
  it('devuelve null sin aporte mensual', () => {
    expect(calcAPV({ monthlyContribution: 0, currentAge: 30, targetAge: 60 })).toBeNull()
  })

  it('devuelve null si la edad objetivo no es mayor a la actual', () => {
    expect(calcAPV({ monthlyContribution: 100000, currentAge: 60, targetAge: 60 })).toBeNull()
  })

  it('con rentabilidad 0%, la proyección es aporte simple sin interés', () => {
    const r = calcAPV({ monthlyContribution: 100000, currentAge: 59, targetAge: 60, expectedReturn: 0 })
    // 12 meses de aporte, sin interés: 12 * 100.000 = 1.200.000
    expect(r.projectionToday).toBe(1200000)
    expect(r.totalContributed).toBe(1200000)
  })

  it('con rentabilidad positiva, el interés compuesto suma por encima del aporte simple', () => {
    const r = calcAPV({ monthlyContribution: 100000, currentAge: 59, targetAge: 60, expectedReturn: 6 })
    expect(r.projectionToday).toBeGreaterThan(r.totalContributed)
  })

  it('con rentabilidad negativa, la fórmula sigue aplicando interés compuesto (no se congela en 0%)', () => {
    // Regresión que el propio código dice haber arreglado: r !== 0 en vez de r > 0.
    const rZero = calcAPV({ monthlyContribution: 100000, currentAge: 59, targetAge: 60, expectedReturn: 0 })
    const rNeg = calcAPV({ monthlyContribution: 100000, currentAge: 59, targetAge: 60, expectedReturn: -4 })
    expect(rNeg.projectionToday).toBeLessThan(rZero.projectionToday)
  })

  it('el saldo ya existente capitaliza el horizonte completo aunque los aportes se acorten', () => {
    const conSaldo = calcAPV({ currentBalance: 1000000, monthlyContribution: 50000, currentAge: 30, targetAge: 35, expectedReturn: 5 })
    const sinSaldo = calcAPV({ currentBalance: 0, monthlyContribution: 50000, currentAge: 30, targetAge: 35, expectedReturn: 5 })
    expect(conSaldo.projectionToday - sinSaldo.projectionToday).toBeGreaterThan(1000000) // el saldo inicial + su propio interés
  })

  it('bonusRegimeA respeta el tope de 6 UTM', () => {
    const r = calcAPV({ monthlyContribution: 10000000, currentAge: 30, targetAge: 31, expectedReturn: 5, utm: 69542 })
    expect(r.bonusRegimeA).toBe(Math.round(6 * 69542))
  })
})
