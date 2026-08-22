// Cubre la detección de subas de precio agregada sobre generateAlerts()
// existente (duplicados/ingreso%/próximo pago ya estaban, priceIncrease es
// nuevo — ver el registro de priceHistory en save()).
import { describe, it, expect } from 'vitest'
import { generateAlerts } from './index.jsx'

describe('generateAlerts — priceIncrease', () => {
  it('alerta cuando el monto actual es mayor al último registrado en priceHistory', () => {
    const subs = [
      { id: '1', name: 'Netflix', category: 'Streaming', amount: 12990, frequency: 'monthly', status: 'active', priceHistory: [{ amount: 9990, at: '2026-06-01' }] },
    ]
    const alerts = generateAlerts(subs, 500000)
    const found = alerts.find(a => a.type === 'priceIncrease')
    expect(found).toBeTruthy()
    expect(found.msg).toContain('Netflix')
  })

  it('no alerta si nunca cambió de precio (priceHistory vacío)', () => {
    const subs = [
      { id: '2', name: 'Spotify', category: 'Música', amount: 5990, frequency: 'monthly', status: 'active', priceHistory: [] },
    ]
    const alerts = generateAlerts(subs, 500000)
    expect(alerts.find(a => a.type === 'priceIncrease')).toBeUndefined()
  })

  it('no alerta si el precio bajó (no es una suba)', () => {
    const subs = [
      { id: '3', name: 'Disney+', category: 'Streaming', amount: 6990, frequency: 'monthly', status: 'active', priceHistory: [{ amount: 9990, at: '2026-05-01' }] },
    ]
    const alerts = generateAlerts(subs, 500000)
    expect(alerts.find(a => a.type === 'priceIncrease')).toBeUndefined()
  })

  it('no alerta para suscripciones inactivas', () => {
    const subs = [
      { id: '4', name: 'HBO', category: 'Streaming', amount: 9990, frequency: 'monthly', status: 'inactive', priceHistory: [{ amount: 5990, at: '2026-05-01' }] },
    ]
    const alerts = generateAlerts(subs, 500000)
    expect(alerts.find(a => a.type === 'priceIncrease')).toBeUndefined()
  })
})
