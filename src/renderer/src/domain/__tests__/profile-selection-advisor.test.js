import { describe, expect, it } from 'vitest'
import {
  assessProfileCompatibility,
  buildProfileSelectionPlan,
  inferOpeningDemand
} from '../rules/compatibility/profileSelectionAdvisor.js'

const profileFixture = ({ id, name, systemType }) => ({
  id,
  name,
  systemType
})

describe('ProfileSelectionAdvisor', () => {
  it('infers opening demand from explicit element kind and opening mode', () => {
    const demand = inferOpeningDemand({
      elementKind: 'door',
      openingMode: 'hinged',
      sections: [{ id: 1, type: 'sash' }]
    })

    expect(demand.elementKind).toBe('door')
    expect(demand.openingMode).toBe('hinged')
  })

  it('excludes incompatible profile types for a sliding window', () => {
    const opening = {
      elementKind: 'window',
      openingMode: 'sliding',
      sections: [{ id: 1, type: 'sash' }]
    }

    const fixedProfile = profileFixture({
      id: 1,
      name: 'قطاع ثابت 80',
      systemType: 'fixed'
    })
    const slidingProfile = profileFixture({
      id: 2,
      name: 'قطاع سحاب 92',
      systemType: 'sliding'
    })

    const fixedResult = assessProfileCompatibility(fixedProfile, opening)
    const slidingResult = assessProfileCompatibility(slidingProfile, opening)

    expect(fixedResult.eligible).toBe(false)
    expect(fixedResult.exclusions.length).toBeGreaterThan(0)
    expect(slidingResult.eligible).toBe(true)
  })

  it('builds an ordered eligible list and excluded list for a door case', () => {
    const opening = {
      elementKind: 'door',
      openingMode: 'hinged',
      sections: [{ id: 1, type: 'sash' }]
    }

    const plan = buildProfileSelectionPlan(
      [
        profileFixture({ id: 11, name: 'قطاع واجهة ثابت', systemType: 'fixed' }),
        profileFixture({ id: 12, name: 'قطاع مفصلي باب', systemType: 'casement' }),
        profileFixture({ id: 13, name: 'قطاع سحاب باب', systemType: 'sliding' })
      ],
      opening
    )

    expect(plan.hasEligibleProfiles).toBe(true)
    expect(plan.eligible.some((item) => item.profileId === '12')).toBe(true)
    expect(plan.excluded.some((item) => item.profileId === '11')).toBe(true)
  })

  it('returns no eligible profiles when demand is facade-sliding and catalog is fixed-only', () => {
    const opening = {
      elementKind: 'facade',
      openingMode: 'sliding',
      sections: [{ id: 1, type: 'fixed' }]
    }

    const plan = buildProfileSelectionPlan(
      [
        profileFixture({ id: 21, name: 'قطاع ثابت واجهات 70', systemType: 'fixed' }),
        profileFixture({ id: 22, name: 'قطاع ثابت اقتصادي', systemType: 'fixed' })
      ],
      opening
    )

    expect(plan.hasEligibleProfiles).toBe(false)
    expect(plan.eligible.length).toBe(0)
    expect(plan.excluded.length).toBe(2)
  })
})
