// Protege el bug real que encontró la propia auditoría del build: la primera
// versión de suggestCategory tomaba "COMPRA" (palabra genérica de cartola
// bancaria) como token de comercio, así que "COMPRA CAFE X" y "COMPRA
// DESCONOCIDA Y" matcheaban entre sí y la sugerencia salía mal (falso
// positivo). GENERIC_WORDS lo corrige — este test fija que no vuelva a pasar.
import { describe, it, expect } from 'vitest'
import { suggestCategory } from './fileParser.js'

const existing = [
  { description: 'COMPRA CAFÉ CENTRAL 001', category: 'Alimentación' },
  { description: 'COMPRA CAFE CENTRAL 002', category: 'Alimentación' },
  { description: 'NETFLIX.COM', category: 'Streaming' },
  { description: 'PAGO SIN CATEGORIA ASOCIADA', category: 'Importado' },
  { description: 'COMPRA UBER TRIP', category: 'Transporte' },
  { description: 'COMPRA UBER EATS', category: 'Transporte' },
]

describe('suggestCategory', () => {
  it('sugiere por el nombre del comercio, ignorando tildes', () => {
    expect(suggestCategory('COMPRA CAFÉ CENTRAL 003', existing)).toBe('Alimentación')
  })

  it('matchea aunque la descripción no tenga el prefijo genérico "COMPRA"', () => {
    expect(suggestCategory('CAFE CENTRAL nueva compra', existing)).toBe('Alimentación')
  })

  it('NO sugiere una categoría solo porque comparte la palabra genérica "COMPRA" (regresión real, ya se dio una vez)', () => {
    expect(suggestCategory('COMPRA DESCONOCIDA XYZ', existing)).toBeNull()
  })

  it('nunca sugiere "Importado" — no es una categoría real, es el fallback', () => {
    expect(suggestCategory('PAGO SIN CATEGORIA ASOCIADA otra vez', existing)).toBeNull()
  })

  it('con empate, gana la categoría más frecuente para ese comercio', () => {
    expect(suggestCategory('COMPRA UBER 999', existing)).toBe('Transporte')
  })

  it('sin comercio reconocible, devuelve null', () => {
    expect(suggestCategory('', existing)).toBeNull()
    expect(suggestCategory('123 456', existing)).toBeNull()
  })
})
