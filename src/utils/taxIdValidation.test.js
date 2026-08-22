// Fixtures: los ejemplos oficiales ya citados en los comentarios de
// taxIdValidation.js (verificados contra fuentes públicas en el commit
// 33a1361). Fija el resultado esperado para que un cambio futuro en el
// algoritmo de checksum se note en el test, no en producción.
import { describe, it, expect } from 'vitest'
import {
  validateRUT, validateRFC, validateCUIT, validateRIF,
  validateNIF, validateNIFPT, validateVATFormatDE, validateEINFormat,
  validateTaxId,
} from './taxIdValidation.js'

describe('validateRUT (Chile, módulo 11)', () => {
  it('acepta un RUT válido conocido', () => {
    expect(validateRUT('76.086.428-5').valid).toBe(true)
  })
  it('rechaza un dígito verificador incorrecto', () => {
    expect(validateRUT('76086428-6').valid).toBe(false)
  })
  it('rechaza formato inválido', () => {
    expect(validateRUT('abc').reason).toBe('format')
  })
  it('rechaza vacío', () => {
    expect(validateRUT('').reason).toBe('empty')
  })
})

describe('validateRFC (México, ejemplo oficial SAT GODE561231GR8)', () => {
  it('acepta el ejemplo publicado por el SAT', () => {
    const r = validateRFC('GODE561231GR8')
    expect(r.valid).toBe(true)
    expect(r.checkDigit).toBe('8')
  })
  it('rechaza si se altera el dígito verificador', () => {
    expect(validateRFC('GODE561231GR9').valid).toBe(false)
  })
})

describe('validateCUIT (Argentina, pesos 5,4,3,2,7,6,5,4,3,2)', () => {
  it('acepta un CUIT válido conocido', () => {
    expect(validateCUIT('20-12345678-6').valid).toBe(true)
  })
  it('rechaza un CUIT con dígito verificador incorrecto', () => {
    expect(validateCUIT('20123456780').valid).toBe(false)
  })
  it('formatea con guiones', () => {
    expect(validateCUIT('20123456786').formatted).toBe('20-12345678-6')
  })
})

describe('validateRIF (Venezuela, base por tipo V/E/J/P/G)', () => {
  // No hay ejemplo oficial citado en el archivo (a diferencia de MX/ES/PT) —
  // el dígito verificador se obtuvo corriendo el algoritmo real (módulo 11,
  // base V=4) contra V12345678 y probando 0-9, no inventado a mano.
  it('acepta un RIF con dígito verificador correcto (V, calculado)', () => {
    const r = validateRIF('V123456781')
    expect(r.valid).toBe(true)
    expect(r.checkDigit).toBe(1)
  })
  it('rechaza el mismo número con el dígito verificador equivocado', () => {
    expect(validateRIF('V123456789').valid).toBe(false)
  })
  it('rechaza letra de tipo de contribuyente inválida', () => {
    expect(validateRIF('A123456789').reason).toBe('format')
  })
  it('rechaza vacío', () => {
    expect(validateRIF(null).reason).toBe('empty')
  })
})

describe('validateNIF (España, módulo 23, ejemplo canónico 12345678Z)', () => {
  it('acepta el ejemplo canónico', () => {
    expect(validateNIF('12345678Z').valid).toBe(true)
  })
  it('rechaza con letra incorrecta', () => {
    expect(validateNIF('12345678A').valid).toBe(false)
  })
  it('acepta un NIE válido (X/Y/Z + 7 dígitos + letra)', () => {
    expect(validateNIF('X1234567L')).toMatchObject({ valid: true, checkDigit: 'L' })
  })
})

describe('validateNIFPT (Portugal, ejemplo oficial 501442600)', () => {
  it('acepta el ejemplo publicado', () => {
    expect(validateNIFPT('501442600').valid).toBe(true)
  })
  it('rechaza si se altera el dígito verificador', () => {
    expect(validateNIFPT('501442601').valid).toBe(false)
  })
})

describe('validateVATFormatDE / validateEINFormat (solo formato, sin checksum)', () => {
  it('DE: acepta formato DE + 9 dígitos', () => {
    expect(validateVATFormatDE('DE123456789').valid).toBe(true)
  })
  it('DE: rechaza sin prefijo', () => {
    expect(validateVATFormatDE('123456789').valid).toBe(false)
  })
  it('US: acepta formato XX-XXXXXXX', () => {
    const r = validateEINFormat('12-3456789')
    expect(r.valid).toBe(true)
    expect(r.formatted).toBe('12-3456789')
  })
})

describe('validateTaxId (dispatcher)', () => {
  it('rutea CL a checksum RUT', () => {
    expect(validateTaxId('CL', '76.086.428-5')).toMatchObject({ valid: true, method: 'checksum' })
  })
  it('país no soportado devuelve unsupported_country', () => {
    expect(validateTaxId('CO', '123')).toMatchObject({ valid: null, reason: 'unsupported_country' })
  })
})
