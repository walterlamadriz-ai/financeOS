// Fixtures: valores obtenidos corriendo las funciones reales (tarifa §32a EStG
// 2026, tasas de Sozialversicherung 2026 de este mismo archivo) — no calculados
// a mano. Las fórmulas ya fueron verificadas contra bmf-steuerrechner.de en la
// auditoría 2026-08-16 (ver financeos-app/CLAUDE.md); esto es cobertura de
// regresión, no una re-verificación de la ley alemana.
import { describe, it, expect } from 'vitest'
import {
  calcSozialversicherung, impuestoESt, calcSoliAnual, calcDescuentosDE, ESTG_2026,
} from './taxCalcDE.js'

describe('calcSozialversicherung — cuotas del empleado', () => {
  it('bajo los topes, NW, sin hijos (Kinderlosenzuschlag aplica)', () => {
    const s = calcSozialversicherung(4000, { bundesland: 'NW', hatKinder: false })
    expect(s).toMatchObject({ rentenversicherung: 372, arbeitslosenversicherung: 52, pflegeversicherung: 96, krankenversicherung: 350 })
    expect(s.total).toBe(870)
  })
  it('Sajonia (SN) reparte Pflegeversicherung distinto, y con hijos no paga el Zuschlag', () => {
    const s = calcSozialversicherung(4000, { bundesland: 'SN', hatKinder: true })
    // 2.3% (SN) sin el +0.6% (tiene hijos) = menos que el caso NW sin hijos de arriba
    expect(s.pflegeversicherung).toBe(92)
    expect(s.total).toBe(866)
  })
  it('sobre las Beitragsbemessungsgrenzen, las cuotas se topan', () => {
    const s = calcSozialversicherung(10000, { bundesland: 'NW', hatKinder: false })
    // capadas a BBG_RV_MENSUAL=8450 (RV/ALV) y BBG_KV_MENSUAL=5812.5 (KV/PV)
    expect(s).toMatchObject({ rentenversicherung: 786, arbeitslosenversicherung: 110, pflegeversicherung: 140, krankenversicherung: 509 })
  })
})

describe('impuestoESt — tarifa continua §32a EStG, las 5 zonas', () => {
  it('en el Grundfreibetrag exacto (12.348€) no tributa', () => {
    expect(impuestoESt(ESTG_2026.grundfreibetrag)).toBe(0)
  })
  it('justo por encima del Grundfreibetrag ya tributa (zona 2)', () => {
    expect(impuestoESt(ESTG_2026.grundfreibetrag + 1)).toBeCloseTo(0.1400091451, 6)
  })
  it('en el límite zona2/zona3 (17.799€)', () => {
    expect(impuestoESt(17799)).toBeCloseTo(1034.8720234851, 4)
  })
  it('en el límite zona3/zona4 (69.878€)', () => {
    expect(impuestoESt(69878)).toBeCloseTo(18213.062999171, 3)
  })
  it('zona 4 lineal, en su límite superior (277.825€)', () => {
    expect(impuestoESt(277825)).toBeCloseTo(105550.87, 2)
  })
  it('zona 5 (tasa tope 45%), sobre 277.825€', () => {
    expect(impuestoESt(300000)).toBeCloseTo(115529.62, 2)
  })
  it('es monótona creciente en todo el dominio', () => {
    const puntos = [0, 5000, 12348, 15000, 40000, 69878, 150000, 277825, 500000]
    for (let i = 1; i < puntos.length; i++) {
      expect(impuestoESt(puntos[i])).toBeGreaterThanOrEqual(impuestoESt(puntos[i - 1]))
    }
  })
})

describe('calcSoliAnual — Freigrenze y Milderungszone', () => {
  it('bajo la Freigrenze (20.350€ de Lohnsteuer) no paga nada', () => {
    expect(calcSoliAnual(20000)).toBe(0)
    expect(calcSoliAnual(20350)).toBe(0)
  })
  it('justo sobre la Freigrenze, limitado al 11,9% del exceso (no al 5,5% plano)', () => {
    // 11.9% * (21000-20350) = 77.35 — menor que 5.5%*21000=1155, gana el menor
    expect(calcSoliAnual(21000)).toBeCloseTo(77.35, 2)
  })
  it('lejos de la Milderungszone, converge al 5,5% plano', () => {
    expect(calcSoliAnual(100000)).toBe(5500)
  })
})

describe('calcDescuentosDE — integración completa', () => {
  it('bruto 0 devuelve un objeto todo en cero, no NaN/undefined', () => {
    const d = calcDescuentosDE(0)
    expect(d.netto).toBe(0)
    expect(d.sozialversicherung.total).toBe(0)
    expect(d.lohnsteuer).toBe(0)
  })
  it('NW, soltero, sin iglesia: netto reconcilia contra bruto - deducciones', () => {
    const d = calcDescuentosDE(4000, { bundesland: 'NW', hatKinder: false })
    expect(d.kirchensteuer).toBe(0)
    expect(d.netto).toBe(4000 - d.totalAbzuege)
    expect(d.tasaEfectiva).toBeCloseTo(0.34975, 5)
  })
  it('Baviera con Kirchensteuer (8%, no 9%) sube el total de deducciones', () => {
    const conIglesia = calcDescuentosDE(4000, { bundesland: 'BY', kirchensteuerpflichtig: true, hatKinder: true })
    const sinIglesia = calcDescuentosDE(4000, { bundesland: 'BY', kirchensteuerpflichtig: false, hatKinder: true })
    expect(conIglesia.kirchensteuer).toBeGreaterThan(0)
    expect(sinIglesia.kirchensteuer).toBe(0)
    expect(conIglesia.netto).toBeLessThan(sinIglesia.netto)
  })
})
