import { describe, expect, it } from 'vitest'
import { validateTechnicalSystem } from '../../utils/technicalSystem.js'
import { buildCompatibilityValidationContext } from '../rules/compatibility/contextBuilders.js'
import { createDefaultCompatibilityRulesEngine } from '../rules/fixtures/defaultCompatibilityRules.js'
import {
  createCompatibilityInventoryFixture,
  createCompatibilitySystemFixture,
  createOpeningFixture
} from './fixtures/compatibility-fixtures.js'

describe('CompatibilityRulesEngine', () => {
  it('flags incompatible sash type for sliding frame profiles', () => {
    const inventory = createCompatibilityInventoryFixture()
    const system = createCompatibilitySystemFixture({ systemType: 'sliding' })
    const opening = createOpeningFixture({ sashType: 'casement' })

    const validation = validateTechnicalSystem(system, inventory, { opening })

    expect(
      validation.compatibility.errors.some(
        (issue) => issue.ruleId === 'frame-sliding-sash-compatibility'
      )
    ).toBe(true)
  })

  it('flags glass thickness outside supported profile range', () => {
    const inventory = createCompatibilityInventoryFixture()
    const system = createCompatibilitySystemFixture({
      systemType: 'sliding',
      glassInventoryId: 'glass-32'
    })
    const opening = createOpeningFixture({ sashType: 'sliding' })

    const validation = validateTechnicalSystem(system, inventory, { opening })

    expect(
      validation.compatibility.errors.some(
        (issue) => issue.ruleId === 'glass-thickness-range-sliding'
      )
    ).toBe(true)
  })

  it('flags accessory family mismatch (roller on fixed profile)', () => {
    const inventory = createCompatibilityInventoryFixture()
    const system = createCompatibilitySystemFixture({
      systemType: 'fixed',
      accessories: [
        {
          id: 'acc-fixed-roller',
          name: 'Sliding roller hardware',
          qtyPerWindow: 2,
          inventoryId: 'acc-roller',
          calcMode: 'per_opening',
          sectionType: 'all'
        }
      ]
    })
    const opening = createOpeningFixture({
      sashType: 'fixed',
      sections: [{ id: 1, type: 'fixed', h: '' }]
    })

    const validation = validateTechnicalSystem(system, inventory, { opening })

    expect(
      validation.compatibility.errors.some((issue) => issue.ruleId === 'accessory-roller-family')
    ).toBe(true)
  })

  it('flags hardware that conflicts with opening direction', () => {
    const inventory = createCompatibilityInventoryFixture()
    const system = createCompatibilitySystemFixture({
      accessories: [
        {
          id: 'acc-right-only',
          name: 'Right handle lock',
          qtyPerWindow: 1,
          inventoryId: 'acc-right-handle',
          calcMode: 'per_opening',
          sectionType: 'sash'
        }
      ]
    })
    const opening = createOpeningFixture({
      direction: 'left',
      openingDirection: 'left',
      sashType: 'sliding'
    })

    const validation = validateTechnicalSystem(system, inventory, { opening })

    expect(
      validation.compatibility.errors.some((issue) => issue.ruleId === 'hardware-opening-direction')
    ).toBe(true)
  })

  it('passes realistic valid fixture without compatibility errors', () => {
    const inventory = createCompatibilityInventoryFixture()
    const system = createCompatibilitySystemFixture({
      accessories: [
        {
          id: 'acc-valid-handle',
          name: 'Right handle lock',
          qtyPerWindow: 1,
          inventoryId: 'acc-right-handle',
          calcMode: 'per_opening',
          sectionType: 'sash'
        },
        {
          id: 'acc-valid-roller',
          name: 'Sliding roller hardware',
          qtyPerWindow: 2,
          inventoryId: 'acc-roller',
          calcMode: 'per_opening',
          sectionType: 'sash'
        }
      ]
    })
    const opening = createOpeningFixture({
      direction: 'right',
      openingDirection: 'right',
      sashType: 'sliding'
    })

    const context = buildCompatibilityValidationContext({
      system: validateTechnicalSystem(system, inventory).normalized,
      inventory,
      opening
    })
    const result = createDefaultCompatibilityRulesEngine().validate(context)

    expect(result.errors.length).toBe(0)
  })
})
