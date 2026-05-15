import { describe, expect, it } from 'vitest'
import { evaluateProductionInputReadiness } from '../configuration/productionInputAdvisor.js'

const profileFixture = ({ id, name, systemType }) => ({
  id,
  name,
  systemType
})

describe('ProductionInputAdvisor', () => {
  it('returns full readiness for valid sliding window configuration', () => {
    const result = evaluateProductionInputReadiness({
      profiles: [profileFixture({ id: 1, name: 'قطاع سحاب 90', systemType: 'sliding' })],
      windowInput: {
        elementKind: 'window',
        openingMode: 'sliding',
        width: '2.00',
        height: '1.60',
        quantity: '2',
        isComplex: false,
        sections: [{ id: 1, type: 'sash' }]
      },
      projectInfo: { clientName: 'عميل فعلي' },
      mainSystemId: '1'
    })

    expect(result.selectionPlan.hasEligibleProfiles).toBe(true)
    expect(result.canInsert).toBe(true)
    expect(result.readinessPercent).toBe(100)
    expect(result.nextAction).toBeNull()
  })

  it('flags no-compatible-profile scenario and blocks insertion', () => {
    const result = evaluateProductionInputReadiness({
      profiles: [profileFixture({ id: 2, name: 'قطاع ثابت 70', systemType: 'fixed' })],
      windowInput: {
        elementKind: 'facade',
        openingMode: 'sliding',
        width: '4.00',
        height: '2.80',
        quantity: '1',
        isComplex: false,
        sections: [{ id: 1, type: 'fixed' }]
      },
      projectInfo: { clientName: 'عميل' },
      mainSystemId: '2'
    })

    expect(result.selectionPlan.hasEligibleProfiles).toBe(false)
    expect(result.canInsert).toBe(false)
    expect(
      result.advisoryNotes.some((note) => note.includes('لا يوجد قطاع متوافق'))
    ).toBe(true)
  })

  it('adds section-height advisory when section sum exceeds total height', () => {
    const result = evaluateProductionInputReadiness({
      profiles: [profileFixture({ id: 3, name: 'قطاع سحاب اقتصادي', systemType: 'sliding' })],
      windowInput: {
        elementKind: 'window',
        openingMode: 'sliding',
        width: '1.80',
        height: '1.00',
        quantity: '1',
        isComplex: true,
        sections: [
          { id: 1, type: 'fixed', h: '0.70' },
          { id: 2, type: 'sash', h: '0.50' }
        ]
      },
      projectInfo: { clientName: 'عميل' },
      mainSystemId: '3'
    })

    expect(result.sectionGap).toBeLessThan(0)
    expect(
      result.advisoryNotes.some((note) => note.includes('أكبر من الارتفاع الكلي'))
    ).toBe(true)
  })
})

