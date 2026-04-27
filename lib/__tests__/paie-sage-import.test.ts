import { describe, it, expect } from 'vitest'
import {
  cleanCurrency,
  extractEmployeeInfo,
  validateRequiredColumns,
  COLUMN_MAPPING,
  REQUIRED_COLUMNS,
} from '../paie-sage-import'

// ============================================================
// cleanCurrency
// ============================================================
describe('cleanCurrency', () => {
  it('retourne la valeur telle quelle pour un number natif', () => {
    expect(cleanCurrency(350000)).toBe(350000)
  })

  it('nettoie un espace insécable \\xa0 et retourne le number', () => {
    expect(cleanCurrency('350\xa0000')).toBe(350000)
  })

  it('nettoie une espace fine insécable \\u202f', () => {
    //   = narrow no-break space utilisé par Sage
    expect(cleanCurrency('350 000')).toBe(350000)
  })

  it('nettoie espace + virgule décimale (format Sage typique)', () => {
    expect(cleanCurrency('1 234,56')).toBe(1234.56)
  })

  it('nettoie virgule décimale simple', () => {
    expect(cleanCurrency('295,50')).toBe(295.5)
  })

  it('retourne 0 pour une chaîne vide', () => {
    expect(cleanCurrency('')).toBe(0)
  })

  it('retourne 0 pour null', () => {
    expect(cleanCurrency(null)).toBe(0)
  })

  it('retourne 0 pour undefined', () => {
    expect(cleanCurrency(undefined)).toBe(0)
  })

  it('retourne 0 pour une valeur non numérique', () => {
    expect(cleanCurrency('abc')).toBe(0)
  })

  it('retourne 0 pour le nombre 0', () => {
    expect(cleanCurrency(0)).toBe(0)
  })

  it('retourne 0 pour NaN', () => {
    expect(cleanCurrency(NaN)).toBe(0)
  })
})

// ============================================================
// extractEmployeeInfo
// ============================================================
describe('extractEmployeeInfo', () => {
  it('extrait employee_id et employee_name depuis "EMP001 KOFFI Jean"', () => {
    expect(extractEmployeeInfo('EMP001 KOFFI Jean')).toEqual({
      employee_id: 'EMP001',
      employee_name: 'KOFFI Jean',
    })
  })

  it('conserve le tiret dans employee_name pour "EMP001 - KOFFI Jean"', () => {
    expect(extractEmployeeInfo('EMP001 - KOFFI Jean')).toEqual({
      employee_id: 'EMP001',
      employee_name: '- KOFFI Jean',
    })
  })

  it('retourne employee_name vide si la valeur est un seul mot', () => {
    expect(extractEmployeeInfo('MAT042')).toEqual({
      employee_id: 'MAT042',
      employee_name: '',
    })
  })

  it('retourne deux chaînes vides pour une entrée vide', () => {
    expect(extractEmployeeInfo('')).toEqual({
      employee_id: '',
      employee_name: '',
    })
  })

  it('retourne deux chaînes vides pour null', () => {
    expect(extractEmployeeInfo(null)).toEqual({
      employee_id: '',
      employee_name: '',
    })
  })
})

// ============================================================
// validateRequiredColumns
// ============================================================
describe('validateRequiredColumns', () => {
  it('retourne null quand toutes les colonnes requises sont présentes', () => {
    const firstRow = {
      'Jours de présence': '',
      'NET A PAYER': '',
      'Salaire de base': '',
    }
    expect(validateRequiredColumns(REQUIRED_COLUMNS, firstRow)).toBeNull()
  })

  it("retourne un message d'erreur pour la première colonne manquante", () => {
    const firstRow = { 'Jours de présence': '' }
    const result = validateRequiredColumns(REQUIRED_COLUMNS, firstRow)
    expect(result).toContain("NET A PAYER")
    expect(result).toContain('manquante')
  })
})

// ============================================================
// COLUMN_MAPPING
// ============================================================
describe('COLUMN_MAPPING', () => {
  it('contient exactement 22 entrées', () => {
    expect(Object.keys(COLUMN_MAPPING)).toHaveLength(22)
  })

  it('mappe "Jours de présence" vers "days_worked"', () => {
    expect(COLUMN_MAPPING['Jours de présence']).toBe('days_worked')
  })

  it('mappe "NET A PAYER" vers "net_to_pay"', () => {
    expect(COLUMN_MAPPING['NET A PAYER']).toBe('net_to_pay')
  })

  it('mappe "*** SALAIRE BRUT ***" vers "gross_salary"', () => {
    expect(COLUMN_MAPPING['*** SALAIRE BRUT ***']).toBe('gross_salary')
  })
})
